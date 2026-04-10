import express from "express";
import {
  createIncident,
  getMyIncidents,
  getIncidentById,
} from "../Controllers/incidentController.js";
import { verifyJwtToken } from "../Middlewares/authMiddleware.js";

import { uploadIncidentMedia } from "../Middlewares/multer.middleware.js";

const router = express.Router();

// All incident routes require authentication
router.use(verifyJwtToken);

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
// Student/Staff can fetch all of their own incidents
router.get("/myIncidents", getMyIncidents);

// Student/Staff can fetch one of their own incident details by id
router.get("/:id", getIncidentById);

export default router;
