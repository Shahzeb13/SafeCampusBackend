import express from "express";
import {
  createOrganization,
  getAllOrganizations,
  getOrganizationBySlug,
  updateOrganization,
  deleteOrganization
} from "../Controllers/organizationController.js";
import { verifyJwtToken } from "../Middlewares/authMiddleware.js";

const router = express.Router();

// All organization routes require authentication
router.use(verifyJwtToken);

// Create an organization (Super Admin, handled in controller)
router.post("/", createOrganization);

// Get all organizations (Super Admin / etc)
router.get("/", getAllOrganizations);

// Get organization by slug
router.get("/:slug", getOrganizationBySlug);

// Update an organization
router.put("/:id", updateOrganization);

// Delete an organization
router.delete("/:id", deleteOrganization);

export default router;
