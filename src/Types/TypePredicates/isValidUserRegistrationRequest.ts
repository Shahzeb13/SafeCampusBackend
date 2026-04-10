import {UserRegistrationRequest } from "../userTypes.js";

export function isValidUserRegistrationRequest(body: unknown): body is UserRegistrationRequest{
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


    // required fields
    if (typeof b.username !== "string") return false;
    if (typeof b.email !== "string") return false;
    if (typeof b.password !== "string") return false;
    if (typeof b.role !== "string") return false;

    // optional fields
    if (b.avatar !== undefined && b.avatar !== null && typeof b.avatar !== "string") return false;

    if (b.rollNumber !== undefined && typeof b.rollNumber !== "string") return false;
    if (b.universityName !== undefined && typeof b.universityName !== "string") return false;
    if (b.departmentName !== undefined && typeof b.departmentName !== "string") return false;
    if (b.program !== undefined && typeof b.program !== "string") return false;
    if (b.semester !== undefined && typeof b.semester !== "string") return false;
    if (b.section !== undefined && typeof b.section !== "string") return false;

    return true;

}