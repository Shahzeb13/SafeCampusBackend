import { Request, Response } from "express";
import { LeadModel } from "../Models/leadModel.js";
import { sendLeadEmail } from "../Utils/emailService.js";

export const submitLead = async (req: Request, res: Response) => {
    try {
        const { name, institution, email, message } = req.body;

        if (!name || !institution || !email || !message) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // 1. Save to Database
        const newLead = new LeadModel({
            name,
            institution,
            email,
            message
        });
        await newLead.save();

        // 2. Send Emails (Async - don't block response)
        sendLeadEmail({ name, institution, email, message });

        return res.status(201).json({ 
            success: true, 
            message: "Your request has been submitted successfully! Our team will contact you soon." 
        });

    } catch (error) {
        console.error("Error in submitLead:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
