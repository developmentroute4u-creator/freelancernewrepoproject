import mongoose, { Schema, Document, Types } from 'mongoose';

export enum PricingTier {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

export interface IWorkUnit {
    field: string;
    itemDescription: string;
    euValue: number; // Effort Units
}

export interface IFieldAggregation {
    field: string;
    twu: number; // Total Work Units
    mp: number; // Multiplier Product
    ei: number; // Effort Index
    baseRate: number; // ₹ per EU
    fieldValue: number; // EI × BaseRate
}

export interface IDeterministicPricing extends Document {
    projectId?: Types.ObjectId; // Optional - can be calculated before project creation
    scopeId: Types.ObjectId;
    
    // Core calculations
    workUnits: IWorkUnit[];
    fieldAggregations: IFieldAggregation[];
    twu: number; // Total Work Units
    mp: number; // Multiplier Product
    bpv: number; // Base Project Value
    
    // Price tiers
    low: number;
    medium: number;
    high: number;
    
    // Final prices (after caps)
    finalLow: number;
    finalMedium: number;
    finalHigh: number;
    
    // Breakdown
    breakdown: {
        scopeSize: string;
        complexityDrivers: string[];
        recommended: PricingTier;
    };
    
    // Calculation details
    calculationDetails: {
        timestamp: Date;
        difficultyFactors: {
            clarity: string;
            urgency: string;
            risk_compliance: string;
            integrations: string;
            ambiguity: string;
        };
        appliedCaps: {
            minCap: number;
            maxCap: number;
            lowCapped: boolean;
            mediumCapped: boolean;
            highCapped: boolean;
        };
    };
    
    // Audit
    auditId: Types.ObjectId;
    
    // Status
    status: 'CALCULATED' | 'PRESENTED' | 'ACCEPTED' | 'REJECTED';
    calculatedAt: Date;
    presentedAt?: Date;
    acceptedAt?: Date;
    
    createdAt: Date;
    updatedAt: Date;
}

const WorkUnitSchema = new Schema<IWorkUnit>({
    field: { type: String, required: true },
    itemDescription: { type: String, required: true },
    euValue: { type: Number, required: true, min: 0 },
}, { _id: false });

const FieldAggregationSchema = new Schema<IFieldAggregation>({
    field: { type: String, required: true },
    twu: { type: Number, required: true, min: 0 },
    mp: { type: Number, required: true, min: 0 },
    ei: { type: Number, required: true, min: 0 },
    baseRate: { type: Number, required: true, min: 0 },
    fieldValue: { type: Number, required: true, min: 0 },
}, { _id: false });

const DeterministicPricingSchema = new Schema<IDeterministicPricing>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: false,
            index: true,
        },
        scopeId: {
            type: Schema.Types.ObjectId,
            ref: 'Scope',
            required: true,
            index: true,
        },
        
        // Core calculations
        workUnits: [WorkUnitSchema],
        fieldAggregations: [FieldAggregationSchema],
        twu: {
            type: Number,
            required: true,
            min: 0,
        },
        mp: {
            type: Number,
            required: true,
            min: 0,
            max: 1.5, // Cap at 1.5
        },
        bpv: {
            type: Number,
            required: true,
            min: 0,
        },
        
        // Price tiers
        low: {
            type: Number,
            required: true,
            min: 0,
        },
        medium: {
            type: Number,
            required: true,
            min: 0,
        },
        high: {
            type: Number,
            required: true,
            min: 0,
        },
        
        // Final prices
        finalLow: {
            type: Number,
            required: true,
            min: 0,
        },
        finalMedium: {
            type: Number,
            required: true,
            min: 0,
        },
        finalHigh: {
            type: Number,
            required: true,
            min: 0,
        },
        
        // Breakdown
        breakdown: {
            scopeSize: { type: String, required: true },
            complexityDrivers: [{ type: String }],
            recommended: {
                type: String,
                enum: Object.values(PricingTier),
                required: true,
            },
        },
        
        // Calculation details
        calculationDetails: {
            timestamp: { type: Date, required: true },
            difficultyFactors: {
                clarity: { type: String, required: true },
                urgency: { type: String, required: true },
                risk_compliance: { type: String, required: true },
                integrations: { type: String, required: true },
                ambiguity: { type: String, required: true },
            },
            appliedCaps: {
                minCap: { type: Number, required: true },
                maxCap: { type: Number, required: true },
                lowCapped: { type: Boolean, required: true },
                mediumCapped: { type: Boolean, required: true },
                highCapped: { type: Boolean, required: true },
            },
        },
        
        // Audit
        auditId: {
            type: Schema.Types.ObjectId,
            ref: 'PricingAudit',
            required: true,
        },
        
        // Status
        status: {
            type: String,
            enum: ['CALCULATED', 'PRESENTED', 'ACCEPTED', 'REJECTED'],
            default: 'CALCULATED',
            required: true,
        },
        calculatedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        presentedAt: {
            type: Date,
        },
        acceptedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
DeterministicPricingSchema.index({ scopeId: 1 });
DeterministicPricingSchema.index({ projectId: 1 });
DeterministicPricingSchema.index({ status: 1 });
DeterministicPricingSchema.index({ calculatedAt: -1 });

export const DeterministicPricing = mongoose.model<IDeterministicPricing>(
    'DeterministicPricing',
    DeterministicPricingSchema
);
