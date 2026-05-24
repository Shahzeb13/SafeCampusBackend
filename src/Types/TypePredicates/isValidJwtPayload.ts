import { jwtPayLoad } from "../jwtPayloadType.js";
import { Role } from "../userTypes.js";

/**
 * Type predicate: is the decoded JWT a valid jwtPayLoad?
 */
export function isValidJwtPayload(decoded: any): decoded is jwtPayLoad {
  if (typeof decoded !== "object" || decoded === null) return false;
  if (typeof decoded.id !== "string") return false;

  const validRoles: Role[] = [
    "student",
    "staff",
    "security_personnel",
    "super_admin",
    "organization_owner",
    "campus_admin",
    "security_incharge",
  ];
  if (!validRoles.includes(decoded.role)) return false;

  // organizationId and campusId are optional (undefined allowed for super_admin)
  if (decoded.organizationId !== undefined && typeof decoded.organizationId !== "string") return false;
  if (decoded.campusId !== undefined && typeof decoded.campusId !== "string") return false;

  return true;
}