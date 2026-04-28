import mongoose from "mongoose";
import { IUser } from "../Types/userTypes.js";

const userSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "staff", "admin"], required: true },
    avatar: { type: String, default: "" },
    // University specific fields
    rollNumber: { type: String },
    universityName: { type: String },
    departmentName: { type: String },
    program: { type: String },
    semester: { type: String },
    section: { type: String },
    fcmTokens: { type: [String], default: [] },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordOTPExpires: { type: Date, default: null }
}, {
    timestamps: true
});

const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;
