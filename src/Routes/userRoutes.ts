import express from "express";
import { addEmergencyContact, getPersonalEmergencyContacts, removeEmergencyContact, saveFcmToken, updateProfile, removeFcmToken } from "../Controllers/userController.js";
import { verifyJwtToken } from "../Middlewares/authMiddleware.js";
import { uploadAvatar } from "../Middlewares/multer.middleware.js";

const router = express.Router();

// Route to save FCM token for push notifications
router.post("/save-fcm-token", saveFcmToken);
router.post("/remove-fcm-token", removeFcmToken);

// Route to update user profile
router.put("/profile", verifyJwtToken, uploadAvatar, updateProfile);

// Personal Emergency Contacts
router.get("/emergency-contacts", verifyJwtToken, getPersonalEmergencyContacts);
router.post("/emergency-contacts", verifyJwtToken, addEmergencyContact);
router.delete("/emergency-contacts/:index", verifyJwtToken, removeEmergencyContact);

export default router;
