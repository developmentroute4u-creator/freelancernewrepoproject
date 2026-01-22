import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITestSubmission extends Document {
  testId: Types.ObjectId;
  freelancerId: Types.ObjectId;
  zipFileUrl?: string;
  githubRepositoryLink?: string;
  figmaLink?: string;
  liveWebsiteUrl?: string;
  demoVideoUrl?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId; // Admin userId
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'REVIEWED';
  rejected?: boolean; // Track if this specific test was rejected
  rejectionFeedback?: string; // Feedback for rejected test
  createdAt: Date;
  updatedAt: Date;
}

const TestSubmissionSchema = new Schema<ITestSubmission>(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    freelancerId: {
      type: Schema.Types.ObjectId,
      ref: 'Freelancer',
      required: true,
    },
    zipFileUrl: { type: String },
    githubRepositoryLink: { type: String },
    figmaLink: { type: String },
    liveWebsiteUrl: { type: String },
    demoVideoUrl: { type: String },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'UNDER_REVIEW', 'REVIEWED'],
      default: 'SUBMITTED',
    },
    rejected: {
      type: Boolean,
      default: false,
    },
    rejectionFeedback: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

TestSubmissionSchema.index({ testId: 1 });
TestSubmissionSchema.index({ freelancerId: 1 });
TestSubmissionSchema.index({ status: 1 });

export const TestSubmission = mongoose.model<ITestSubmission>('TestSubmission', TestSubmissionSchema);
