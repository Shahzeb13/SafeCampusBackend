import mongoose, { Document } from "mongoose";
import { CampusCreateRequest } from "./campusTypes.js";

export interface IOrganization extends Document {
  name: string;
  slug: string;
  type: "university" | "college" | "school" | "company" | "other";
  description?: string;
  logoUrl?: string;
  website?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: "active" | "inactive" | "suspended" | "trial";
  ownerUserId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  campuses: mongoose.Types.ObjectId[];
  settings: {
    allowSelfRegistration: boolean;
    requireAdminApproval: boolean;
    allowStaffRegistration: boolean;
    allowStudentRegistration: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  name: string;
  slug: string;
  contactEmail: string;
  type?: "university" | "college" | "school" | "company" | "other";
  description?: string;
  logoUrl?: string;
  website?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: "active" | "inactive" | "suspended" | "trial";
  settings?: {
    allowSelfRegistration?: boolean;
    requireAdminApproval?: boolean;
    allowStaffRegistration?: boolean;
    allowStudentRegistration?: boolean;
  };
}
