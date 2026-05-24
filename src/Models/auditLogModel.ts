import mongoose, { Schema } from "mongoose";

/**
 * AuditLog — Records who did what, when, and on what entity.
 * Examples: super_admin created organization, campus_admin assigned incident, etc.
 * Do NOT tightly couple this to every controller — use createAuditLog() helper selectively.
 */
const auditLogSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: false,
      index: true,
    },
    campusId: {
      type: Schema.Types.ObjectId,
      ref: "campus",
      required: false,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: [
        "Organization",
        "Campus",
        "User",
        "Incident",
        "SOS",
        "Chat",
        "Notification",
        "EmergencyContact",
        "Lead",
        "System",
      ],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ organizationId: 1, campusId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

const AuditLogModel = mongoose.model("AuditLog", auditLogSchema);
export default AuditLogModel;
