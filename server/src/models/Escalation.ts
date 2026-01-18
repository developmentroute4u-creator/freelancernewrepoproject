import mongoose, { Schema, Document, Types } from 'mongoose';

export enum EscalationType {
  SCOPE_VIOLATION = 'SCOPE_VIOLATION',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  DELAY = 'DELAY',
  OTHER = 'OTHER',
}

export enum EscalationStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface IEscalation extends Document {
  projectId: Types.ObjectId;
  raisedBy: Types.ObjectId; // Client or Freelancer userId
  escalationType: EscalationType;
  description: string;
  status: EscalationStatus;
  assignedTo?: Types.ObjectId; // Admin userId
  resolution?: string;
  resolutionDecision?: 'REWORK' | 'REPLACEMENT' | 'REFUND' | 'CLOSURE';
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId; // Admin userId
  createdAt: Date;
  updatedAt: Date;
}

const EscalationSchema = new Schema<IEscalation>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    raisedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    escalationType: {
      type: String,
      enum: Object.values(EscalationType),
      required: true,
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(EscalationStatus),
      default: EscalationStatus.OPEN,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: { type: String },
    resolutionDecision: {
      type: String,
      enum: ['REWORK', 'REPLACEMENT', 'REFUND', 'CLOSURE'],
    },
    resolvedAt: { type: Date },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

EscalationSchema.index({ projectId: 1 });
EscalationSchema.index({ status: 1 });
EscalationSchema.index({ raisedBy: 1 });

export const Escalation = mongoose.model<IEscalation>('Escalation', EscalationSchema);
