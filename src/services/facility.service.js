import { Facility } from "../models/Facility.model.js";
import { FacilityChecklist } from "../models/FacilityChecklist.model.js";
import { createError } from "../utils/AppError.js";

// --- FACILITY SERVICES ---
export const getAllFacilities = async ({ page = 1, limit = 10, search = "", type, status }) => {
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }
  if (type) query.type = type;
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [facilities, totalCount] = await Promise.all([
    Facility.find(query)
      .populate("managerId", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Facility.countDocuments(query),
  ]);

  return {
    content: facilities,
    totalCount,
    totalPages: Math.ceil(totalCount / Number(limit)),
    currentPage: Number(page),
  };
};

export const getFacilityById = async (id) => {
  const facility = await Facility.findById(id)
    .populate("managerId", "name")
    .populate("createdBy", "name");
  if (!facility) throw createError("Facility not found", 404);
  return facility;
};

export const createFacility = async (data) => {
  return await Facility.create(data);
};

export const updateFacility = async (id, data) => {
  const updated = await Facility.findByIdAndUpdate(id, data, { new: true });
  if (!updated) throw createError("Facility not found", 404);
  return updated;
};

export const removeFacility = async (id) => {
  return await Facility.findByIdAndDelete(id);
};

export const getFacilityDropdown = async () => {
  return Facility.find({ status: "active" }, { name: 1, type: 1 });
};

// --- CHECKLIST SERVICES ---
export const getAllChecklists = async ({ page = 1, limit = 10, facilityId, date }) => {
  const query = {};
  if (facilityId) query.facilityId = facilityId;
  if (date) query.date = date;

  const skip = (Number(page) - 1) * Number(limit);
  const [checklists, totalCount] = await Promise.all([
    FacilityChecklist.find(query)
      .populate("facilityId", "name type")
      .populate("inspectorId", "name")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    FacilityChecklist.countDocuments(query),
  ]);

  return {
    content: checklists,
    totalCount,
    totalPages: Math.ceil(totalCount / Number(limit)),
    currentPage: Number(page),
  };
};

export const createChecklist = async (data) => {
  return await FacilityChecklist.create(data);
};
