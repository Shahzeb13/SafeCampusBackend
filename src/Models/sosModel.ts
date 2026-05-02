import mongoose, { Schema, Model } from 'mongoose';
import { SOSDocument } from '../Types/sosTypes.js';

const sosSchema = new Schema<SOSDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'responding', 'resolved'],
      default: 'active',
      index: true,
    },
    triggerType: {
      type: String,
      enum: ['button'],
      default: 'button',
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    latestLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      timestamp: { type: Date },
    },
    locationHistory: [
      {
        latitude: { type: Number },
        longitude: { type: Number },
        timestamp: { type: Date },
      },
    ],
    note: {
      type: String,
      required: false,
    },
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignmentResponse: {
      type: String,
      enum: ['pending', 'responding', 'unavailable', 'completed'],
      default: 'pending',
    },
    assignmentNote: {
      type: String,
    },
    acknowledgedAt: { type: Date },
    respondedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Optional: Add index for performance on critical lookups
sosSchema.index({ createdAt: -1 });

const SOSModel: Model<SOSDocument> = mongoose.model<SOSDocument>('SOS', sosSchema);

export default SOSModel;
