import express from "express";
import { 
    saveFcmToken, 
    updateProfile, 
} from "../Controllers/userController.js";
import { 
    getMyEmergencyContacts, 
    addUserEmergencyContact, 
    removeUserEmergencyContact 
} from "../Controllers/userEmergencyContactController.js";
import { verifyJwtToken } from "../Middlewares/authMiddleware.js";
import { uploadAvatar } from "../Middlewares/multer.middleware.js";

const router = express.Router();

// Route to save FCM token for push notifications
router.post("/save-fcm-token", saveFcmToken);

// Route to update user profile
router.put("/profile", verifyJwtToken, uploadAvatar, updateProfile);

// Personal Emergency Contacts Routes
router.get("/emergency-contacts", verifyJwtToken, getMyEmergencyContacts);
router.post("/emergency-contacts", verifyJwtToken, addUserEmergencyContact);
router.delete("/emergency-contacts/:id", verifyJwtToken, removeUserEmergencyContact);

export default router;
