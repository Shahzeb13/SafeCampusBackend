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

export interface Incident {
  _id?: string;
  reporter_id: string;
  reporter_role: "student" | "staff";
  title: string;
  description: string;
  incidentType: IncidentType;
  locationText: string;
  latitude?: number;
  longitude?: number;
  mediaUrls?: string[];
  status: IncidentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateIncidentBody {
  title: string;
  description: string;
  incidentType: IncidentType;
  locationText: string;
  latitude?: number;
  longitude?: number;
  mediaUrls?: string[];
}
