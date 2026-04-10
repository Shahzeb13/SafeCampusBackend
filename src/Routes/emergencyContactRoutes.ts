import express from "express";
import { 
    getEmergencyContacts, 
    createEmergencyContact, 
    updateEmergencyContact, 
    deleteEmergencyContact 
} from "../Controllers/emergencyContactController.js";
import { verifyJwtToken } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getEmergencyContacts);
router.post("/", verifyJwtToken, createEmergencyContact);
router.put("/:id", verifyJwtToken, updateEmergencyContact);
router.delete("/:id", verifyJwtToken, deleteEmergencyContact);

export default router;
