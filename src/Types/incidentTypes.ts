import { Types } from "mongoose";

export interface IMedia {
  url: string;
  publicId: string;
  resourceType: string;
}

export type IncidentType =
  | "theft"
  | "property_damage"
  | "harassment"
  | "fighting"
  | "drug_alcohol"
  | "unauthorized_access"
  | "cyber_incident"
  | "fire_emergency"
  | "medical_emergency"
  | "suspicious_activity"
  | "other";

export type IncidentStatus =
  | "pending"
  | "under_review"
  | "assigned"
  | "resolved"
  | "rejected";

export type AssignmentResponse = "pending" | "responding" | "unavailable" | "completed";

export interface IIncident {
  _id?: string;
  reporter_id: Types.ObjectId;
  reporter_role: "student" | "staff";
  title: string;
  description: string;
  incidentType: IncidentType;
  locationText: string;
  latitude?: number;
  longitude?: number;
  images: IMedia[];
  video?: IMedia | null;
  audio?: IMedia | null;
  voiceDuration?: string;
  status: IncidentStatus;
  assigned_to?: Types.ObjectId | null;
  assignmentResponse?: AssignmentResponse | null;
  assignmentNote?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IncidentCreateRequest {
  title: string;
  description: string;
  incidentType: string; // Initially received as string from FormData
  locationText: string;
  latitude?: string | number;
  longitude?: string | number;
  voiceDuration?: string;
}

export interface IncidentMulterFiles {
  images?: Express.Multer.File[];
  video?: Express.Multer.File[];
  audio?: Express.Multer.File[];
}
