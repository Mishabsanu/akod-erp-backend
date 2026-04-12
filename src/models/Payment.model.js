import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    type: { 
      type: String, 
      required: true,
      enum: ['Received', 'Paid']
    },
    amount: { type: Number, required: true },
    paymentMethod: { 
      type: String, 
      required: true,
      enum: ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Other']
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // Link to Invoice or Expense
    referenceType: { 
      type: String, 
      default: 'General',
      enum: ['Invoice', 'Expense', 'General']
    },
    transactionId: { type: String, trim: true },
    remarks: { type: String, trim: true },
    companyName: { type: String, trim: true },
    status: { 
      type: String, 
      default: 'completed',
      enum: ['completed', 'pending', 'failed']
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
