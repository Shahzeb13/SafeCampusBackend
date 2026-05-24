import { Role } from "./userTypes.js";

export type jwtPayLoad = {
  id: string;
  role: Role;
  organizationId?: string; // undefined for super_admin
  campusId?: string;       // undefined for super_admin and organization_owner
};
