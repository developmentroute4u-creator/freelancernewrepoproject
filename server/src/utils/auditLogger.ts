import { AuditLog, AuditAction } from '../models/AuditLog.js';
import { Types } from 'mongoose';

// Re-export AuditAction for convenience
export { AuditAction };

export interface AuditLogData {
  action: AuditAction;
  userId: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export const logAudit = async (data: AuditLogData): Promise<void> => {
  try {
    await AuditLog.create({
      action: data.action,
      userId: new Types.ObjectId(data.userId),
      entityType: data.entityType,
      entityId: new Types.ObjectId(data.entityId),
      metadata: data.metadata || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
    // Don't throw - audit logging should not break the main flow
  }
};
