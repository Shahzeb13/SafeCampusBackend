import express from "express";
import { addEmergencyContact, removeEmergencyContact, saveFcmToken, updateProfile } from "../Controllers/userController.js";
import { verifyJwtToken } from "../Middlewares/authMiddleware.js";
import { uploadAvatar } from "../Middlewares/multer.middleware.js";

const router = express.Router();

// Route to save FCM token for push notifications
router.post("/save-fcm-token", saveFcmToken);

// Route to update user profile
router.put("/profile", verifyJwtToken, uploadAvatar, updateProfile);

// Personal Emergency Contacts
router.post("/emergency-contacts", verifyJwtToken, addEmergencyContact);
router.delete("/emergency-contacts/:index", verifyJwtToken, removeEmergencyContact);

export default router;
