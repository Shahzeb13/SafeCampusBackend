import { Types } from "mongoose";

export type NotificationType = "incident" | "sos" | "assignment" | "system" | "chat";

export interface Notification {
  _id?: string;
  userId: string;
  incidentId?: string;
  sosId?: string;
  // SaaS multi-tenant
  organizationId: Types.ObjectId; // TODO: backfill for old notifications via backfillOrganizationId.ts
  campusId?: Types.ObjectId;
  type?: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
