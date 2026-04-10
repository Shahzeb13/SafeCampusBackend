import { IncidentModal } from "../../Modals/incidentModal.js";

export function isValidIncident(body: unknown): body is Incident {
    if (body === null || body === undefined || typeof body !== "object") {
        return false;
    }

    const b = body as Record<string, unknown>;

    // Required fields
    if (
        typeof b.reporter_id !== "string" ||
        typeof b.handled_by !== "string" ||
        typeof b.description !== "string" ||
        typeof b.location_name !== "string" ||
        typeof b.type_incident !== "string" ||
        typeof b.priority !== "string"
    ) {
        return false;
    }

    // Enum validation
    const validTypes = ["vendalism", "fighting", "grafiti", "drugs", "unauthorized_Access"];
    if (!validTypes.includes(b.type_incident as string)) {
        return false;
    }

    const validPriorities = ["low", "medium", "high", "severe"];
    if (!validPriorities.includes(b.priority as string)) {
        return false;
    }

    if (b.status !== undefined) {
        const validStatuses = ["pending", "under_process", "approved", "rejected"];
        if (typeof b.status !== "string" || !validStatuses.includes(b.status)) {
            return false;
        }
    }

    // Optional locationCoords validation
    if (b.locationCoords !== undefined) {
        const coords = b.locationCoords as any;
        if (
            typeof coords !== "object" ||
            coords === null ||
            coords.type !== "Point" ||
            !Array.isArray(coords.coordinates) ||
            coords.coordinates.length !== 2 ||
            typeof coords.coordinates[0] !== "number" ||
            typeof coords.coordinates[1] !== "number"
        ) {
            return false;
        }
    }

    return true;
}
