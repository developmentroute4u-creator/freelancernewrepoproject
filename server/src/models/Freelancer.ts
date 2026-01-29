import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AvailabilityType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT_BASED = 'CONTRACT_BASED',
  HOURLY_BASED = 'HOURLY_BASED',
}

export enum BadgeLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum FreelancerStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IEducation {
  universityName: string;
  degree: string;
  field?: string;
  innerFields?: string[];
}

export interface IFreelancer extends Document {
  userId: Types.ObjectId;
  fullName: string;
  mobileNumber: string;
  yearsOfExperience?: number;
  location: string;
  expectedComfortRangeMin?: number; // INR, internal only
  expectedComfortRangeMax?: number; // INR, internal only
  hourlyRate?: number; // INR, set by admin, visible to clients
  availability: AvailabilityType;
  education?: IEducation;
  portfolioUrls: string[];
  badgeLevel?: BadgeLevel;
  badgeScore?: number;
  badgeFeedback?: string;
  badgeStrengths?: string[];
  badgeImprovementAreas?: string[];
  rejectedTestLevel?: BadgeLevel; // Track rejected test level for retake
  status: FreelancerStatus;
  createdAt: Date;
  updatedAt: Date;
}

const EducationSchema = new Schema<IEducation>({
  universityName: { type: String, required: true },
  degree: { type: String, required: true },
  field: { type: String, required: false },
  innerFields: [{ type: String }],
});

const FreelancerSchema = new Schema<IFreelancer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    yearsOfExperience: { type: Number },
    location: { type: String, required: true },
    expectedComfortRangeMin: { type: Number },
    expectedComfortRangeMax: { type: Number },
    hourlyRate: { type: Number }, // Set by admin during review
    availability: {
      type: String,
      enum: Object.values(AvailabilityType),
      required: true,
    },
    education: { type: EducationSchema },
    portfolioUrls: [{ type: String }],
    badgeLevel: {
      type: String,
      enum: Object.values(BadgeLevel),
    },
    badgeScore: { type: Number },
    badgeFeedback: { type: String },
    badgeStrengths: [{ type: String }],
    badgeImprovementAreas: [{ type: String }],
    rejectedTestLevel: {
      type: String,
      enum: Object.values(BadgeLevel),
    },
    status: {
      type: String,
      enum: Object.values(FreelancerStatus),
      default: FreelancerStatus.UNDER_REVIEW, // New freelancers start in UNDER_REVIEW status
    },
  },
  {
    timestamps: true,
  }
);

// userId index is automatically created by unique: true
FreelancerSchema.index({ badgeLevel: 1 });
FreelancerSchema.index({ 'education.field': 1 });
FreelancerSchema.index({ status: 1 });

export const Freelancer = mongoose.model<IFreelancer>('Freelancer', FreelancerSchema);
