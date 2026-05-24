import { Request } from "express";
import AuditLogModel from "../Models/auditLogModel.js";

interface CreateAuditLogParams {
  userId: string;
  action: string;
  entityType:
    | "Organization"
    | "Campus"
    | "User"
    | "Incident"
    | "SOS"
    | "Chat"
    | "Notification"
    | "EmergencyContact"
    | "Lead"
    | "System";
  organizationId?: string;
  campusId?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  req?: Request;
}

/**
 * Safely creates an audit log entry.
 * Never throws — errors are caught and logged so the main request is never affected.
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await AuditLogModel.create({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      organizationId: params.organizationId || undefined,
      campusId: params.campusId || undefined,
      entityId: params.entityId || undefined,
      metadata: params.metadata || {},
      ipAddress: params.req?.ip,
      userAgent: params.req?.headers["user-agent"],
    });
  } catch (err) {
    // Never crash the main request — just log the error
    console.error("[AuditLog] Failed to write audit log:", err);
  }
}
