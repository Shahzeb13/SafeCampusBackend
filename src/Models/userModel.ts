import mongoose from "mongoose";
import { IUser } from "../Types/userTypes.js";

const userSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: [
            "student",
            "staff",
            "super_admin",
            "organization_owner",
            "campus_admin",
            "security_incharge",
            "security_personnel",
        ],
        required: true,
    },
    avatar: { type: String, default: "" },
    // SaaS multi-tenant
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: function (this: IUser) {
            return this.role !== "super_admin";
        },
        index: true,
        // TODO: backfill old users without organizationId via scripts/backfillOrganizationId.ts
    },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "campus", index: true },
    status: {
        type: String,
        enum: ["pending", "active", "rejected", "suspended"],
        default: "active",
    },

    allowed_client :{
        type: String, 
        enum: ["web" , "mobile"],
        
    },
    // University-specific fields
    rollNumber: { type: String },
    universityName: { type: String },
    departmentName: { type: String },
    program: { type: String },
    semester: { type: String },
    section: { type: String },
    fcmTokens: { type: [String], default: [] },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordOTPExpires: { type: Date, default: null },
    phoneNumber: { type: String },
    personalEmergencyContacts: [{
        name: { type: String, required: true },
        phoneNumber: { type: String, required: true }
    }]
}, {
    timestamps: true
});

const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;
