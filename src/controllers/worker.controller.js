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

  // Parse JSON strings from multipart/form-data
  if (typeof data.skills === 'string') {
    try {
      data.skills = JSON.parse(data.skills);
    } catch (e) {
      data.skills = [];
    }
  }
  if (typeof data.utilities === 'string') {
    try {
      data.utilities = JSON.parse(data.utilities);
    } catch (e) {
      data.utilities = [];
    }
  }
  
  
  // Handle named document fields from multer.fields
  if (req.files) {
    const fileFields = [
      'photo', 'cv', 'qidDoc', 'passportDoc', 
      'insuranceDoc', 'healthCardDoc', 'certificateDoc'
    ];
    
    fileFields.forEach(field => {
      if (req.files[field] && req.files[field][0]) {
        data[field] = req.files[field][0].path;
      }
    });
  }

  const worker = await workerService.createWorker(data);
  return successResponse(res, "Worker created successfully", 201, worker);
});

export const updateWorker = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  // Parse JSON strings from multipart/form-data
  if (typeof data.skills === 'string') {
    try {
      data.skills = JSON.parse(data.skills);
    } catch (e) {
       // if it fails, keep it as is or handle accordingly
    }
  }
  if (typeof data.utilities === 'string') {
    try {
      data.utilities = JSON.parse(data.utilities);
    } catch (e) {
       // if it fails, keep it as is or handle accordingly
    }
  }

  const updated = await workerService.updateWorker(req.params.id, data);
  return successResponse(res, "Worker updated successfully", 200, updated);
});

export const deleteWorker = asyncHandler(async (req, res) => {
  await workerService.removeWorker(req.params.id);
  return successResponse(res, "Worker deleted successfully", 200, {});
});
