import { User } from "../../Modals/userModal.js";

export function isValidUserRegistrationRequest(body: unknown): body is User {
    if (body === null || body === undefined) {
        return false;
    }
    // body    type object {}
    // at this stage , body is every type in javascript except null and undefined cause i narrowed it
    body
    if (typeof body !== "object") {
        return false
    }

    body;// at this point, now the type is object and only non-primitive types are involved
    const b = body as Record<string, unknown>
if (
    typeof b.username !== "string" ||
    typeof b.email !== "string" ||
    typeof b.password !== "string" ||
    typeof b.role !== "string" ||
    (typeof b.avatar !== "string" && b.avatar !== null)
) {
    return false;
}

    
    return true;

}