import express from "express";
import {
  createIncident,
  getMyIncidents,
  getIncidentById,
  getAllIncidents,
  getIncidentsForRadar,
  updateIncidentStatus,
} from "../Controllers/incidentController.js";
import { verifyJwtToken } from "../Middlewares/authMiddleware.js";

import { uploadIncidentMedia } from "../Middlewares/multer.middleware.js";

const router = express.Router();

// All incident routes require authentication
router.use(verifyJwtToken);

// --- STATIC ROUTES FIRST ---

// Publicly available (for authenticated users) incident data for the Radar/Heatmap
router.get("/radar", getIncidentsForRadar);

// Student/Staff can fetch all of their own incidents
router.get("/myIncidents", getMyIncidents);

// Admin can fetch all incidents with optional filtering
router.get("/", getAllIncidents);

// --- DYNAMIC ROUTES LAST ---

// Student/Staff can fetch one of their own incident details by id
router.get("/:id", getIncidentById);

// Student/Staff can submit a new incident
router.post('/uploadIncident', (req, res, next) => {
  console.log("📦 Multer middleware STARTED");

  uploadIncidentMedia(req, res, (err) => {
    if (err) {
      console.log("❌ Multer error:", err);
      return res.status(400).json({ message: err.message });
    }

    console.log("✅ Multer finished parsing");
    console.log("BODY:", req.body);
    console.log("FILES:", (req as any).files);

    next();
  });
}, createIncident);

// Admin can update incident status
router.post("/update-status", updateIncidentStatus);

export default router;
