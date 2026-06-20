import express from "express";
import { createUserByAdmin, getAllUsers, createOrgUser, getSecurityInchargeDashboard } from "../../Controllers/AdministrationControllers/sharedResponsibilityController.js";
import { getSecurityPersonnel } from "../../Controllers/incidentController.js";

const router = express.Router();

// These routes will be mounted under /api/admin
router.post("/users", createUserByAdmin);
router.get("/users", getAllUsers);
router.get("/security-personnel", getSecurityPersonnel);
router.post("/org/users", createOrgUser);
router.get("/security-incharge-dashboard", getSecurityInchargeDashboard);

export default router;

