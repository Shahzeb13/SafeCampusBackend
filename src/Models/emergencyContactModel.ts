import mongoose, { Schema, Document } from "mongoose";

export interface EmergencyContact {
    name: string;
    phoneNumber: string;
    category: "security" | "ambulance" | "fire" | "admin" | "hostel" | "other";
    isPrimary: boolean;
    // SaaS multi-tenant
    organizationId: mongoose.Types.ObjectId; // TODO: backfill via scripts/backfillOrganizationId.ts
    campusId: mongoose.Types.ObjectId;
}

export interface EmergencyContactDocument extends EmergencyContact, Document {}

const emergencyContactSchema = new Schema<EmergencyContactDocument>(
    {
        name: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        category: { 
            type: String, 
            enum: ["security", "ambulance", "fire", "admin", "hostel", "other"],
            default: "other" 
        },
        isPrimary: { type: Boolean, default: false },
        // SaaS multi-tenant
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        campusId: {
            type: Schema.Types.ObjectId,
            ref: "campus",
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Composite tenant-safe indexes
emergencyContactSchema.index({ organizationId: 1, campusId: 1, category: 1 });
emergencyContactSchema.index({ organizationId: 1, campusId: 1, isPrimary: 1 });

const EmergencyContactModel = mongoose.model<EmergencyContactDocument>("EmergencyContact", emergencyContactSchema);
export default EmergencyContactModel;
