import * as inventoryService from "../services/inventory.service.js";
import { createError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";

export const getAll = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status,
    minStock,
    maxStock,
  } = req.query;

  const result = await inventoryService.getAllInventories({
    page: Number(page),
    limit: Number(limit),
    search,
    status,
    minStock: minStock !== undefined ? Number(minStock) : undefined,
    maxStock: maxStock !== undefined ? Number(maxStock) : undefined,
  });

  return successResponse(
    res,
    "Inventory list fetched successfully",
    200,
    result
  );
});

export const create = asyncHandler(async (req, res) => {
  const payload = req.body;
  const newInventory = await inventoryService.createInventory(payload);
  return successResponse(res, "Inventory created successfully", 201, {
    inventory: newInventory,
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const inventory = await inventoryService.getInventoryById(id);
  if (!inventory) throw createError("Inventory not found", 404);
  return successResponse(res, "Inventory fetched successfully", 200, inventory);
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const updatedInventory = await inventoryService.updateInventory(id, payload);
  if (!updatedInventory) throw createError("Inventory not found", 404);
  return successResponse(res, "Inventory updated successfully", 200, {
    content: updatedInventory,
  });
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await inventoryService.deleteInventory(id);
  if (!deleted) throw createError("Inventory not found", 404);
  return successResponse(res, "Inventory deleted successfully", 200, {});
});

export const dropdown = asyncHandler(async (req, res) => {
  const list = await inventoryService.getInventoryDropdown();
  return successResponse(res, "Inventory dropdown data fetched", 200, list);
});

export const GetAvailableProducts = asyncHandler(async (req, res) => {
  const productsInInventory = await inventoryService.getAvailableProducts();
  return successResponse(
    res,
    "Available products fetched successfully",
    200,
    productsInInventory
  );
});
