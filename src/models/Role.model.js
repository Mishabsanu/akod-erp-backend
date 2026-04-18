import mongoose from "mongoose";

const PermissionSchema = new mongoose.Schema(
  {
    create: { type: Boolean, default: false },
    view: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    permissions: {
      user: { type: PermissionSchema, default: () => ({}) },
      role: { type: PermissionSchema, default: () => ({}) },
      customer: { type: PermissionSchema, default: () => ({}) },
      vendor: { type: PermissionSchema, default: () => ({}) },
      product: { type: PermissionSchema, default: () => ({}) },
      inventory: { type: PermissionSchema, default: () => ({}) },
      delivery_ticket: { type: PermissionSchema, default: () => ({}) },
      return_ticket: { type: PermissionSchema, default: () => ({}) },
      attendance: { type: PermissionSchema, default: () => ({}) },
      sales: { type: PermissionSchema, default: () => ({}) },
      quote_track: { type: PermissionSchema, default: () => ({}) },
      running_order: { type: PermissionSchema, default: () => ({}) },
      invoice: { type: PermissionSchema, default: () => ({}) },
      payment: { type: PermissionSchema, default: () => ({}) },
      expense: { type: PermissionSchema, default: () => ({}) },
      payroll: { type: PermissionSchema, default: () => ({}) },
      ledger: { type: PermissionSchema, default: () => ({}) },
      accounts: { type: PermissionSchema, default: () => ({}) },
      fleet: { type: PermissionSchema, default: () => ({}) },
      facility: { type: PermissionSchema, default: () => ({}) },
      worker: { type: PermissionSchema, default: () => ({}) },
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Role = mongoose.model("Role", RoleSchema);
