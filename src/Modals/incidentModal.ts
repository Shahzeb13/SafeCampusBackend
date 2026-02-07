import mongoose from 'mongoose'

const incidentSchema = new mongoose.Schema({
    reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    handled_by:{type: mongoose.Schema.Types.ObjectId , ref: "User" , required: true},
    handled_at: {type :Date , required: true},
    description: { type: String, required: true },

    status: { type: String, enum: ["pending", "under_process","approved", "rejected"],default: "pending" },
    // Human-readable location
    location_name: { type: String, required: true },

    type_incident: {
        type: String, default: null,
        enum: ["vendalism", "fighting",
            "grafiti", "drugs", "unauthorized_Access"
        ],
        // Optional coordinates for map features
        locationCoords: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: undefined } // [longitude, latitude]
        },

        priority: { type: String, enum: ["low", "medium", "high", "severe"], required: true }
    }
},
    {
        timestamps: true,
        strictQuery: true,
        strict: true
    })

const IncidentModal = mongoose.model("Incident", incidentSchema);
export default IncidentModal




