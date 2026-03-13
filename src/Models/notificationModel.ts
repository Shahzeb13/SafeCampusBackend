import mongoose, { Schema, Document } from "mongoose";
import { Notification } from "../Types/notificationTypes.js";

export interface NotificationDocument extends Notification, Document {
    _id: any;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

const NotificationModel = mongoose.model<NotificationDocument>("Notification", notificationSchema);
export default NotificationModel;
