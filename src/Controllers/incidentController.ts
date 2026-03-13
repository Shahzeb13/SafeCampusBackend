import { Request, Response } from "express";
import IncidentModel from "../Models/incidentModel.js";
import NotificationModel from "../Models/notificationModel.js";
import { isCreateIncidentBody } from "../Types/TypePredicates/incidentTypePredicates.js";

// @desc    Submit a new incident
// @route   POST /api/incidents
// @access  Private (Student/Staff only)
export const createIncident = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admins cannot submit incidents" });
    }

    if (!isCreateIncidentBody(req.body)) {
      return res.status(400).json({ message: "Invalid incident data provided" });
    }

    const { title, description, incidentType, locationText, latitude, longitude, mediaUrls } = req.body;

    const newIncident = new IncidentModel({
      reporter_id: req.user.id,
      reporter_role: req.user.role,
      title,
      description,
      incidentType,
      locationText,
      latitude,
      longitude,
      mediaUrls: mediaUrls || [],
      status: "pending",
    });

    const savedIncident = await newIncident.save();

    res.status(201).json(savedIncident);
  } catch (error: any) {
    console.error("Error creating incident:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all incidents for the current user
// @route   GET /api/incidents/my
// @access  Private
export const getMyIncidents = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const incidents = await IncidentModel.find({ reporter_id: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json(incidents);
  } catch (error: any) {
    console.error("Error fetching my incidents:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get a single incident by ID (owned by user)
// @route   GET /api/incidents/:id
// @access  Private
export const getIncidentById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const incident = await IncidentModel.findOne({
      _id: req.params.id,
      reporter_id: req.user.id,
    });

    if (!incident) {
      return res.status(404).json({ message: "Incident not found or not authorized" });
    }

    res.status(200).json(incident);
  } catch (error: any) {
    console.error("Error fetching incident by ID:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
