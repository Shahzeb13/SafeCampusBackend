import { Request, Response } from "express";
import IncidentModal from "../Modals/incidentModal.js";
import { isValidIncident } from "../Types/TypePredicates/isValidIncident.js";

// Create Incident
export const createIncident = async (req: Request, res: Response) => {
    try {
        if (!isValidIncident(req.body)) {
            return res.status(400).json({ message: "Invalid incident data provided" });
        }

        const newIncident = new IncidentModal(req.body);
        const savedIncident = await newIncident.save();

        res.status(201).json(savedIncident);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Incidents
export const getAllIncidents = async (req: Request, res: Response) => {
    try {
        const incidents = await IncidentModal.find().populate("reporter_id handled_by", "username email role");
        res.status(200).json(incidents);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get Incident By ID
export const getIncidentById = async (req: Request, res: Response) => {
    try {
        const incident = await IncidentModal.findById(req.params.id).populate("reporter_id handled_by", "username email role");
        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }
        res.status(200).json(incident);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Update Incident
export const updateIncident = async (req: Request, res: Response) => {
    try {
        const updatedIncident = await IncidentModal.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedIncident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        res.status(200).json(updatedIncident);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Delete Incident
export const deleteIncident = async (req: Request, res: Response) => {
    try {
        const deletedIncident = await IncidentModal.findByIdAndDelete(req.params.id);
        if (!deletedIncident) {
            return res.status(404).json({ message: "Incident not found" });
        }
        res.status(200).json({ message: "Incident deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
