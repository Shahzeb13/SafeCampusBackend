import mongoose from "mongoose";

export interface ILead extends mongoose.Document {
    name: string;
    institution: string;
    email: string;
    message: string;
    status: "pending" | "contacted" | "closed";
    createdAt: Date;
}

const leadSchema = new mongoose.Schema<ILead>({
    name: { type: String, required: true },
    institution: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["pending", "contacted", "closed"], default: "pending" },
    // Set when a lead is converted into a real organization
    convertedOrganizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        default: null,
    },
    createdAt: { type: Date, default: Date.now }
});

export const LeadModel = mongoose.model<ILead>("Lead", leadSchema);
