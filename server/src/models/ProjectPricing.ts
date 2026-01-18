import mongoose, { Schema, Document, Types } from 'mongoose';

export enum PricingStatus {
    CALCULATED = 'CALCULATED',
    PRESENTED_TO_CLIENT = 'PRESENTED_TO_CLIENT',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
}

export interface IWorkUnit {
    field: string;
    innerField: string;
    deliverableType: string;
    quantity: number;
    minPrice: number;
    maxPrice: number;
}

export interface IAppliedModifier {
    modifierType: string;
    level: string;
    percentageImpact: number;
    reasoning: string;
}

export interface IProjectPricing extends Document {
    projectId: Types.ObjectId;
    scopeId: Types.ObjectId;

    // Layer 1: Base Price
    baseWorkUnits: IWorkUnit[];
    aggregatedMinPrice: number;
    aggregatedMaxPrice: number;

    // Layer 2: Difficulty Modifiers
    appliedModifiers: IAppliedModifier[];
    totalModifierImpact: number; // Capped at ±40%
    adjustedMinPrice: number;
    adjustedMaxPrice: number;

    // Layer 3: Badge Positioning
    freelancerBadgeLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    badgePositioning?: number; // 0.25, 0.50, or 0.75

    // Final Price
    finalPrice: number;
    currency: string;

    // Audit & Transparency
    calculationLog: any;
    clientExplanation: string;
    freelancerExplanation: string;

    // Status
    status: PricingStatus;
    calculatedAt: Date;
    lockedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const ProjectPricingSchema = new Schema<IProjectPricing>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            unique: true,
            index: true,
        },
        scopeId: {
            type: Schema.Types.ObjectId,
            ref: 'Scope',
            required: true,
            index: true,
        },

        // Layer 1: Base Price
        baseWorkUnits: [
            {
                field: { type: String, required: true },
                innerField: { type: String, required: true },
                deliverableType: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                minPrice: { type: Number, required: true, min: 0 },
                maxPrice: { type: Number, required: true, min: 0 },
            },
        ],
        aggregatedMinPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        aggregatedMaxPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        // Layer 2: Difficulty Modifiers
        appliedModifiers: [
            {
                modifierType: { type: String, required: true },
                level: { type: String, required: true },
                percentageImpact: { type: Number, required: true },
                reasoning: { type: String, required: true },
            },
        ],
        totalModifierImpact: {
            type: Number,
            required: true,
            default: 0,
            validate: {
                validator: function (value: number) {
                    return value >= -40 && value <= 40;
                },
                message: 'totalModifierImpact must be between -40 and 40',
            },
        },
        adjustedMinPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        adjustedMaxPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        // Layer 3: Badge Positioning
        freelancerBadgeLevel: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH'],
        },
        badgePositioning: {
            type: Number,
            validate: {
                validator: function (value: number) {
                    return value === 0.25 || value === 0.50 || value === 0.75;
                },
                message: 'badgePositioning must be 0.25, 0.50, or 0.75',
            },
        },

        // Final Price
        finalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: 'INR',
            required: true,
        },

        // Audit & Transparency
        calculationLog: {
            type: Schema.Types.Mixed,
            required: true,
        },
        clientExplanation: {
            type: String,
            required: true,
        },
        freelancerExplanation: {
            type: String,
            required: true,
        },

        // Status
        status: {
            type: String,
            enum: Object.values(PricingStatus),
            default: PricingStatus.CALCULATED,
            required: true,
        },
        calculatedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        lockedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ProjectPricingSchema.index({ status: 1 });
ProjectPricingSchema.index({ calculatedAt: -1 });

// Validation: Final price must be within adjusted range
ProjectPricingSchema.pre('save', function (next) {
    if (this.finalPrice < this.aggregatedMinPrice) {
        return next(new Error('FATAL: Final price below minimum allowed'));
    }
    if (this.finalPrice > this.aggregatedMaxPrice) {
        return next(new Error('FATAL: Final price above maximum allowed'));
    }
    next();
});

export const ProjectPricing = mongoose.model<IProjectPricing>('ProjectPricing', ProjectPricingSchema);
