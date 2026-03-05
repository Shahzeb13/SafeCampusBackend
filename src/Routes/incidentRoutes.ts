import express from "express";
import {
    createIncident,
    getAllIncidents,
    getIncidentById,
    updateIncident,
    deleteIncident
} from "../Controllers/incidentController.js";
import { verifyJwtToken } from "../Middlewares/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all incident routes
router.use(verifyJwtToken);

router.post("/", createIncident);
router.get("/", getAllIncidents);
router.get("/:id", getIncidentById);
router.put("/:id", updateIncident);
router.delete("/:id", deleteIncident);

export default router;
