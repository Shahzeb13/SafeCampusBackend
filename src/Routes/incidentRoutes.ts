import express from "express";
import {
  createIncident,
  getMyIncidents,
  getIncidentById,
} from "../Controllers/incidentController.js";
import { verifyJwtToken } from "../Middlewares/authMiddleware.js";

const router = express.Router();

// All incident routes require authentication
router.use(verifyJwtToken);

// Student/Staff can submit a new incident
router.post("/", createIncident);

// Student/Staff can fetch all of their own incidents
router.get("/my", getMyIncidents);

// Student/Staff can fetch one of their own incident details by id
router.get("/:id", getIncidentById);

export default router;
