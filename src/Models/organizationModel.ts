import mongoose, { Schema } from "mongoose";
import { IOrganization } from "../Types/organizationTypes.js";

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["university", "college", "school", "company", "other"],
      default: "university",
    },

    description: {
      type: String,
      trim: true,
    },

    logoUrl: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      trim: true,
    },

    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    contactPhone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      default: "Pakistan",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "trial"],
      default: "trial",
    },

    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    settings: {
      allowSelfRegistration: {
        type: Boolean,
        default: false,
      },
      requireAdminApproval: {
        type: Boolean,
        default: true,
      },
      allowStaffRegistration: {
        type: Boolean,
        default: true,
      },
      allowStudentRegistration: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ status: 1 });

const Organization =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>("Organization", organizationSchema);

export default Organization;