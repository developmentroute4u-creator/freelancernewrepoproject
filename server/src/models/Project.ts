import mongoose, { Schema, Document, Types } from 'mongoose';

export enum ProjectState {
  DRAFT = 'DRAFT',
  PENDING_ACCEPTANCE = 'PENDING_ACCEPTANCE', // Invitations sent, waiting for freelancer
  ACTIVE = 'ACTIVE',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  CLOSED = 'CLOSED',
}

export enum AccountabilityMode {
  BASIC = 'BASIC', // Free - platform connects only
  ACCOUNTABILITY = 'ACCOUNTABILITY', // Paid - platform enforces scope
}

export interface IProject extends Document {
  name: string; // Project name provided by client
  clientId: Types.ObjectId;
  freelancerId?: Types.ObjectId; // Optional - can be assigned later
  scopeId: Types.ObjectId;
  state: ProjectState;
  accountabilityMode: AccountabilityMode;
  startedAt?: Date;
  completedAt?: Date;
  closedAt?: Date;
  closedBy?: Types.ObjectId; // Admin userId
  closedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    freelancerId: {
      type: Schema.Types.ObjectId,
      ref: 'Freelancer',
      required: false, // Optional - can be assigned later
    },
    scopeId: {
      type: Schema.Types.ObjectId,
      ref: 'Scope',
      required: true,
    },
    state: {
      type: String,
      enum: Object.values(ProjectState),
      default: ProjectState.DRAFT,
    },
    accountabilityMode: {
      type: String,
      enum: Object.values(AccountabilityMode),
      required: true,
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    closedAt: { type: Date },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    closedReason: { type: String },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ clientId: 1 });
ProjectSchema.index({ freelancerId: 1 });
ProjectSchema.index({ state: 1 });
ProjectSchema.index({ scopeId: 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
