import express from "express";
import {
  getMyNotifications,
  markNotificationAsRead,
} from "../Controllers/notificationController.js";
import { verifyJwtToken } from "../Middlewares/authMiddleware.js";

const router = express.Router();

// All notification routes require authentication
router.use(verifyJwtToken);

// Student/Staff can fetch their notifications
router.get("/", getMyNotifications);

// Student/Staff can mark notification as read
router.patch("/:id/read", markNotificationAsRead);

export default router;
