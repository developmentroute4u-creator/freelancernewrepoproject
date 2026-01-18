import mongoose, { Schema, Document, Types } from 'mongoose';
import { BadgeLevel } from './Freelancer.js';

export enum TestLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface ITest extends Document {
  freelancerId: Types.ObjectId;
  field: string;
  innerFields: string[];
  testLevel: TestLevel;
  title: string;
  description: string;
  instructions: string;
  generatedBy: 'GEMINI' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema = new Schema<ITest>(
  {
    freelancerId: {
      type: Schema.Types.ObjectId,
      ref: 'Freelancer',
      required: true,
    },
    field: { type: String, required: true },
    innerFields: [{ type: String }],
    testLevel: {
      type: String,
      enum: Object.values(TestLevel),
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructions: { type: String, required: true },
    generatedBy: {
      type: String,
      enum: ['GEMINI', 'ADMIN'],
      default: 'GEMINI',
    },
  },
  {
    timestamps: true,
  }
);

TestSchema.index({ freelancerId: 1 });
TestSchema.index({ field: 1 });

export const Test = mongoose.model<ITest>('Test', TestSchema);
