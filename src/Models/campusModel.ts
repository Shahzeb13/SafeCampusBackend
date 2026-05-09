import mongoose from "mongoose";
import { ICampusSchema } from "../Types/campusTypes.js";

const campusSchema = new mongoose.Schema<ICampusSchema>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization"

    }
    ,

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      // Example: ISB, ABT, CUI-ISB
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },

    allowedRadiusMeters: {
      type: Number,
      required: true,
      default: 1000,
      // Example: user must be within 1000 meters of campus center
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    campusAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    securityIncharges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    contactEmail: {
      type: String,
      trim: true,
    },

    contactPhone: {
      type: String,
      trim: true,
    },

    emergencyPhone: {
      type: String,
      trim: true,
    },

    logoUrl: {
      type: String,
      default: "",
    },

    settings: {
      allowStudentRegistration: {
        type: Boolean,
        default: true,
      },

      allowStaffRegistration: {
        type: Boolean,
        default: true,
      },

      requireAdminApprovalForUsers: {
        type: Boolean,
        default: true,
      },

    
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Super Admin ID
    },
  },
  { timestamps: true }
);


const campusModel = mongoose.model<ICampusSchema>("campus", campusSchema);
export default campusModel;
