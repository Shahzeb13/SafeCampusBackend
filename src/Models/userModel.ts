import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "staff", "admin"], required: true },
    avatar: { type: String, default: "" }
}, {
    timestamps: true
});

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
