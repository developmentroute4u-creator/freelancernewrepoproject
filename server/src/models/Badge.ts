import mongoose, { Schema, Document, Types } from 'mongoose';
import { BadgeLevel } from './Freelancer.js';

export interface IBadge extends Document {
  freelancerId: Types.ObjectId;
  badgeLevel: BadgeLevel;
  score: number;
  feedback: string;
  strengths: string[];
  improvementAreas: string[];
  awardedBy: Types.ObjectId; // Admin userId
  awardedAt: Date;
  isImmutable: boolean;
  overrideReason?: string; // If admin overrides
  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema = new Schema<IBadge>(
  {
    freelancerId: {
      type: Schema.Types.ObjectId,
      ref: 'Freelancer',
      required: true,
    },
    badgeLevel: {
      type: String,
      enum: Object.values(BadgeLevel),
      required: true,
    },
    score: { type: Number, required: true },
    feedback: { type: String, required: true },
    strengths: [{ type: String }],
    improvementAreas: [{ type: String }],
    awardedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    awardedAt: { type: Date, default: Date.now },
    isImmutable: { type: Boolean, default: true },
    overrideReason: { type: String },
  },
  {
    timestamps: true,
  }
);

BadgeSchema.index({ freelancerId: 1 });
BadgeSchema.index({ badgeLevel: 1 });

export const Badge = mongoose.model<IBadge>('Badge', BadgeSchema);
