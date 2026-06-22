import { Request, Response } from "express";
import IncidentModel from "../Models/incidentModel.js";
import UserModel from "../Models/userModel.js";
import campusModel from "../Models/campusModel.js";
import { isIncidentCreateRequest } from "../Types/TypePredicates/incidentTypePredicates.js";
import { IMedia, IncidentCreateRequest, IncidentMulterFiles } from "../Types/incidentTypes.js";
import { uploadOnCloudinary } from "../Utils/cloudinary.js";
import fs from "fs";
import { sendNotificationToUser } from "../Utils/notificationService.js";
import { sendOTPEmail, sendWelcomeEmail, sendAssignmentEmail, sendRejectionEmail } from "../Utils/emailService.js";
import { sendStatusUpdateEmail } from "../Utils/emailService.js";
import { isAdminLike, isSuperAdmin, isOrganizationOwner } from "../Types/TypePredicates/roleHelpers.js";
import { getDistanceMeters } from "../Utils/geofence.js";


// @desc    Submit a new incident
// @route   POST /api/incidents/uploadIncident
// @access  Private (Student/Staff only)
export const createIncident = async (req: Request, res: Response) => {
  console.log("Create Incident route hit");
  try {
    
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (isAdminLike(user.role)) {
      return res.status(403).json({ message: "Admins cannot submit incidents" });
    }

    const body = req.body as IncidentCreateRequest;
    if (!isIncidentCreateRequest(body)) {
      // Remove any uploaded files if validation fails
      const files = (req as any).files as IncidentMulterFiles;
      if (files) {
        Object.values(files).flat().forEach((file) => {
           if (fs.existsSync(file.path)) fs.unlinkSync(file.path)
        });
      }
      return res.status(400).json({ message: "Invalid incident data provided" });
    }

    const { title, description, incidentType, locationText, latitude, longitude, voiceDuration } = body;

    // Handle files
    const files = (req as any).files as IncidentMulterFiles;
    const mediaResults: { images: IMedia[], video: IMedia | null, audio: IMedia | null } = {
      images: [],
      video: null,
      audio: null,
    };

    if (files) {
      // Upload Images

      if (files.images) {
        for (const file of files.images) {
          try {
            console.log("Uploading Images to Cloduinary")
            const result = await uploadOnCloudinary(file.path);
            if (result) {
              console.log("Url returned from cloudinary for saved image", result);
              mediaResults.images.push({
                url: result.secure_url,
                publicId: result.public_id,
                resourceType: result.resource_type,
              });
            }
          } catch (uploadErr) {
            console.error("Cloudinary Image Upload Error:", uploadErr);
          } finally {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          }
        }
      }

      // Upload Video
      if (files.video && files.video[0]) {
        const file = files.video[0];
        try {
          console.log("Uploading Video to Cloduinary")
          const result = await uploadOnCloudinary(file.path);
          if (result) {
            const {url , secure_url , playback_url  } = result;
            
            console.log("Url returned from cloudinary for saved video")
            console.log(`URL : ${url} | SecureURL : ${secure_url} | PlayBackURL : ${playback_url}`)
            mediaResults.video = {
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: result.resource_type,
            };
          }
        } catch (uploadErr) {
          console.error("Cloudinary Video Upload Error:", uploadErr);
        } finally {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }

      // Upload Audio
      if (files.audio && files.audio[0]) {
        const file = files.audio[0];
        try {
          console.log("Uploading Audio to cloudinary")
          const result = await uploadOnCloudinary(file.path);
          if (result) {
            console.log("Url retured from Cloudinary for saved Voice message", result)
            mediaResults.audio = {
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: result.resource_type,
            };
          }
        } catch (uploadErr) {
          console.error("Cloudinary Audio Upload Error:", uploadErr);
        } finally {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }
    }

    // ==================================================
    // TENANT SAFETY — Pull org/campus from the JWT (set during login)
    // ==================================================
    const organizationId = user.organizationId;
    const campusId = user.campusId;

    if (!organizationId || !campusId) {
      return res.status(403).json({ message: "Your account is not linked to an organization or campus." });
    }

    // Verify the campus actually belongs to the user's organization
    const campus = await campusModel.findOne({ _id: campusId, organizationId });
    if (!campus) {
      return res.status(403).json({ message: "Campus does not belong to your organization. Incident submission denied." });
    }

    // Geofence check
    if (latitude && longitude) {
      const distance = getDistanceMeters(
        Number(latitude),
        Number(longitude),
        campus.location.latitude,
        campus.location.longitude
      );

      if (distance > campus.allowedRadiusMeters) {
        // Delete any uploaded temp files on failure
        const files = (req as any).files as IncidentMulterFiles;
        if (files) {
          Object.values(files).flat().forEach((file) => {
             if (fs.existsSync(file.path)) fs.unlinkSync(file.path)
          });
        }
        return res.status(400).json({
          message: `Incident submission denied: You are outside the allowed campus boundary (${Math.round(distance)}m from campus center).`,
        });
      }
    }


    const newIncident = new IncidentModel({
      reporter_id: user.id,
      reporter_role: user.role,
      title,
      description,
      incidentType,
      locationText,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      images: mediaResults.images,
      video: mediaResults.video,
      audio: mediaResults.audio,
      voiceDuration,
      organizationId,
      campusId,
      status: "pending",
    });

    const savedIncident = await newIncident.save();

    // Send acknowledgement email to the reporter (non-blocking)
    try {
      const reporter = await UserModel.findById(user.id);
      if (reporter && (reporter as any).email) {
        await sendStatusUpdateEmail(
          (reporter as any).email,
          (reporter as any).username || '',
          {
            id: savedIncident._id.toString(),
            title: savedIncident.title,
            type: savedIncident.incidentType,
            status: 'reported',
            reason: 'Your incident has been received and acknowledged. Stay tuned and keep your internet connection on to receive updates.'
          },
          false
        );
      }
    } catch (emailErr) {
      console.error('Failed to send incident acknowledgement email:', emailErr);
    }

    //delete files media from server after saving it in database
    res.status(201).json(savedIncident);
  } catch (error: any) {
    console.error("Error creating incident:", error);
    // Cleanup if something exploded
    const files = (req as any).files as IncidentMulterFiles;
    if (files) {
      Object.values(files).flat().forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all incidents for the current user
// @route   GET /api/incidents/my
// @access  Private
export const getMyIncidents = async (req: Request, res: Response) => {
  console.log("getMyINcident Route hit")
  try {
    const user = (req as any).user;
    if (!user) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const incidents = await IncidentModel.find({ reporter_id: user.id })
      .sort({ createdAt: -1 });

    res.status(200).json(incidents);
  } catch (error: any) {
    console.error("Error fetching my incidents:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get a single incident by ID (owned by user or global for admin)
// @route   GET /api/incidents/:id
// @access  Private
export const getIncidentById = async (req: Request, res: Response) => {
  console.log("getIncidentById route hit");
  try {
    const user = (req as any).user;
    if (!user) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const query: any = { _id: (req as any).params.id };
    
    // If not admin, restrict fetch to ONLY incidents they reporter
    if (!isAdminLike(user.role)) {
      query.reporter_id = user.id;
    }

    const incident = await IncidentModel.findOne(query)
      .populate("reporter_id", "username email phone")
      .populate("assigned_to", "username email phoneNumber");

    if (!incident) {
      return res.status(404).json({ message: "Incident not found or not authorized" });
    }

    res.status(200).json(incident);
  } catch (error: any) {
    console.error("Error fetching incident by ID:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all incidents (with optional type filtering)
// @route   GET /api/incidents
// @access  Private (Admin only)
export const getAllIncidents = async (req: Request, res: Response) => {
  console.log("getAllIncidents route hit");
  try {
    const user = req.user;
    if (!user || !isAdminLike(user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { type } = req.query;

    // ==================================================
    // TENANT-SAFE QUERY FILTER based on role
    // ==================================================
    let query: any = {};

    if (isSuperAdmin(user.role)) {
      // super_admin: can see all — optionally filter by org/campus from query params
      if (req.query.organizationId) query.organizationId = req.query.organizationId;
      if (req.query.campusId) query.campusId = req.query.campusId;
    } else if (user.role === "organization_owner") {
      // org_owner: sees all campuses under their org
      query.organizationId = user.organizationId;
    } else {
      // campus_admin, security_incharge, etc.: scoped to their campus
      query.organizationId = user.organizationId;
      query.campusId = user.campusId;
    }

    if (type && type !== "all") {
      query.incidentType = type;
    }

    const incidents = await IncidentModel.find(query)
      .populate("reporter_id", "username email")
      .populate("assigned_to", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(incidents);
  } catch (error: any) {
    console.error("Error fetching all incidents:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get anonymized incident locations for the heatmap
// @route   GET /api/incidents/radar
// @access  Private
export const getIncidentsForRadar = async (req: Request, res: Response) => {
  console.log("getIncidentsForRadar route hit");
  try {
    // We allow ANY authenticated user to see the radar data
    const incidents = await IncidentModel.find({}, {
      latitude: 1,
      longitude: 1,
      incidentType: 1,
      status: 1,
      createdAt: 1,
      _id: 0 // Anonymize by not sending IDs or reporter info
    });

    res.status(200).json(incidents);
  } catch (error: any) {
    console.error("Error fetching radar incidents:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update incident status and notify user
// @route   POST /api/incidents/update-status
// @access  Private (Admin only)
export const updateIncidentStatus = async (req: Request, res: Response) => {
  console.log("updateIncidentStatus route hit");
  try {
    const { incidentId, status, rejectionReason } = req.body;

    if (!incidentId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: "incidentId and status are required" 
      });
    }

    const validStatuses = ["pending", "under_review", "assigned", "resolved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid incident status"
      });
    }

    const statusEmailMessage: Record<string, string> = {
      pending: "Your incident is still pending review. We will update you as soon as the team takes action.",
      under_review: "Your incident is currently under review by the safety team.",
      assigned: "Your incident has been assigned to a security team member and help is on the way.",
      resolved: "Your incident has been resolved. Thank you for your patience and cooperation.",
      rejected: "Your incident report was reviewed and rejected. Please contact campus security for more details."
    };

    // Find and update the incident
    const updatedIncident = await IncidentModel.findByIdAndUpdate(
      incidentId,
      { status },
      { new: true }
    ).populate("reporter_id");

    if (!updatedIncident) {
      return res.status(404).json({ 
        success: false, 
        message: "Incident not found" 
      });
    }

    // Get user details for notification
    const reporter = updatedIncident.reporter_id as any;
    
    // If user has FCM tokens, send notification
    if (reporter && reporter.fcmTokens && reporter.fcmTokens.length > 0) {
      await sendNotificationToUser(reporter._id.toString(), {
        title: "Incident Update",
        body: `Your incident status is now ${status}`,
      });
    }

    // If status is rejected, send rejection email
    if (status === "rejected" && reporter && reporter.email) {
      await sendRejectionEmail(
        reporter.email,
        reporter.username,
        {
          title: updatedIncident.title,
          type: updatedIncident.incidentType,
          reason: rejectionReason
        },
        false
      );
    }

    // Send status update email for other statuses
    if (reporter && reporter.email && status !== 'rejected') {
      try {
        await sendStatusUpdateEmail(
          reporter.email,
          reporter.username,
          {
            id: updatedIncident._id.toString(),
            title: updatedIncident.title,
            type: updatedIncident.incidentType,
            status,
            reason: rejectionReason || statusEmailMessage[status]
          },
          false
        );
      } catch (err) {
        console.error('Failed to send incident status email:', err);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Incident status updated to ${status}`,
      data: updatedIncident,
    });
  } catch (error: any) {
    console.error("Update Incident Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update incident status",
      error: error.message,
    });
  }
};

// @desc    Assign an incident to a security guard
// @route   POST /api/incidents/assign
// @access  Private (Admin only)
export const assignIncident = async (req: Request, res: Response) => {
  console.log("assignIncident route hit");
  try {
    const user = req.user;
    if (!user || !isAdminLike(user.role)) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { incidentId, guardId } = req.body;

    if (!incidentId || !guardId) {
      return res.status(400).json({ success: false, message: "incidentId and guardId are required" });
    }

    // Verify guard exists and has the right role
    const guard = await UserModel.findById(guardId);
    if (!guard || guard.role !== "security_personnel") {
      return res.status(400).json({ success: false, message: "Invalid security personnel ID" });
    }

    const updatedIncident = await IncidentModel.findByIdAndUpdate(
      incidentId,
      {
        status: "assigned",
        assigned_to: guardId,
        assignmentResponse: "pending",
        assignmentNote: null,
      },
      { new: true }
    ).populate("assigned_to", "username email").populate("reporter_id", "username email");

    if (!updatedIncident) {
      return res.status(404).json({ success: false, message: "Incident not found" });
    }

    // 1. Send push notification to the security guard
    console.log(`🔔 Attempting to notify guard: ${guard.username}`);
    console.log(`📱 FCM Tokens found: ${guard.fcmTokens?.length || 0}`);

    if (guard.fcmTokens && guard.fcmTokens.length > 0) {
      console.log("📤 Sending FCM notification...");
      await sendNotificationToUser(guardId, {
        title: "🚨 New Incident Assignment",
        body: `You have been assigned to: ${updatedIncident.title}`,
        data: { incidentId: incidentId.toString(), type: "assignment" },
      });
    } else {
      console.log("⚠️ No FCM tokens found for this guard. Skipping push notification.");
    }

    // 2. Fallback Email Notification (Guard)
    const incidentInfo = {
      id: updatedIncident._id.toString(),
      title: updatedIncident.title,
      type: updatedIncident.incidentType,
      location: updatedIncident.locationText || "Unspecified Campus Location",
      description: updatedIncident.description,
      reporterName: (updatedIncident.reporter_id as any)?.username
    };

    await sendAssignmentEmail(guard.email, guard.username, incidentInfo, true);

    // 3. Fallback Email Notification (Student/Reporter)
    if ((updatedIncident.reporter_id as any)?.email) {
      await sendAssignmentEmail(
        (updatedIncident.reporter_id as any).email,
        (updatedIncident.reporter_id as any).username,
        incidentInfo,
        false
      );
    }

    return res.status(200).json({
      success: true,
      message: `Incident assigned to ${guard.username}. Notifications dispatched via FCM and Email.`,
      data: updatedIncident,
    });
  } catch (error: any) {
    console.error("Assign Incident Error:", error);
    return res.status(500).json({ success: false, message: "Failed to assign incident" });
  }
};

// @desc    Security guard responds to an assignment
// @route   POST /api/incidents/respond-assignment
// @access  Private (Security Personnel only)
export const respondToAssignment = async (req: Request, res: Response) => {
  console.log("respondToAssignment route hit");
  try {
    const user = req.user;
    if (!user || user.role !== "security_personnel") {
      return res.status(403).json({ success: false, message: "Security personnel access required" });
    }

    const guardUser = await UserModel.findById(user.id);
    const guardName = guardUser?.username || "Security Guard";

    const { incidentId, response, note } = req.body;

    if (!incidentId || !response) {
      return res.status(400).json({ success: false, message: "incidentId and response are required" });
    }

    const validResponses = ["responding", "unavailable", "completed"];
    if (!validResponses.includes(response)) {
      return res.status(400).json({ success: false, message: "Invalid response. Must be: responding, unavailable, or completed" });
    }

    const incident = await IncidentModel.findOne({
      _id: incidentId,
      assigned_to: user.id,
    });

    if (!incident) {
      return res.status(404).json({ success: false, message: "Assignment not found or not assigned to you" });
    }

    incident.assignmentResponse = response;
    incident.assignmentNote = note || null;

    // If guard completes the incident, also resolve it
    if (response === "completed") {
      incident.status = "resolved";
    }

    // If guard is unavailable, reset status so admin can reassign, but keep the guard ID for history
    if (response === "unavailable") {
      incident.status = "pending";
    }

    await incident.save();

    // Notify security incharge by email about the guard's response
    try {
      const securityIncharge = await UserModel.findOne({
        role: 'security_incharge',
        organizationId: (incident as any).organizationId,
        campusId: (incident as any).campusId,
      });

      if (securityIncharge && securityIncharge.email) {
        const responseMessage = response === 'completed'
          ? 'has completed the assigned incident response.'
          : response === 'responding'
            ? 'is currently responding to the assigned incident.'
            : 'is unavailable for the assigned incident.';

        await sendStatusUpdateEmail(
          securityIncharge.email,
          securityIncharge.username || 'Security Incharge',
          {
            id: incident._id.toString(),
            title: incident.title,
            type: incident.incidentType,
            status: response,
            reason: `${guardName} ${responseMessage}`
          },
          false
        );
      }
    } catch (emailErr) {
      console.error('Failed to send incident response email to security incharge:', emailErr);
    }

    // Notify admin about the guard's response via broadcast to all admins
    const admins = await UserModel.find({ 
      role: "campus_admin", 
      organizationId: (incident as any).organizationId,
      campusId: (incident as any).campusId,
      fcmTokens: { $exists: true, $not: { $size: 0 } } 
    });

    console.log(`📢 Notifying ${admins.length} admins about guard response: ${response}`);

    for (const admin of admins) {
      if (admin.fcmTokens && admin.fcmTokens.length > 0) {
        console.log(`📤 Sending FCM to admin: ${admin.username} (${admin.fcmTokens.length} tokens)`);
        await sendNotificationToUser(admin._id.toString(), {
          title: response === "responding" ? "✅ Guard Responding" : response === "unavailable" ? "⚠️ Guard Unavailable" : "🎉 Incident Completed",
          body: `${guardName} ${response === "responding" ? "is responding to" : response === "unavailable" ? "is unavailable for" : "has completed"}: ${incident.title}`,
          data: { incidentId: incidentId.toString(), type: "guard_response", response },
        });
      } else {
        console.log(`ℹ️ Admin ${admin.username} has no FCM tokens.`);
      }
    }

    // If guard is responding, also notify the reporter (student)
    if (response === "responding") {
      console.log(`📡 Notifying reporter about guard dispatch...`);
      const reporterIncident = await IncidentModel.findById(incidentId).populate("reporter_id");
      const reporter = reporterIncident?.reporter_id as any;
      if (reporter && reporter.fcmTokens && reporter.fcmTokens.length > 0) {
        console.log(`📤 Sending FCM to reporter: ${reporter.username}`);
        await sendNotificationToUser(reporter._id.toString(), {
          title: "🛡️ Help is on the way!",
          body: `A security guard has been dispatched to your incident: ${incident.title}`,
          data: { incidentId: incidentId.toString(), type: "guard_dispatched" },
        });
      } else {
        console.log(`ℹ️ Reporter has no FCM tokens.`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Response recorded: ${response}`,
      data: incident,
    });
  } catch (error: any) {
    console.error("Respond to Assignment Error:", error);
    return res.status(500).json({ success: false, message: "Failed to respond to assignment" });
  }
};

// @desc    Get all incidents assigned to the current security guard
// @route   GET /api/incidents/my-assignments
// @access  Private (Security Personnel only)
export const getMyAssignments = async (req: Request, res: Response) => {
  console.log("getMyAssignments route hit");
  try {
    const user = req.user;
    if (!user || user.role !== "security_personnel") {
      return res.status(403).json({ success: false, message: "Security personnel access required" });
    }

    const assignments = await IncidentModel.find({ assigned_to: user.id })
      .populate("reporter_id", "username email phoneNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: assignments });
  } catch (error: any) {
    console.error("Get My Assignments Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch assignments" });
  }
};

// @desc    Get all security personnel (for admin assignment dropdown)
// @route   GET /api/admin/security-personnel
// @access  Private (Admin only)
export const getSecurityPersonnel = async (req: Request, res: Response) => {
  console.log("getSecurityPersonnel route hit");
  try {
    const user = req.user;
    if (!user || !isAdminLike(user.role)) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    // Tenant-aware query: scope results by organization/campus depending on requester's role
    const query: any = { role: "security_personnel" };

    if (isSuperAdmin(user.role)) {
      // super_admin can optionally filter via query params
      if (req.query.organizationId) query.organizationId = req.query.organizationId;
      if (req.query.campusId) query.campusId = req.query.campusId;
    } else if (user.role === "organization_owner") {
      // Org owners see guards under their organization
      query.organizationId = user.organizationId;
    } else {
      // Campus-level admins and security incharges should only see guards in their campus
      query.organizationId = user.organizationId;
      query.campusId = user.campusId;
    }

    const guards = await UserModel.find(query)
      .select("_id username email phoneNumber createdAt campusId organizationId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: guards });
  } catch (error: any) {
    console.error("Get Security Personnel Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch security personnel" });
  }
};

// @desc    Get assignment responses from security personnel (for admins/security incharge)
// @route   GET /api/incidents/assignment-responses
// @access  Private (Admin-like roles)
export const getAssignmentResponses = async (req: Request, res: Response) => {
  console.log("getAssignmentResponses route hit");
  try {
    const user = req.user;
    if (!user || !isAdminLike(user.role)) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    // Base query: only incidents where a guard has responded
    const query: any = { assignmentResponse: { $exists: true, $ne: null } };

    // Tenant scoping
    if (isSuperAdmin(user.role)) {
      if (req.query.organizationId) query.organizationId = req.query.organizationId;
      if (req.query.campusId) query.campusId = req.query.campusId;
    } else if (isOrganizationOwner(user.role)) {
      query.organizationId = user.organizationId;
    } else {
      // campus_admin, security_incharge: scoped to their campus
      query.organizationId = user.organizationId;
      query.campusId = user.campusId;
    }

    // Optional filters: assigned guard id
    if (req.query.guardId) {
      query.assigned_to = req.query.guardId;
    }

    const responses = await IncidentModel.find(query)
      .populate("assigned_to", "username email phoneNumber campusId organizationId")
      .populate("reporter_id", "username email")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, data: responses });
  } catch (error: any) {
    console.error("Get Assignment Responses Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch assignment responses" });
  }
};
