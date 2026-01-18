import mongoose, { Schema, Document } from 'mongoose';

export enum ModifierType {
    DEADLINE = 'DEADLINE',
    COMPLEXITY = 'COMPLEXITY',
    AMBIGUITY = 'AMBIGUITY',
    INDUSTRY = 'INDUSTRY',
    CRITICALITY = 'CRITICALITY',
}

export interface IDifficultyModifier extends Document {
    modifierType: ModifierType;
    level: string; // e.g., 'URGENT', 'COMPLEX', 'REGULATED'
    percentageImpact: number; // e.g., 20 for +20%
    maxCap: number; // Maximum allowed impact for this modifier type
    isActive: boolean;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

const DifficultyModifierSchema = new Schema<IDifficultyModifier>(
    {
        modifierType: {
            type: String,
            enum: Object.values(ModifierType),
            required: true,
            index: true,
        },
        level: {
            type: String,
            required: true,
            index: true,
        },
        percentageImpact: {
            type: Number,
            required: true,
            validate: {
                validator: function (value: number) {
                    return value >= -50 && value <= 50;
                },
                message: 'percentageImpact must be between -50 and 50',
            },
        },
        maxCap: {
            type: Number,
            required: true,
            default: 40,
            validate: {
                validator: function (value: number) {
                    return value > 0 && value <= 50;
                },
                message: 'maxCap must be between 0 and 50',
            },
        },
        isActive: {
            type: Boolean,
            default: true,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index
DifficultyModifierSchema.index({ modifierType: 1, level: 1 }, { unique: true });
DifficultyModifierSchema.index({ isActive: 1 });

export const DifficultyModifier = mongoose.model<IDifficultyModifier>(
    'DifficultyModifier',
    DifficultyModifierSchema
);
