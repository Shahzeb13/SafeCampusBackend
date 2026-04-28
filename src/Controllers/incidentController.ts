import { Request, Response } from "express";
import IncidentModel from "../Models/incidentModel.js";
import { isIncidentCreateRequest } from "../Types/TypePredicates/incidentTypePredicates.js";
import { IMedia, IncidentCreateRequest, IncidentMulterFiles } from "../Types/incidentTypes.js";
import { uploadOnCloudinary } from "../Utils/cloudinary.js";
import fs from "fs";
import { sendNotificationToUser } from "../Utils/notificationService.js";

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

    if (user.role === "admin") {
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
      status: "pending",
    });

    const savedIncident = await newIncident.save();

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
    if (user.role !== "admin") {
      query.reporter_id = user.id;
    }

    const incident = await IncidentModel.findOne(query).populate("reporter_id", "username email phone");

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
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const { type } = req.query;
    
    // Build filter query
    let query: any = {};
    if (type && type !== "all") {
       query.incidentType = type;
    }

    const incidents = await IncidentModel.find(query)
      .populate("reporter_id", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(incidents);
  } catch (error: any) {
    console.error("Error fetching all incidents:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update incident status and notify user
// @route   POST /api/incidents/update-status
// @access  Private (Admin only)
export const updateIncidentStatus = async (req: Request, res: Response) => {
  console.log("updateIncidentStatus route hit");
  try {
    const { incidentId, status } = req.body;

    if (!incidentId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: "incidentId and status are required" 
      });
    }

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
