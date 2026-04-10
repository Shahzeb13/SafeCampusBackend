import { IncidentCreateRequest, IncidentType, IncidentStatus } from "../incidentTypes.js";

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidIncidentType(value: unknown): value is IncidentType {
  const validTypes: IncidentType[] = [
    "theft",
    "property_damage",
    "harassment",
    "fighting",
    "drug_alcohol",
    "unauthorized_access",
    "cyber_incident",
    "fire_emergency",
    "medical_emergency",
    "suspicious_activity",
    "other",
  ];
  return typeof value === "string" && validTypes.includes(value as IncidentType);
}

export function isValidIncidentStatus(value: unknown): value is IncidentStatus {
  const validStatuses: IncidentStatus[] = [
    "pending",
    "under_review",
    "assigned",
    "resolved",
    "rejected",
  ];
  return typeof value === "string" && validStatuses.includes(value as IncidentStatus);
}

export function isIncidentCreateRequest(value: unknown): value is IncidentCreateRequest {
  if (value === null || typeof value !== "object") return false;

  const body = value as Record<string, unknown>;

  const isValidCoord = (val: unknown) => 
    val === undefined || typeof val === "number" || typeof val === "string";

  return (
    isNonEmptyString(body.title) &&
    isNonEmptyString(body.description) &&
    isValidIncidentType(body.incidentType) &&
    isNonEmptyString(body.locationText) &&
    isValidCoord(body.latitude) &&
    isValidCoord(body.longitude) &&
    (body.voiceDuration === undefined || typeof body.voiceDuration === "string")
  );
}
