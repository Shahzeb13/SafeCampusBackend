import { Request, Response } from "express";
import UserEmergencyContactModel from "../Models/userEmergencyContactModel.js";

export const getMyEmergencyContacts = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const contacts = await UserEmergencyContactModel.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: contacts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addUserEmergencyContact = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { name, phoneNumber, relation } = req.body;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!name || !phoneNumber || !relation) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const contact = await UserEmergencyContactModel.create({
            userId,
            name,
            phoneNumber,
            relation
        });

        res.status(201).json({ success: true, data: contact });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const removeUserEmergencyContact = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const contact = await UserEmergencyContactModel.findOneAndDelete({ _id: id, userId });
        if (!contact) return res.status(404).json({ message: "Contact not found" });

        res.status(200).json({ success: true, message: "Contact removed successfully" });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
