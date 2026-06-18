import express from "express";
import { verifyJwtToken, isAdmin } from "../../Middlewares/authMiddleware.js";
import superAdminRoutes from "./superAdminRoutes.js";
import sharedRoutes from "./sharedRoutes.js";
import orgOwnerRoutes from "./orgOwnerRoutes.js";
import campusAdminRoutes from "./campusAdminRoutes.js";

const router = express.Router();

// All routes here require authentication and admin role
router.use(verifyJwtToken);
router.use(isAdmin);

// Route delegations
router.use("/super", superAdminRoutes);
router.use("/org-owner", orgOwnerRoutes);
router.use("/campus-admin" , campusAdminRoutes)
router.use("/", sharedRoutes);

export default router;
