import mongoose, { Schema, Document, Types } from 'mongoose';

export enum PricingAuditAction {
    RULE_CREATED = 'RULE_CREATED',
    RULE_UPDATED = 'RULE_UPDATED',
    RULE_DELETED = 'RULE_DELETED',
    MODIFIER_CREATED = 'MODIFIER_CREATED',
    MODIFIER_UPDATED = 'MODIFIER_UPDATED',
    PRICE_CALCULATED = 'PRICE_CALCULATED',
    PRICE_LOCKED = 'PRICE_LOCKED',
    PRICE_ACCEPTED = 'PRICE_ACCEPTED',
    PRICE_REJECTED = 'PRICE_REJECTED',
    SCOPE_REDUCED = 'SCOPE_REDUCED',
}

export enum AuditUserRole {
    ADMIN = 'ADMIN',
    CLIENT = 'CLIENT',
    FREELANCER = 'FREELANCER',
    SYSTEM = 'SYSTEM',
}

export enum AuditEntityType {
    PRICING_RULE = 'PRICING_RULE',
    DIFFICULTY_MODIFIER = 'DIFFICULTY_MODIFIER',
    PROJECT_PRICING = 'PROJECT_PRICING',
}

export interface IPricingAudit extends Document {
    action: PricingAuditAction;
    performedBy: Types.ObjectId;
    userRole: AuditUserRole;
    entityType: AuditEntityType;
    entityId: Types.ObjectId;
    changes: any;
    reasoning?: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}

const PricingAuditSchema = new Schema<IPricingAudit>(
    {
        action: {
            type: String,
            enum: Object.values(PricingAuditAction),
            required: true,
            index: true,
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        userRole: {
            type: String,
            enum: Object.values(AuditUserRole),
            required: true,
            index: true,
        },
        entityType: {
            type: String,
            enum: Object.values(AuditEntityType),
            required: true,
            index: true,
        },
        entityId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        changes: {
            type: Schema.Types.Mixed,
            required: true,
        },
        reasoning: {
            type: String,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
            index: true,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    {
        timestamps: false, // We use timestamp field instead
    }
);

// Indexes for efficient querying
PricingAuditSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
PricingAuditSchema.index({ action: 1, timestamp: -1 });
PricingAuditSchema.index({ performedBy: 1, timestamp: -1 });

export const PricingAudit = mongoose.model<IPricingAudit>('PricingAudit', PricingAuditSchema);
