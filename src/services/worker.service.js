import { Worker } from "../models/Worker.model.js";
import { createError } from "../utils/AppError.js";

export const getAllWorkers = async ({ page = 1, limit = 10, search = "", status, facilityId }) => {
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { workerId: { $regex: search, $options: "i" } },
      { qidNo: { $regex: search, $options: "i" } },
      { passportNo: { $regex: search, $options: "i" } },
    ];
  }
  if (status) query.status = status;
  if (facilityId) query.facilityId = facilityId;

  const skip = (Number(page) - 1) * Number(limit);
  const [workers, totalCount] = await Promise.all([
    Worker.find(query)
      .populate("facilityId", "name type")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Worker.countDocuments(query),
  ]);

  return {
    content: workers,
    totalCount,
    totalPages: Math.ceil(totalCount / Number(limit)),
    currentPage: Number(page),
  };
};

export const getWorkerById = async (id) => {
  const worker = await Worker.findById(id)
    .populate("facilityId", "name type")
    .populate("createdBy", "name");
  if (!worker) throw createError("Worker not found", 404);
  return worker;
};

export const createWorker = async (data) => {
  return await Worker.create(data);
};

export const updateWorker = async (id, data) => {
  const updated = await Worker.findByIdAndUpdate(id, data, { new: true });
  if (!updated) throw createError("Worker not found", 404);
  return updated;
};

export const removeWorker = async (id) => {
  return await Worker.findByIdAndDelete(id);
};
