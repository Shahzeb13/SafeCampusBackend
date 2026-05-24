import mongoose, { Schema, Document } from "mongoose";
import { Notification, NotificationType } from "../Types/notificationTypes.js";

export interface NotificationDocument extends Notification, Document {
    _id: any;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident", default: null },
    sosId: { type: Schema.Types.ObjectId, ref: "SOS", default: null },
    // SaaS multi-tenant
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
      // TODO: backfill old notifications without organizationId via scripts/backfillOrganizationId.ts
    },
    campusId: {
      type: Schema.Types.ObjectId,
      ref: "campus",
      required: false,
      index: true,
    },
    type: {
      type: String,
      enum: ["incident", "sos", "assignment", "system", "chat"],
      default: "system",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Composite tenant-safe indexes
notificationSchema.index({ organizationId: 1, campusId: 1, userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, isRead: 1 });

const NotificationModel = mongoose.model<NotificationDocument>("Notification", notificationSchema);
export default NotificationModel;
