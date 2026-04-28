import express from "express";
import { createUserByAdmin } from "../Controllers/adminController.js";
import { verifyJwtToken, isAdmin } from "../Middlewares/authMiddleware.js";

const router = express.Router();

// All routes here require authentication and admin role
router.use(verifyJwtToken);
router.use(isAdmin);

// POST /api/admin/users
router.post("/users", createUserByAdmin);

export default router;
