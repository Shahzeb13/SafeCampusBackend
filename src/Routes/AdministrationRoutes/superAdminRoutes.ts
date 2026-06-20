import express from "express";
import { createAndAssignOrgOwner, deleteOrgOwner } from "../../Controllers/AdministrationControllers/superAdminController.js";
import { getSuperAdminRequests, respondToRequest } from "../../Controllers/campusRequestController.js";

const router = express.Router();

// These routes will be mounted under /api/admin/super
router.post("/org-owner", createAndAssignOrgOwner);
router.delete("/org-owner", deleteOrgOwner);

// Campus Creation Requests
router.get("/campus-requests", getSuperAdminRequests);
router.post("/campus-requests/:id/respond", respondToRequest);

export default router;

