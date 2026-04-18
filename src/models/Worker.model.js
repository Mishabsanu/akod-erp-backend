import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    workerId: { type: String, required: true, unique: true, trim: true }, // Internal ID
    name: { type: String, required: true, trim: true },
    nationality: { type: String, trim: true },
    designation: { type: String, trim: true }, // e.g., "Driver", "Helper", "Mechanic"
    mobile: { type: String, trim: true },
    passportNo: { type: String, trim: true },
    qidNo: { type: String, trim: true }, // Qatar ID
    joinDate: { type: String },
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: "Facility" }, // Current Camp/Room
    documents: [
      {
        docType: { type: String, enum: ["Passport", "QID", "Contract", "Other"] },
        filePath: { type: String },
        expiryDate: { type: String }
      }
    ],
    status: { type: String, enum: ["active", "on_leave", "resigned"], default: "active" },
    remarks: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Worker = mongoose.model("Worker", workerSchema);
