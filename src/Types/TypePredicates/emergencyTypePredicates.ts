import { EmergencyContact } from "../../Models/emergencyContactModel.js";

export function isEmergencyContactBody(value: unknown): value is Partial<EmergencyContact> {
    if (value === null || typeof value !== "object") return false;

    const body = value as Record<string, unknown>;

    return (
        typeof body.name === "string" && body.name.trim().length > 0 &&
        typeof body.phoneNumber === "string" && body.phoneNumber.trim().length > 0 &&
        (body.category === undefined || ["security", "ambulance", "fire", "admin", "hostel", "other"].includes(body.category as string)) &&
        (body.isPrimary === undefined || typeof body.isPrimary === "boolean")
    );
}
