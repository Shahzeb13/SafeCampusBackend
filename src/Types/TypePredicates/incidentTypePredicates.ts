import { CreateIncidentBody, IncidentType, IncidentStatus } from "../incidentTypes.js";

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || typeof value === "number";
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
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

export function isCreateIncidentBody(value: unknown): value is CreateIncidentBody {
  if (value === null || typeof value !== "object") return false;

  const body = value as Record<string, unknown>;

  return (
    isNonEmptyString(body.title) &&
    isNonEmptyString(body.description) &&
    isValidIncidentType(body.incidentType) &&
    isNonEmptyString(body.locationText) &&
    isOptionalNumber(body.latitude) &&
    isOptionalNumber(body.longitude) &&
    (body.mediaUrls === undefined || isStringArray(body.mediaUrls))
  );
}
