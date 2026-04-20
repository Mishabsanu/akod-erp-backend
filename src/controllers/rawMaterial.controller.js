import { RawMaterial } from "../models/RawMaterial.model.js";
import { createError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";

export const list = asyncHandler(async (req, res) => {
    const { initialized } = req.query;
    const filter = {};
    if (initialized === 'true') {
        filter.isInitialized = true;
    }
    const materials = await RawMaterial.find(filter).sort({ name: 1 });
    return successResponse(res, "Raw materials fetched successfully", 200, materials);
});

export const getDropdown = asyncHandler(async (req, res) => {
    const materials = await RawMaterial.find({ status: 'active' }).select('name _id itemCode availableQty unit').sort({ name: 1 });
    return successResponse(res, "Raw material dropdown fetched", 200, materials);
});

export const create = asyncHandler(async (req, res) => {
    const material = await RawMaterial.create({
        ...req.body,
        createdBy: req.user.id
    });
    return successResponse(res, "Raw material registered", 201, material);
});

export const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const material = await RawMaterial.findByIdAndUpdate(id, req.body, { new: true });
    if (!material) throw createError("Material not found", 404);
    return successResponse(res, "Raw material updated", 200, material);
});

export const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await RawMaterial.findByIdAndDelete(id);
    return successResponse(res, "Raw material deleted", 200, {});
});

export const getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const material = await RawMaterial.findById(id).populate('history.user', 'name');
    if (!material) throw createError("Material not found", 404);
    return successResponse(res, "Raw material details fetched", 200, material);
});

export const adjustStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, note, type } = req.body; // positive to add, negative to subtract
    
    if (quantity === undefined || isNaN(quantity)) {
        throw createError("Valid quantity is required", 400);
    }

    const material = await RawMaterial.findById(id);
    if (!material) throw createError("Material not found", 404);

    const oldQty = material.availableQty || 0;
    material.availableQty = oldQty + Number(quantity);
    material.isInitialized = true;

    // determine type if not provided
    const historyType = type || (quantity > 0 ? "ADD_STOCK" : "STOCK_ADJUSTMENT");

    material.history.push({
        date: new Date(),
        type: historyType,
        quantity: Number(quantity),
        note: note || `Manual stock adjustment of ${quantity} units`,
        user: req.user.id
    });

    await material.save();

    return successResponse(res, "Stock adjusted successfully", 200, material);
});
