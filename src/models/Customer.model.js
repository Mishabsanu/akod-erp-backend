import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    mobile: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    address: { type: String, trim: true, required: true },
    pincode: { type: String, trim: true, required: true },
    city: { type: String, trim: true, required: true },
    district: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    contactPersonName: { type: String, trim: true, required: true },
    contactPersonEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    contactPersonMobile: { type: String, trim: true, required: true },
  },
  { timestamps: true }
);

export const Customer = mongoose.model("Customer", CustomerSchema);
