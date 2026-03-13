import mongoose, { Schema, Document } from "mongoose";
import { Incident } from "../Types/incidentTypes.js";

export interface IncidentDocument extends Incident, Document {
    _id: any; // Explicitly override if needed or just use default
}

const incidentSchema = new Schema<IncidentDocument>(
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
    mediaUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "under_review", "assigned", "resolved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance on reporter_id
incidentSchema.index({ reporter_id: 1, createdAt: -1 });

const IncidentModel = mongoose.model<IncidentDocument>("Incident", incidentSchema);
export default IncidentModel;
