import { Types } from "mongoose";

// All roles supported across the SaaS platform
export type Role =
  | "student"
  | "staff"
  | "super_admin"
  | "organization_owner"
  | "campus_admin"
  | "security_incharge"
  | "security_personnel";

export type UserStatus = "pending" | "active" | "rejected" | "suspended";

export interface IUser {
  username: string;
  email: string;
  password: string;
  role: Role;
  avatar?: string | null;
  // Organization & Campus (SaaS multi-tenant)
  organizationId?: Types.ObjectId;  // TODO: backfill for old users via backfillOrganizationId.ts
  campusId?: Types.ObjectId;
  status: UserStatus;
  // University-specific fields
  rollNumber?: string;
  universityName?: string;
  departmentName?: string;
  program?: string;
  semester?: string;
  section?: string;
  fcmTokens: string[];
  resetPasswordOTP?: string | null;
  resetPasswordOTPExpires?: Date | null;
  phoneNumber?: string;
  personalEmergencyContacts?: { name: string; phoneNumber: string }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  avatar?: string | null;
  organizationId?: string;
  campusId?: string;
  rollNumber?: string;
  universityName?: string;
  departmentName?: string;
  program?: string;
  semester?: string;
  section?: string;
}