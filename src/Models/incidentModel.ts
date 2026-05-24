import mongoose, { Schema, Document } from "mongoose";
import { IIncident } from "../Types/incidentTypes.js";

const incidentSchema = new Schema<IIncident>(
  {
    reporter_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reporter_role: { type: String, enum: ["student", "staff"], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    incidentType: {
      type: String,
      enum: [
        "theft",
        "property_damage",
        "harassment",
        "fighting",
        "drug_alcohol",
        "unauthorized_access",
        "cyber_incident",
        "fire_emergency",
        "medical_emergency",
        "suspicious_activity",
        "other",
      ],
      required: true,
    },
    locationText: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        resourceType: { type: String, required: true },
      },
    ],
    video: {
      url: { type: String },
      publicId: { type: String },
      resourceType: { type: String },
    },
    audio: {
      url: { type: String },
      publicId: { type: String },
      resourceType: { type: String },
    },
    voiceDuration: { type: String },
    // SaaS multi-tenant
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
      // TODO: backfill old incidents without organizationId via scripts/backfillOrganizationId.ts
    },
    campusId: {
      type: Schema.Types.ObjectId,
      ref: "campus",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "assigned", "resolved", "rejected"],
      default: "pending",
    },
    assigned_to: { type: Schema.Types.ObjectId, ref: "User", default: null },
    assignmentResponse: {
      type: String,
      enum: ["pending", "responding", "unavailable", "completed"],
      default: null,
    },
    assignmentNote: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// Composite tenant-safe indexes
incidentSchema.index({ organizationId: 1, campusId: 1, status: 1 });
incidentSchema.index({ organizationId: 1, campusId: 1, createdAt: -1 });
incidentSchema.index({ reporter_id: 1 });
incidentSchema.index({ assigned_to: 1 });

const IncidentModel = mongoose.model<IIncident>("Incident", incidentSchema);
export default IncidentModel;
