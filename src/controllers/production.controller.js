import mongoose from "mongoose";
import { Production } from "../models/Production.model.js";
import { RawMaterial } from "../models/RawMaterial.model.js";
import { createError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (search) {
    query.batchNumber = { $regex: search, $options: "i" };
  }
  if (req.query.status) {
    query.status = req.query.status;
  }

  const [productions, totalCount] = await Promise.all([
    Production.find(query)
      .populate("productId", "name itemCode unit")
      .populate("rawMaterials.material", "name itemCode unit")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Production.countDocuments(query),
  ]);

  return successResponse(res, "Production reports fetched successfully", 200, {
    content: productions,
    totalCount,
    totalPages: Math.ceil(totalCount / Number(limit)),
    currentPage: Number(page),
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const production = await Production.findById(req.params.id)
    .populate("productId", "name itemCode unit")
    .populate("rawMaterials.material", "name itemCode unit")
    .populate("createdBy", "name");
    
  if (!production) throw createError("Production report not found", 404);
  
  return successResponse(res, "Production report fetched successfully", 200, {
    content: production,
  });
});

export const create = asyncHandler(async (req, res) => {
  const { rawMaterials, ...rest } = req.body;
  const parsedRawMaterials = typeof rawMaterials === 'string' ? JSON.parse(rawMaterials) : rawMaterials;

  // Verify and Deduct Raw Materials
  if (parsedRawMaterials && parsedRawMaterials.length > 0) {
    for (const rm of parsedRawMaterials) {
      if (!rm.material || !rm.quantity) continue;
      const material = await RawMaterial.findById(rm.material);
      if (!material) throw createError(`Raw material not found: ${rm.material}`, 404);
      if (material.availableQty < rm.quantity) {
        throw createError(`Insufficient stock for raw material: ${material.name}. Available: ${material.availableQty}, Required: ${rm.quantity}`, 400);
      }
      
      // Deduct stock
      material.availableQty -= Number(rm.quantity);
      await material.save();
    }
  }

  const productionData = { 
    ...rest, 
    rawMaterials: parsedRawMaterials,
    createdBy: req.user.id 
  };
  
  if (req.file) {
    productionData.image = `/uploads/${req.file.filename}`;
  }

  const production = await Production.create(productionData);
  return successResponse(res, "Production report created successfully", 201, production);
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const production = await Production.findById(id);
  if (!production) throw createError("Production record not found", 404);

  const updateData = { ...req.body };
  if (req.file) {
    updateData.image = `/uploads/${req.file.filename}`;
  }

  const updated = await Production.findByIdAndUpdate(id, updateData, { new: true });
  return successResponse(res, "Production record updated successfully", 200, updated);
});

export const approve = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const production = await Production.findById(id).populate("productId");
  if (!production) throw createError("Production report not found", 404);
  if (production.status === 'approved') throw createError("Report already approved", 400);

  // 1. Update Inventory for the final product
  const Inventory = mongoose.model("Inventory");
  let inventory = await Inventory.findOne({ product: production.productId._id });

  if (inventory) {
    // Update existing inventory
    inventory.availableQty += production.quantity;
    inventory.history.push({
      type: "ADD_STOCK",
      stock: production.quantity,
      note: `Injected from Production Report: ${production.batchNumber}`,
      date: new Date()
    });
    await inventory.save();
  } else {
    // Create new inventory if it doesn't exist
    // Note: Usually inventory is pre-configured, but we'll handle this for safety
    inventory = await Inventory.create({
      product: production.productId._id,
      itemCode: production.productId.itemCode,
      vendor: req.user.id, // Placeholder for system vendor or self
      orderedQty: production.quantity,
      availableQty: production.quantity,
      history: [{
        type: "ADD_STOCK",
        stock: production.quantity,
        note: `Initial stock from Production Report: ${production.batchNumber}`,
        date: new Date()
      }],
      createdBy: req.user.id
    });
  }

  // 2. Update Production status
  production.status = 'approved';
  await production.save();

  return successResponse(res, "Production report approved and stock updated", 200, production);
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const production = await Production.findById(id);
  if (!production) throw createError("Production report not found", 404);
  
  // If approved, we might want to restrict deletion or handle stock reversal
  // For now, simple delete as per existing logic, with metadata update
  await Production.findByIdAndDelete(id);
  return successResponse(res, "Production report deleted successfully.", 200, {});
});
