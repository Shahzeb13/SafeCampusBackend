import { Request, Response } from 'express';
import SOSModel from '../Models/sosModel.js';
import UserModel from '../Models/userModel.js';
import { isValidSOSRequest } from '../Types/TypePredicates/isValidSOSRequest.js';
import { sendNotificationToUser } from '../Utils/notificationService.js';
import { broadcastEmergencyAlert } from '../Utils/smsService.js';
import { sendSOSAssignmentEmail, sendRejectionEmail } from '../Utils/emailService.js';

export const createSOS = async (req: Request, res: Response) => {
  console.log("CreateSos controller hit")
  try {
    if (!isValidSOSRequest(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid SOS request. Coordinates must be valid numbers.',
      });
    }

    const { location, note, triggerType } = req.body;

    // req.user is populated by verifyJwtToken middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication failed',
      });
    }

    const newSOS = new SOSModel({
      userId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      note,
      status: 'active',
      triggerType: triggerType || 'button',
    });

    await newSOS.save();

    // --- BROADCAST TO PERSONAL EMERGENCY CONTACTS ---
    const user = await UserModel.findById(userId);
    if (user && user.personalEmergencyContacts && user.personalEmergencyContacts.length > 0) {
      console.log(`📡 SOS: Broadcasting to ${user.personalEmergencyContacts.length} personal contacts for ${user.username}`);
      // Run in background so SOS response is fast
      broadcastEmergencyAlert(
        user.personalEmergencyContacts, 
        user.username, 
        { latitude: location.latitude, longitude: location.longitude }
      ).catch(err => console.error("Broadcast failed:", err));
    }

    return res.status(201).json({
      success: true,
      message: 'SOS alert triggered successfully',
      sosId: newSOS._id,
      timestamp: newSOS.createdAt,
    });
  } catch (error: any) {
    console.error('Create SOS Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create SOS alert',
      error: error.message,
    });
  }
};

export const getMySOSHistory = async (req: Request, res: Response) => {
  console.log("GetMySosHistory controller hit")
  try {
    const userId = req.user?.id;
    const history = await SOSModel.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch SOS history',
    });
  }
};

/**
 * Update SOS status and set corresponding lifecycle timestamps (Admin/Dashboard)
 */
export const updateSOSStatus = async (req: Request, res: Response) => {
  console.log("updatasos hit")
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const validStatuses = ['active', 'acknowledged', 'responding', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updateData: any = { status };

    // Automatically set the corresponding timestamp based on status
    if (status === 'acknowledged') updateData.acknowledgedAt = new Date();
    if (status === 'responding') updateData.respondedAt = new Date();
    if (status === 'resolved') updateData.resolvedAt = new Date();

    const updatedSOS = await SOSModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('userId');

    if (!updatedSOS) {
      return res.status(404).json({ success: false, message: 'SOS alert not found' });
    }

    // Send FCM notification to the user
    const user = updatedSOS.userId as any;
    if (user && user.fcmTokens && user.fcmTokens.length > 0) {
      await sendNotificationToUser(user._id.toString(), {
        title: 'SOS Update',
        body: `Your SOS alert status is now ${status}`,
      });
    }

    // Email notification on status change (Email Fallback)
    if (user && user.email) {
        if (status === 'rejected') {
            await sendRejectionEmail(
                user.email,
                user.username,
                {
                    title: 'SOS Alert',
                    type: 'sos_emergency',
                    reason: rejectionReason
                },
                true
            );
        } else {
            await sendSOSAssignmentEmail(
                user.email,
                user.username,
                {
                    id: updatedSOS._id.toString(),
                    user: user.username,
                    location: `${updatedSOS.location.latitude}, ${updatedSOS.location.longitude}`,
                    status: status
                },
                false // It's for the student
            );
        }
    }

    return res.status(200).json({
      success: true,
      message: `SOS status updated to ${status}`,
      data: updatedSOS,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update SOS status',
    });
  }
};

/**
 * Assign a security guard to an SOS alert
 */
export const assignSOS = async (req: Request, res: Response) => {
    console.log("assignSOS route hit");
    try {
        const admin = req.user;
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }

        const { sosId, guardId } = req.body;

        if (!sosId || !guardId) {
            return res.status(400).json({ success: false, message: "sosId and guardId are required" });
        }

        const guard = await UserModel.findById(guardId);
        if (!guard || guard.role !== "security_personnel") {
            return res.status(400).json({ success: false, message: "Invalid security personnel ID" });
        }

        const updatedSOS = await SOSModel.findByIdAndUpdate(
            sosId,
            {
                status: "responding",
                assigned_to: guardId,
                assignmentResponse: "pending",
                assignmentNote: null,
            },
            { new: true }
        ).populate("userId").populate("assigned_to");

        if (!updatedSOS) {
            return res.status(404).json({ success: false, message: "SOS alert not found" });
        }

        const student = updatedSOS.userId as any;

        // 1. Notify Guard (FCM + Email)
        if (guard.fcmTokens && guard.fcmTokens.length > 0) {
            await sendNotificationToUser(guardId, {
                title: "🚨 EMERGENCY DISPATCH: SOS",
                body: `Respond to SOS from: ${student.username}`,
                data: { sosId: sosId.toString(), type: "sos_assignment" },
            });
        }

        const sosInfo = {
            id: sosId.toString(),
            user: student.username,
            location: `${updatedSOS.location.latitude}, ${updatedSOS.location.longitude}`,
            status: "responding"
        };

        await sendSOSAssignmentEmail(guard.email, guard.username, sosInfo, true);

        // 2. Notify Student (FCM + Email)
        if (student.fcmTokens && student.fcmTokens.length > 0) {
            await sendNotificationToUser(student._id.toString(), {
                title: "🛡️ Help is on the way!",
                body: `Security Guard ${guard.username} has been dispatched to your SOS alert.`,
                data: { sosId: sosId.toString(), type: "sos_dispatched" },
            });
        }

        if (student.email) {
            await sendSOSAssignmentEmail(student.email, student.username, sosInfo, false);
        }

        return res.status(200).json({
            success: true,
            message: `SOS assigned to ${guard.username}. Notifications dispatched.`,
            data: updatedSOS,
        });
    } catch (error: any) {
        console.error("Assign SOS Error:", error);
        return res.status(500).json({ success: false, message: "Failed to assign SOS" });
    }
};

/**
 * Guard responds to an SOS assignment
 */
export const respondToSOSAssignment = async (req: Request, res: Response) => {
    try {
        const guard = req.user;
        if (!guard || guard.role !== "security_personnel") {
            return res.status(403).json({ success: false, message: "Security personnel access required" });
        }

        const { sosId, response, note } = req.body;

        const sos = await SOSModel.findOne({ _id: sosId, assigned_to: guard.id });
        if (!sos) {
            return res.status(404).json({ success: false, message: "SOS assignment not found" });
        }

        sos.assignmentResponse = response;
        sos.assignmentNote = note || null;

        if (response === "completed") {
            sos.status = "resolved";
            sos.resolvedAt = new Date();
        }

        // If unavailable, mark back to active so admin can reassign
        if (response === "unavailable") {
            sos.status = "active";
            // Keep assigned_to for history as requested previously for incidents
        }

        await sos.save();

        return res.status(200).json({ success: true, data: sos });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get SOS alerts assigned to the current guard
 */
export const getMySOSAssignments = async (req: Request, res: Response) => {
    try {
        const guard = req.user;
        const assignments = await SOSModel.find({ assigned_to: guard?.id })
            .populate("userId", "username email phoneNumber")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: assignments });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Fetch all SOS alerts (For Web Dashboard / Security Guard View)
 */
export const getAllSOS = async (req: Request, res: Response) => {
  console.log("getAllSOS route hit");
  try {
    // Populate user info so security knows WHO triggered it
    const allSOS = await SOSModel.find()
      .populate('userId', 'username email phoneNumber')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: allSOS,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch all SOS alerts',
    });
  }
};

/**
 * Fetch only ACTIVE SOS alerts (For Real-time Dashboard)
 */
export const getActiveSOS = async (req: Request, res: Response) => {
  console.log("getActiveSOS route hit");
  try {
    const activeSOS = await SOSModel.find({ 
      status: { $in: ['active', 'acknowledged', 'responding'] } 
    })
      .populate('userId', 'username email phoneNumber')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: activeSOS.length,
      data: activeSOS,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active SOS alerts',
    });
  }
};

/**
 * Fetch a single SOS alert by ID
 */
export const getSOSById = async (req: Request, res: Response) => {
  console.log("getSOSById route hit");
  try {
    const { id } = req.params;
    const sos = await SOSModel.findById(id).populate('userId', 'username email phoneNumber');

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS alert not found' });
    }

    return res.status(200).json({
      success: true,
      data: sos,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch SOS alert details',
    });
  }
};

/**
 * Update SOS live location during an active emergency
 */
export const updateLiveLocation = async (req: Request, res: Response) => {
  console.log("updateLiveLocation route hit");
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    // Guard: Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. Latitude and longitude must be numbers.',
      });
    }

    const sos = await SOSModel.findById(id);

    // Guard: Existence
    if (!sos) {
      return res.status(404).json({
        success: false,
        message: 'SOS alert not found',
      });
    }

    // Guard: Only allow updates for active/responding alerts
    if (sos.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update location for a resolved alert.',
      });
    }

    const newLocation = {
      latitude,
      longitude,
      timestamp: new Date(),
    };

    // Update latest and append to history
    sos.latestLocation = newLocation;
    sos.locationHistory = [...(sos.locationHistory || []), newLocation];

    await sos.save();

    return res.status(200).json({
      success: true,
      message: 'Live location updated successfully',
      data: {
        latestLocation: sos.latestLocation,
        status: sos.status,
      },
    });
  } catch (error: any) {
    console.error('Update SOS Location Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update live location',
    });
  }
};
