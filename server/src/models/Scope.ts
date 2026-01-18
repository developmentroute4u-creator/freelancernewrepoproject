import mongoose, { Schema, Document, Types } from 'mongoose';

export enum ScopeMode {
  PLATFORM_SCOPE = 'PLATFORM_SCOPE', // Paid, locked & enforceable
  OWN_SCOPE = 'OWN_SCOPE', // Free, platform not responsible
}

export interface IIntentAnswers {
  goalOfWork: string;
  usageContext: string;
  priority: 'SPEED' | 'QUALITY' | 'DEPTH';
  references?: string[];
  deadline: Date;
}

export interface IScope extends Document {
  projectId?: Types.ObjectId;
  field: string;
  innerFields: string[];
  intentAnswers: IIntentAnswers;
  // SOW Structure - Professional Statement of Work format
  projectOverview: string; // Clear description aligned with client intent
  inScopeItems: string[]; // Detailed deliverables, structured sections, phase-wise or category-wise
  outOfScopeItems: string[]; // Explicit exclusions, no ambiguity
  assumptions: string[]; // Technical & non-technical assumptions
  deliverables: string[]; // What client will receive, formats & expectations
  timeline: string[]; // Phase-wise or milestone-based timeline
  acceptanceCriteria: string[]; // When work is considered complete
  // Legacy fields (kept for backward compatibility)
  inclusions: string[]; // Mapped from inScopeItems
  exclusions: string[]; // Mapped from outOfScopeItems
  completionCriteria: string[]; // Mapped from acceptanceCriteria
  revisionLimits: number;
  scopeMode: ScopeMode;
  isLocked: boolean;
  lockedAt?: Date;
  isPaid: boolean;
  paidAt?: Date;
  pdfFrameworkVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IntentAnswersSchema = new Schema<IIntentAnswers>({
  goalOfWork: { type: String, required: true },
  usageContext: { type: String, required: true },
  priority: {
    type: String,
    enum: ['SPEED', 'QUALITY', 'DEPTH'],
    required: true,
  },
  references: [{ type: String }],
  deadline: { type: Date, required: true },
});

const ScopeSchema = new Schema<IScope>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: false, // Optional - scope created before project
    },
    field: { type: String, required: true },
    innerFields: [{ type: String }],
    intentAnswers: { type: IntentAnswersSchema, required: true },
    // SOW Structure
    projectOverview: { type: String, required: false },
    inScopeItems: [{ type: String }],
    outOfScopeItems: [{ type: String }],
    assumptions: [{ type: String }],
    deliverables: [{ type: String }],
    timeline: [{ type: String }],
    acceptanceCriteria: [{ type: String }],
    // Legacy fields (for backward compatibility)
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    completionCriteria: [{ type: String }],
    revisionLimits: { type: Number, required: true },
    scopeMode: {
      type: String,
      enum: Object.values(ScopeMode),
      required: true,
    },
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    pdfFrameworkVersion: { type: String },
  },
  {
    timestamps: true,
  }
);

ScopeSchema.index({ projectId: 1 });
ScopeSchema.index({ field: 1 });
ScopeSchema.index({ isLocked: 1 });

export const Scope = mongoose.model<IScope>('Scope', ScopeSchema);
