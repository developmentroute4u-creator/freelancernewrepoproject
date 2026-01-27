import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  FREELANCER = 'FREELANCER',
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Email index is automatically created by unique: true
UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
