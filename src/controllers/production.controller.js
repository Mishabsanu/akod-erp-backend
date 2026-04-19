import { Production } from "../models/Production.model.js";
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

  const [productions, totalCount] = await Promise.all([
    Production.find(query)
      .populate("productId", "name itemCode unit")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Production.countDocuments(query),
  ]);

  return successResponse(res, "Production records fetched successfully", 200, {
    content: productions,
    totalCount,
    totalPages: Math.ceil(totalCount / Number(limit)),
    currentPage: Number(page),
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const production = await Production.findById(req.params.id)
    .populate("productId", "name itemCode unit")
    .populate("createdBy", "name");
    
  if (!production) throw createError("Production record not found", 404);
  
  return successResponse(res, "Production record fetched successfully", 200, {
    content: production,
  });
});

export const create = asyncHandler(async (req, res) => {
  const productionData = { 
    ...req.body, 
    createdBy: req.user.id 
  };
  
  if (req.file) {
    productionData.image = `/uploads/${req.file.filename}`;
  }

  const production = await Production.create(productionData);
  return successResponse(res, "Production record created successfully", 201, production);
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

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const production = await Production.findById(id);
  if (!production) throw createError("Production record not found", 404);
  
  await Production.findByIdAndDelete(id);
  return successResponse(res, "Production record deleted successfully.", 200, {});
});
