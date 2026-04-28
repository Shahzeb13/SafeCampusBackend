import mongoose, { Schema, Document } from "mongoose";

export interface IUserEmergencyContact extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    phoneNumber: string;
    relation: string;
    createdAt: Date;
}

const UserEmergencyContactSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    relation: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

export default mongoose.model<IUserEmergencyContact>("UserEmergencyContact", UserEmergencyContactSchema);
