import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, unique: true },
    date: { type: String, required: true },
    category: { type: String, default: 'General', trim: true },
    type: { 
      type: String, 
      required: true,
      enum: ['Received', 'Paid']
    },
    amount: { type: Number, required: true },
    modeOfPayment: { 
      type: String, 
      required: true,
      enum: ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Other']
    },
    // Mode specific fields
    chequeNo: { type: String, trim: true },
    chequeDate: { type: String, trim: true },
    bank: { type: String, trim: true },
    transactionId: { type: String, trim: true },
    voucherNo: { type: String, trim: true },

    referenceId: { type: mongoose.Schema.Types.ObjectId }, // Link to Invoice or Expense
    referenceType: { 
      type: String, 
      default: 'General',
      enum: ['Invoice', 'Expense', 'General']
    },
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
