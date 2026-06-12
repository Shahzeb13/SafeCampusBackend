import express from "express";
import { createUserByAdmin, getAllUsers, createOrgUser } from "../../Controllers/AdministrationControllers/sharedResponsibilityController.js";
import { getSecurityPersonnel } from "../../Controllers/incidentController.js";

const router = express.Router();

// These routes will be mounted under /api/admin
router.post("/users", createUserByAdmin);
router.get("/users", getAllUsers);
router.get("/security-personnel", getSecurityPersonnel);
router.post("/org/users", createOrgUser);

export default router;
