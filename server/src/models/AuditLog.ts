import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AuditAction {
  // User actions
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  
  // Freelancer actions
  FREELANCER_REGISTERED = 'FREELANCER_REGISTERED',
  FREELANCER_UPDATED = 'FREELANCER_UPDATED',
  TEST_SUBMITTED = 'TEST_SUBMITTED',
  BADGE_AWARDED = 'BADGE_AWARDED',
  BADGE_OVERRIDDEN = 'BADGE_OVERRIDDEN',
  
  // Client actions
  CLIENT_REGISTERED = 'CLIENT_REGISTERED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  
  // Scope actions
  SCOPE_CREATED = 'SCOPE_CREATED',
  SCOPE_LOCKED = 'SCOPE_LOCKED',
  SCOPE_UPDATED = 'SCOPE_UPDATED',
  
  // Project actions
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_STATE_CHANGED = 'PROJECT_STATE_CHANGED',
  PROJECT_COMPLETED = 'PROJECT_COMPLETED',
  PROJECT_CLOSED = 'PROJECT_CLOSED',
  
  // Escalation actions
  ESCALATION_RAISED = 'ESCALATION_RAISED',
  ESCALATION_RESOLVED = 'ESCALATION_RESOLVED',
  
  // Admin actions
  ADMIN_DECISION = 'ADMIN_DECISION',
  ADMIN_OVERRIDE = 'ADMIN_OVERRIDE',
}

export interface IAuditLog extends Document {
  action: AuditAction;
  userId: Types.ObjectId;
  entityType: string; // 'User', 'Freelancer', 'Project', etc.
  entityId: Types.ObjectId;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
