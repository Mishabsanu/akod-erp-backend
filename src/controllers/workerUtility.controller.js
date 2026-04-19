import { WorkerUtility } from "../models/WorkerUtility.model.js";
import { UtilityItem } from "../models/UtilityItem.model.js";
import { createError } from "../utils/AppError.js";
import mongoose from "mongoose";

export const issueUtility = async (req, res, next) => {
  try {
    const utility = await WorkerUtility.create({
      ...req.body,
      createdBy: req.user?._id,
    });
    res.status(201).json({ success: true, data: utility });
  } catch (error) {
    next(error);
  }
};

export const issueBulkUtilities = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, workerId, force } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw createError("No items provided for issuance", 400);
    }

    // 1. Process Stock Reductions and Validations
    for (const item of items) {
      if (item.utilityItemId) {
        // If it's a linked master item, check and reduce stock
        const masterItem = await UtilityItem.findById(item.utilityItemId).session(session);
        if (!masterItem) {
          throw createError(`Utility Item ${item.itemName} not found in master stock.`, 404);
        }
        if (masterItem.quantity < item.quantity) {
          throw createError(`Insufficient stock for ${masterItem.name}. Available: ${masterItem.quantity}, Requested: ${item.quantity}`, 400);
        }

        // Atomically decrement stock
        masterItem.quantity -= item.quantity;
        await masterItem.save({ session });
      }
    }

    // 2. Conflict Check (if not forced)
    if (!force) {
      const activeItems = await WorkerUtility.find({
        worker: workerId,
        status: "issued",
        itemName: { $in: items.map(i => i.itemName) }
      }).session(session);

      if (activeItems.length > 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          success: false,
          message: "Conflict detected: Some items are already active in the worker's ledger.",
          conflicts: activeItems.map(ai => ai.itemName)
        });
      }
    }

    // 3. Create WorkerUtility records
    const createdItems = await WorkerUtility.insertMany(
      items.map(item => ({
        ...item,
        worker: workerId,
        createdBy: req.user?._id,
        recoveryStatus: item.isRecoverable ? "pending" : "none"
      })),
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, data: createdItems });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getWorkerUtilities = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const utilities = await WorkerUtility.find({ worker: workerId })
      .sort({ issueDate: -1 })
      .populate("createdBy", "name");
    res.status(200).json({ success: true, data: utilities });
  } catch (error) {
    next(error);
  }
};

export const deleteUtility = async (req, res, next) => {
  try {
    const utility = await WorkerUtility.findByIdAndDelete(req.params.id);
    if (!utility) throw createError("Utility record not found", 404);
    res.status(200).json({ success: true, message: "Utility record deleted" });
  } catch (error) {
    next(error);
  }
};

export const updateUtilityStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const utility = await WorkerUtility.findByIdAndUpdate(
      req.params.id,
      { status, remarks },
      { new: true }
    );
    if (!utility) throw createError("Utility record not found", 404);
    res.status(200).json({ success: true, data: utility });
  } catch (error) {
    next(error);
  }
};

export const getGlobalUtilityStats = async (req, res, next) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const stats = await WorkerUtility.aggregate([
      { $match: { issueDate: { $gte: oneYearAgo } } },
      {
        $group: {
          _id: "$itemName",
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
