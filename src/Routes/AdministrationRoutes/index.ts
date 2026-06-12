import express from "express";
import { verifyJwtToken, isAdmin } from "../../Middlewares/authMiddleware.js";
import superAdminRoutes from "./superAdminRoutes.js";
import sharedRoutes from "./sharedRoutes.js";
import orgOwnerRoutes from "./orgOwnerRoutes.js";

const router = express.Router();

// All routes here require authentication and admin role
router.use(verifyJwtToken);
router.use(isAdmin);

// Route delegations
router.use("/super", superAdminRoutes);
router.use("/org-owner", orgOwnerRoutes);
router.use("/", sharedRoutes);

export default router;
