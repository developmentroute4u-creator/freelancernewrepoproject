import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClient extends Document {
  userId: Types.ObjectId;
  companyName: string;
  industry: string;
  teamSize: string; // "1-10", "11-50", "51-200", "200+"
  contactPersonName: string;
  phoneNumber: string;
  typeOfFreelancerNeeded: string[]; // Array of fields
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: { type: String, required: true },
    industry: { type: String, required: true },
    teamSize: {
      type: String,
      required: true,
      enum: ['1-10', '11-50', '51-200', '200+']
    },
    contactPersonName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    typeOfFreelancerNeeded: {
      type: [String],
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'APPROVED' // Auto-approve for now
    }
  },
  {
    timestamps: true,
  }
);

ClientSchema.index({ userId: 1 });
ClientSchema.index({ industry: 1 });

export const Client = mongoose.model<IClient>('Client', ClientSchema);
