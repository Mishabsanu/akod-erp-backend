import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    itemCode: { type: String, required: true },
    description: { type: String, required: true },
    unit: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", ProductSchema);
