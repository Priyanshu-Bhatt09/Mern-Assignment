import type { Types } from "mongoose";
import { Schema, model, type Document } from "mongoose";
import bcrypt from "bcrypt";

export const USER_ROLES = ["Admin", "Manager", "User"] as const; 
export const USER_STATUSES = ["Active", "Inactive"] as const;

export type UserRole = (typeof USER_ROLES)[number]; //convert arr into union type
export type UserStatus = (typeof USER_STATUSES)[number];

export interface IUser extends Document {
  name: string;
  username?: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "User",
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "Active",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword(this: IUser) {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

export const User = model<IUser>("User", userSchema);
