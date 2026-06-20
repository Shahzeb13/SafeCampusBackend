import { CampusCreateRequest, CampusUpdateRequest } from "../campusTypes.js";

/**
 * Type predicate for CampusCreateRequest
 */
export function isCampusCreateRequest(data: any): data is CampusCreateRequest {
  if (typeof data !== "object" || data === null) return false;

  const requiredFields = ["name", "code", "city",  "organizationId", "address", "location"];
  for (const field of requiredFields) {
    if (!(field in data)) return false;
  }

  if (typeof data.location !== "object" || data.location === null) return false;
  if (typeof data.location.latitude !== "number" || typeof data.location.longitude !== "number") return false;

  return (
    typeof data.name === "string" &&
    typeof data.code === "string" &&
    typeof data.city === "string" &&
    typeof data.address === "string" &&
    (typeof data.organizationId === "string" || typeof data.organizationId === "object")
  );
}

/**
 * Type predicate for CampusUpdateRequest
 */
export function isCampusUpdateRequest(data: any): data is CampusUpdateRequest {
  if (typeof data !== "object" || data === null) return false;
  
  // Since it's a partial update, we just check if any key exists and if they are of right type if they do
  if (data.name && typeof data.name !== "string") return false;
  if (data.code && typeof data.code !== "string") return false;
  if (data.status && !["active", "inactive", "suspended"].includes(data.status)) return false;
  if (data.allowedRadiusMeters !== undefined && typeof data.allowedRadiusMeters !== "number") return false;
  if (data.contactEmail !== undefined && typeof data.contactEmail !== "string") return false;
  if (data.contactPhone !== undefined && typeof data.contactPhone !== "string") return false;
  if (data.emergencyPhone !== undefined && typeof data.emergencyPhone !== "string") return false;
  
  if (data.location) {
    if (typeof data.location !== "object") return false;
    if (data.location.latitude && typeof data.location.latitude !== "number") return false;
    if (data.location.longitude && typeof data.location.longitude !== "number") return false;
  }

  if (data.settings) {
    if (typeof data.settings !== "object") return false;
    if (data.settings.allowStudentRegistration !== undefined && typeof data.settings.allowStudentRegistration !== "boolean") return false;
    if (data.settings.allowStaffRegistration !== undefined && typeof data.settings.allowStaffRegistration !== "boolean") return false;
    if (data.settings.requireAdminApprovalForUsers !== undefined && typeof data.settings.requireAdminApprovalForUsers !== "boolean") return false;
  }

  return true;
}

