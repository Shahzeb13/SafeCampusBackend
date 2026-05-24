import jwt from "jsonwebtoken";
import { Role } from "../Types/userTypes.js";

/**
 * Generates a JWT token embedding userId, role, organizationId, and campusId.
 * organizationId and campusId are optional (undefined for super_admin).
 */
const generateToken = (
  id: string,
  role: Role,
  organizationId?: string,
  campusId?: string
) => {
  return jwt.sign(
    { id, role, organizationId, campusId },
    process.env.JWT_SECRET || "fallbackSecretNoOneShouldKnow",
    { expiresIn: "30d" }
  );
};

export default generateToken;
