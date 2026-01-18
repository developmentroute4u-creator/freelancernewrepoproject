import mongoose, { Schema, Document, Types } from 'mongoose';

export enum DepthLevel {
    BASIC = 'BASIC',
    STANDARD = 'STANDARD',
    COMPREHENSIVE = 'COMPREHENSIVE',
}

export interface IPricingRule extends Document {
    field: string;
    innerField: string;
    deliverableType: string;
    depth: DepthLevel;
    minPrice: number; // Floor - cannot go below
    maxPrice: number; // Ceiling - cannot go above
    currency: string;
    isActive: boolean;
    createdBy: Types.ObjectId;
    lastUpdated: Date;
    auditLog: Array<{
        action: string;
        changedBy: Types.ObjectId;
        timestamp: Date;
        oldValues: any;
        newValues: any;
        reasoning?: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const PricingRuleSchema = new Schema<IPricingRule>(
    {
        field: {
            type: String,
            required: true,
            index: true,
        },
        innerField: {
            type: String,
            required: true,
            index: true,
        },
        deliverableType: {
            type: String,
            required: true,
        },
        depth: {
            type: String,
            enum: Object.values(DepthLevel),
            required: true,
        },
        minPrice: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: function (this: IPricingRule, value: number) {
                    return value < this.maxPrice;
                },
                message: 'minPrice must be less than maxPrice',
            },
        },
        maxPrice: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: function (this: IPricingRule, value: number) {
                    return value > this.minPrice;
                },
                message: 'maxPrice must be greater than minPrice',
            },
        },
        currency: {
            type: String,
            default: 'INR',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
        auditLog: [
            {
                action: String,
                changedBy: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                oldValues: Schema.Types.Mixed,
                newValues: Schema.Types.Mixed,
                reasoning: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient lookups
PricingRuleSchema.index({ field: 1, innerField: 1, deliverableType: 1, depth: 1 }, { unique: true });
PricingRuleSchema.index({ isActive: 1 });

export const PricingRule = mongoose.model<IPricingRule>('PricingRule', PricingRuleSchema);
