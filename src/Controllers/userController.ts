import { Request, Response } from "express";
import UserModel from "../Models/userModel.js";
import { uploadOnCloudinary } from "../Utils/cloudinary.js";
import fs from 'fs';


/**
 * @desc    Save FCM token for a user (Mobile Push Notifications)
 * @route   POST /api/users/save-fcm-token
 * @access  Private (or Public if userId is provided manually)
 */
export const saveFcmToken = async (req: Request, res: Response) => {
    console.log("safefcmtoken route hit");
    try {
        const { userId, token } = req.body;

        // 1. Basic Validation
        if (!userId || !token) {
            return res.status(400).json({ 
                success: false, 
                message: "User ID and FCM token are required" 
            });
        }

        // 2. Find the user in Database
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // 3. Check for duplicates (don't save the same token twice)
        if (user.fcmTokens.includes(token)) {
            return res.status(200).json({ 
                success: true, 
                message: "Token already registered for this user" 
            });
        }

        // 4. Add new token to the array and save
        user.fcmTokens.push(token);
        await user.save();

        console.log(`✅ FCM Token saved for user: ${user.username}`);

        return res.status(200).json({ 
            success: true, 
            message: "FCM token saved successfully",
            count: user.fcmTokens.length
        });

    } catch (error: any) {
        console.error("❌ Error in saveFcmToken:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { 
            username, 
            rollNumber, 
            universityName, 
            departmentName, 
            program, 
            semester, 
            section 
        } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Update fields if provided
        if (username) user.username = username;
        if (rollNumber) user.rollNumber = rollNumber;
        if (universityName) user.universityName = universityName;
        if (departmentName) user.departmentName = departmentName;
        if (program) user.program = program;
        if (semester) user.semester = semester;
        if (section) user.section = section;

        // Handle Avatar Upload
        if (req.file) {
            console.log("Avatar file detected, uploading to Cloudinary...");
            const result = await uploadOnCloudinary(req.file.path);
            if (result) {
                user.avatar = result.secure_url;
            }
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                rollNumber: user.rollNumber,
                universityName: user.universityName,
                departmentName: user.departmentName,
                program: user.program,
                semester: user.semester,
                section: user.section,
                personalEmergencyContacts: user.personalEmergencyContacts || []
            }
        });

    } catch (error: any) {
        console.error("❌ Error in updateProfile:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
};
/**
 * @desc    Add a personal emergency contact
 * @route   POST /api/users/emergency-contacts
 * @access  Private
 */
export const addEmergencyContact = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { name, phoneNumber } = req.body;

        if (!name || !phoneNumber) {
            return res.status(400).json({ success: false, message: "Name and phone number are required" });
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!user.personalEmergencyContacts) user.personalEmergencyContacts = [];
        
        // Limit to 5 contacts for safety/spam prevention
        if (user.personalEmergencyContacts.length >= 5) {
            return res.status(400).json({ success: false, message: "Maximum 5 emergency contacts allowed" });
        }

        user.personalEmergencyContacts.push({ name, phoneNumber });
        await user.save();

        return res.status(200).json({ 
            success: true, 
            message: "Contact added successfully",
            contacts: user.personalEmergencyContacts 
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Remove a personal emergency contact
 * @route   DELETE /api/users/emergency-contacts/:index
 * @access  Private
 */
export const removeEmergencyContact = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const index = parseInt(req.params.index);

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!user.personalEmergencyContacts || index < 0 || index >= user.personalEmergencyContacts.length) {
            return res.status(400).json({ success: false, message: "Invalid contact index" });
        }

        user.personalEmergencyContacts.splice(index, 1);
        await user.save();

        return res.status(200).json({ 
            success: true, 
            message: "Contact removed successfully",
            contacts: user.personalEmergencyContacts 
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
