import express from "express";
import { createAndAssignOrgOwner, deleteOrgOwner } from "../../Controllers/AdministrationControllers/superAdminController.js";

const router = express.Router();

// These routes will be mounted under /api/admin/super
router.post("/org-owner", createAndAssignOrgOwner);
router.delete("/org-owner", deleteOrgOwner);

export default router;
