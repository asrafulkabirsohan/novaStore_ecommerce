import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser, IAddress } from "@/types";

export interface IUserDocument extends Omit<IUser, "_id">, Document {}

const AddressSchema = new Schema<IAddress>(
  {
    label: { type: String, required: true, default: "Home" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "Bangladesh" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "trashed"],
      default: "active",
      index: true,
    },
    phone: { type: String, trim: true },
    addresses: [AddressSchema],
  },
  { timestamps: true }
);

// Force model re-registration in development mode so new fields take effect
if (process.env.NODE_ENV === "development" && mongoose.models.User) {
  delete mongoose.models.User;
}

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
