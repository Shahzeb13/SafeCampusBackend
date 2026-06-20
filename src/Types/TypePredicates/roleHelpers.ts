import { Role } from "../userTypes.js";

/**
 * Role helper / type predicate functions for SaaS-aware access control.
 * These helpers check a user's role and return a boolean (type-narrowed where useful).
 * Use these in middleware and controllers instead of raw string comparisons.
 */

export function isSuperAdmin(role: Role): boolean {
  return role === "super_admin";
}

export function isOrganizationOwner(role: Role): boolean {
  return role === "organization_owner";
}

/**
 * Campus-level admins: "campus_admin".
 */
export function isCampusAdmin(role: Role): boolean {
  return role === "campus_admin";
}

export function isSecurityIncharge(role: Role): boolean {
  return role === "security_incharge";
}

/**
 * Security personnel (guards).
 */
export function isSecurityGuard(role: Role): boolean {
  return role === "security_personnel";
}

/**
 * Any security-level role (incharge or personnel).
 */
export function isSecurityRole(role: Role): boolean {
  return (
    role === "security_incharge" ||
    role === "security_personnel"
  );
}

export function isStudent(role: Role): boolean {
  return role === "student";
}

export function isStaff(role: Role): boolean {
  return role === "staff";
}

/**
 * Admin-like roles: can manage an org or campus.
 */
export function isAdminLike(role: Role): boolean {
  return (
    role === "super_admin" ||
    role === "organization_owner" ||
    role === "campus_admin" ||
    role === "security_incharge"
  );
}

/**
 * Any role that is scoped to a specific campus (not super_admin or org_owner).
 */
export function isCampusUser(role: Role): boolean {
  return (
    role === "student" ||
    role === "staff" ||
    role === "campus_admin" ||
    role === "security_incharge" ||
    role === "security_personnel"
  );
}
