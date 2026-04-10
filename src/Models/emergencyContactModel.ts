import mongoose, { Schema, Document } from "mongoose";

export interface EmergencyContact {
    name: string;
    phoneNumber: string;
    category: "security" | "ambulance" | "fire" | "admin" | "hostel" | "other";
    isPrimary: boolean;
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
        isPrimary: { type: Boolean, default: false }
    },
    {
        timestamps: true,
    }
);

const EmergencyContactModel = mongoose.model<EmergencyContactDocument>("EmergencyContact", emergencyContactSchema);
export default EmergencyContactModel;
