import mongoose, { Schema, Document, Types } from 'mongoose';

export enum InvitationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
    EXPIRED = 'EXPIRED',
}

export interface IProjectInvitation extends Document {
    projectId: Types.ObjectId;
    freelancerId: Types.ObjectId;
    status: InvitationStatus;
    invitedAt: Date;
    respondedAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectInvitationSchema = new Schema<IProjectInvitation>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        freelancerId: {
            type: Schema.Types.ObjectId,
            ref: 'Freelancer',
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(InvitationStatus),
            default: InvitationStatus.PENDING,
        },
        invitedAt: {
            type: Date,
            default: Date.now,
        },
        respondedAt: {
            type: Date,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
ProjectInvitationSchema.index({ projectId: 1, status: 1 });
ProjectInvitationSchema.index({ freelancerId: 1, status: 1 });
ProjectInvitationSchema.index({ expiresAt: 1 });

// Compound unique index to prevent duplicate invitations
ProjectInvitationSchema.index({ projectId: 1, freelancerId: 1 }, { unique: true });

export const ProjectInvitation = mongoose.model<IProjectInvitation>(
    'ProjectInvitation',
    ProjectInvitationSchema
);
