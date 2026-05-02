import { Request, Response } from "express";
import EmergencyContactModel from "../Models/emergencyContactModel.js";
import { isEmergencyContactBody } from "../Types/TypePredicates/emergencyTypePredicates.js";
import { logger } from "../Utils/logger.js";

// @desc    Get all emergency contacts
// @route   GET /api/emergency-contacts
// @access  Public
export const getEmergencyContacts = async (req: Request, res: Response) => {
    console.log("getEmergencyContacts route hit");
    try {
        const contacts = await EmergencyContactModel.find().sort({ isPrimary: -1, name: 1 });
        res.status(200).json(contacts);
    } catch (error: any) {
        logger.error(`Error fetching emergency contacts: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new emergency contact
// @route   POST /api/emergency-contacts
// @access  Private/Admin
export const createEmergencyContact = async (req: Request, res: Response) => {
    console.log("createEmergencyContact route hit");
    try {
        if (!isEmergencyContactBody(req.body)) {
            return res.status(400).json({ message: "Invalid emergency contact data" });
        }
        const { name, phoneNumber, category, isPrimary } = req.body;
        const contact = await EmergencyContactModel.create({
            name,
            phoneNumber,
            category,
            isPrimary
        });
        logger.info(`✅ Emergency Contact Created: ${contact.name}`);
        res.status(201).json(contact);
    } catch (error: any) {
        logger.error(`Error creating emergency contact: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update emergency contact
// @route   PUT /api/emergency-contacts/:id
// @access  Private/Admin
export const updateEmergencyContact = async (req: Request, res: Response) => {
    console.log("updateEmergencyContact route hit");
    try {
        const { id } = req.params;
        const contact = await EmergencyContactModel.findByIdAndUpdate(id, req.body, { new: true });
        if (!contact) return res.status(404).json({ message: "Contact not found" });
        res.status(200).json(contact);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete emergency contact
// @route   DELETE /api/emergency-contacts/:id
// @access  Private/Admin
export const deleteEmergencyContact = async (req: Request, res: Response) => {
    console.log("deleteEmergencyContact route hit");
    try {
        const { id } = req.params;
        const contact = await EmergencyContactModel.findByIdAndDelete(id);
        if (!contact) return res.status(404).json({ message: "Contact not found" });
        res.status(200).json({ message: "Contact deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
