import mongoose from 'mongoose'

export interface Incident {
    reporter_id: string;
    handled_by: string;
    handled_at: string | Date;
    description: string;
    status: "pending" | "under_process" | "approved" | "rejected";
    location_name: string;
    type_incident: "vendalism" | "fighting" | "grafiti" | "drugs" | "unauthorized_Access";
    locationCoords?: {
        type: "Point";
        coordinates: [number, number];
    };
    priority: "low" | "medium" | "high" | "severe";
}

const incidentSchema = new mongoose.Schema({
    reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    handled_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    handled_at: { type: Date, required: true },
    description: { type: String, required: true },

    status: { type: String, enum: ["pending", "under_process", "approved", "rejected"], default: "pending" },
    // Human-readable location
    location_name: { type: String, required: true },

    type_incident: {
        type: String,
        enum: ["vendalism", "fighting", "grafiti", "drugs", "unauthorized_Access"],
        required: true
    },
    // Optional coordinates for map features
    locationCoords: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: undefined } // [longitude, latitude]
    },

    priority: { type: String, enum: ["low", "medium", "high", "severe"], required: true }
},
    {
        timestamps: true,
        strictQuery: true,
        strict: true
    })

const IncidentModal = mongoose.model<Incident & mongoose.Document>("Incident", incidentSchema);
export default IncidentModal




