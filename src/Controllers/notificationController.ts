import { Request, Response } from "express";
import NotificationModel from "../Models/notificationModel.js";

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const notifications = await NotificationModel.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
