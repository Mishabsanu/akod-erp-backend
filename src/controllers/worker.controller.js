import * as workerService from "../services/worker.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";
import { createError } from "../utils/AppError.js";

export const listWorkers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", status, facilityId } = req.query;
  const result = await workerService.getAllWorkers({ page, limit, search, status, facilityId });
  return successResponse(res, "Workers fetched successfully", 200, result);
});

export const getWorker = asyncHandler(async (req, res) => {
  const worker = await workerService.getWorkerById(req.params.id);
  return successResponse(res, "Worker fetched successfully", 200, worker);
});

export const createWorker = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.user.id };
  // Handle document files if present in multipart request
  if (req.files && req.files.length > 0) {
    // This assumes a specific structure for documents in the request
    // For simplicity, we'll map them if the structure matches or handle manually
    // In a real scenario, we might need more complex logic to match files to doc types
  }
  const worker = await workerService.createWorker(data);
  return successResponse(res, "Worker created successfully", 201, worker);
});

export const updateWorker = asyncHandler(async (req, res) => {
  const updated = await workerService.updateWorker(req.params.id, req.body);
  return successResponse(res, "Worker updated successfully", 200, updated);
});

export const deleteWorker = asyncHandler(async (req, res) => {
  await workerService.removeWorker(req.params.id);
  return successResponse(res, "Worker deleted successfully", 200, {});
});
