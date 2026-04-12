import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    referenceType: { type: String, trim: true },
    companyName: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Ledger = mongoose.model("Ledger", ledgerSchema);
