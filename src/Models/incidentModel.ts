import mongoose, { Schema, Document } from "mongoose";
import { IIncident } from "../Types/incidentTypes.js";

// export interface IncidentDocument extends IIncident, Document {
//   _id: any; // Explicitly override if needed or just use default
// }

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
    status: {
      type: String,
      enum: ["pending", "under_review", "assigned", "resolved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Index for better query performance on reporter_id
incidentSchema.index({ reporter_id: 1, createdAt: -1 });

const IncidentModel = mongoose.model<IIncident>("Incident", incidentSchema);
export default IncidentModel;
