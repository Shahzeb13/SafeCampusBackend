import { EmergencyContact } from "../../Models/emergencyContactModel.js";

export function isEmergencyContactBody(value: unknown): value is Partial<EmergencyContact> {
    if (value === null || typeof value !== "object") return false;

    const body = value as Record<string, unknown>;

    // Guard: Name must be a non-empty string
    if (typeof body.name !== "string" || body.name.trim().length === 0) return false;

    // Guard: Phone Number must be a non-empty string
    if (typeof body.phoneNumber !== "string" || body.phoneNumber.trim().length === 0) return false;

    // Guard: Category must be valid if provided
    const validCategories = ["security", "ambulance", "fire", "admin", "hostel", "other"];
    if (body.category !== undefined && !validCategories.includes(body.category as string)) {
        return false;
    }

    // Guard: isPrimary must be boolean if provided
    if (body.isPrimary !== undefined && typeof body.isPrimary !== "boolean") {
        return false;
    }

    return true;
}
