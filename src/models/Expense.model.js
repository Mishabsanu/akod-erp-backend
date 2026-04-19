import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { 
      type: String, 
      required: true,
      enum: ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Other']
    },
    referenceNo: { type: String, trim: true },
    description: { type: String, trim: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    status: { 
      type: String, 
      default: 'paid',
      enum: ['pending', 'paid', 'cancelled']
    },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    attachments: [{ type: String }],
    companyName: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", expenseSchema);
