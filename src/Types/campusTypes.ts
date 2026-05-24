import { Types } from "mongoose";

export interface ICampusSchema {
  name: string;
  organizationId:Types.ObjectId,
  code: string;
  city: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  allowedRadiusMeters: number;
  status: "active" | "inactive" | "suspended";
  campusAdmins?: Types.ObjectId[];
  securityIncharges?: Types.ObjectId[];
  contactEmail?: string;
  contactPhone?: string;
  emergencyPhone?: string;
  logoUrl?: string;
  settings: {
    allowStudentRegistration: boolean;
    allowStaffRegistration: boolean;
    requireAdminApprovalForUsers: boolean;

  };
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CampusCreateRequest {
  name: string;
  code: string;
  city: string;
  address: string;
   organizationId:Types.ObjectId,
  location: {
    latitude: number;
    longitude: number;
  };
  allowedRadiusMeters?: number;
  contactEmail?: string;
  contactPhone?: string;
  emergencyPhone?: string;
  logoUrl?: string;
  settings?: {
    allowStudentRegistration?: boolean;
    allowStaffRegistration?: boolean;
    requireAdminApprovalForUsers?: boolean;
    enableSos?: boolean;
    enableCommunityModule?: boolean;
  };
}

export interface CampusUpdateRequest {
  name?: string;
  code?: string;
  city?: string;
  address?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  allowedRadiusMeters?: number;
  status?: "active" | "inactive" | "suspended";
  contactEmail?: string;
  contactPhone?: string;
  emergencyPhone?: string;
  logoUrl?: string;
  settings?: {
    allowStudentRegistration?: boolean;
    allowStaffRegistration?: boolean;
    requireAdminApprovalForUsers?: boolean;
  };
  organizationId?: any;
  createdBy?: any;
}
// Note rto remember : Added campusId to IIncident in incidentTypes.ts and ISOS in sosTypes.ts.