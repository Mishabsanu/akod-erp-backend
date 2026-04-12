import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    poNo: {
      type: String,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    itemCode: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
    },
    orderedQty: {
      type: Number,
      required: true, // qty received from PO
    },

    availableQty: {
      type: Number,
      required: true, // remaining stock
    },

    status: {
      type: String,
      enum: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"],
      default: "IN_STOCK",
    },

    history: [
      {
        type: {
          type: String,
          enum: [
            "ADD_STOCK",
            "INVENTORY_ADJUSTMENT",
            "DELIVERY",
            "RETURN",
            "RETURN_REVERT",
            "DELIVERY_ROLLBACK",
            "RETURN_DELETE_ROLLBACK",
            "DELIVERY_DELETE_ROLLBACK",
          ],
          required: true,
        },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
        stock: {
          type: Number,
          required: true,
        },
        ticketNo: String,
        note: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

inventorySchema.index({ poNo: 1, product: 1 }, { unique: true });

inventorySchema.pre("save", function (next) {
  if (this.availableQty === 0) {
    this.status = "OUT_OF_STOCK";
  } else if (this.availableQty <= 100) {
    this.status = "LOW_STOCK";
  } else {
    this.status = "IN_STOCK";
  }
  next();
});

export const Inventory = mongoose.model("Inventory", inventorySchema);
