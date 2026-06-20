import { Request, Response } from "express";
import CampusRequestModel from "../Models/campusRequestModel.js";
import campusModel from "../Models/campusModel.js";
import Organization from "../Models/organizationModel.js";
import { isSuperAdmin, isOrganizationOwner } from "../Types/TypePredicates/roleHelpers.js";

/**
 * Org Owner submits a campus creation request
 */
export const createRequest = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !isOrganizationOwner(user.role)) {
      return res.status(403).json({ success: false, message: "Only Organization Owners can submit campus requests." });
    }

    const { name, code, city, address, location, allowedRadiusMeters } = req.body;
    if (!name || !code || !city || !address || !location) {
      return res.status(400).json({ success: false, message: "Missing required campus fields." });
    }

    const newRequest = new CampusRequestModel({
      organizationId: user.organizationId,
      requestedBy: user.id,
      name,
      code: code.toUpperCase(),
      city,
      address,
      location,
      allowedRadiusMeters: allowedRadiusMeters || 1000,
      status: "pending",
    });

    await newRequest.save();

    return res.status(201).json({
      success: true,
      message: "Campus creation request submitted to Super Admin successfully.",
      data: newRequest,
    });
  } catch (error: any) {
    console.error("Error in createRequest:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Org Owner retrieves requests for their organization
 */
export const getOwnerRequests = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !isOrganizationOwner(user.role)) {
      return res.status(403).json({ success: false, message: "Only Organization Owners can view requests." });
    }

    const requests = await CampusRequestModel.find({ organizationId: user.organizationId })
      .populate("requestedBy", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    console.error("Error in getOwnerRequests:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Super Admin retrieves all requests
 */
export const getSuperAdminRequests = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !isSuperAdmin(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied. Super Admin role required." });
    }

    const requests = await CampusRequestModel.find()
      .populate("organizationId", "name")
      .populate("requestedBy", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    console.error("Error in getSuperAdminRequests:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * Super Admin responds (approves or rejects) a campus request
 */
export const respondToRequest = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !isSuperAdmin(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied. Super Admin role required." });
    }

    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action. Must be 'approve' or 'reject'." });
    }

    const campusReq = await CampusRequestModel.findById(id);
    if (!campusReq) {
      return res.status(404).json({ success: false, message: "Campus request not found." });
    }

    if (campusReq.status !== "pending") {
      return res.status(400).json({ success: false, message: "This request has already been processed." });
    }

    if (action === "reject") {
      campusReq.status = "rejected";
      campusReq.rejectionReason = rejectionReason || "No reason provided.";
      await campusReq.save();

      return res.status(200).json({
        success: true,
        message: "Campus request rejected successfully.",
        data: campusReq,
      });
    }

    // Check duplicate code
    const duplicate = await campusModel.findOne({
      organizationId: campusReq.organizationId,
      code: campusReq.code,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `A campus with code '${campusReq.code}' already exists in this organization. Please reject or ask the owner to request another code.`,
      });
    }

    // Action is approved: create the campus
    const newCampus = new campusModel({
      name: campusReq.name,
      code: campusReq.code,
      city: campusReq.city,
      address: campusReq.address,
      location: campusReq.location,
      allowedRadiusMeters: campusReq.allowedRadiusMeters,
      organizationId: campusReq.organizationId,
      createdBy: user.id,
    });

    await newCampus.save();

    // Link to Organization
    await Organization.findByIdAndUpdate(campusReq.organizationId, {
      $push: { campuses: newCampus._id },
    });

    campusReq.status = "approved";
    await campusReq.save();

    return res.status(200).json({
      success: true,
      message: "Campus approved and created successfully.",
      data: campusReq,
    });
  } catch (error: any) {
    console.error("Error in respondToRequest:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
