import * as productService from "../services/product.service.js";
import { createError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", status } = req.query;
  const result = await productService.getAll({
    page,
    limit,
    search,
    status,
  });
  return successResponse(res, "Products fetched successfully", 200, result);
});

export const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  if (!product) {
    throw createError("Product not found", 404);
  }
  return successResponse(res, "Product fetched successfully", 200, {
    content: product,
  });
});

export const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body);
  return successResponse(res, "Product created successfully", 201, product);
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productService.getById(id);
  if (!product) throw createError("Product not found", 404);
  const updated = await productService.update(id, req.body);
  return successResponse(res, "Product updated successfully", 200, updated);
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productService.getById(id);
  if (!product) throw createError("Product not found", 404);
  await productService.remove(id);
  return successResponse(res, "Product deleted successfully.", 200, {});
});

export const dropdown = asyncHandler(async (req, res) => {
  const list = await productService.getDropdown();
  return successResponse(res, "Dropdown data fetched", 200, list);
});
