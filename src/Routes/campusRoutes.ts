import express from "express";
import {
  createCampus,
  getAllCampuses,
  getCampusById,
  updateCampus,
  deleteCampus
} from "../Controllers/campusController.js";
import { verifyJwtToken } from "../Middlewares/authMiddleware.js";

const router = express.Router();

// All campus routes require authentication
router.use(verifyJwtToken);

// Create a campus
router.post("/", createCampus);

// Get all campuses (scoped by role in controller)
router.get("/", getAllCampuses);

// Get campus by ID
router.get("/:id", getCampusById);

// Update a campus
router.patch("/:id", updateCampus);

// Delete a campus
router.delete("/:id", deleteCampus);

export default router;
