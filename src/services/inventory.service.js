import { Inventory } from "../models/Inventory.model.js";
import { createError } from "../utils/AppError.js";
import mongoose from "mongoose";

export const getAllInventories = async ({
  page = 1,
  limit = 10,
  search = "",
  status,
  poNo,
  product,
  itemCode,
  minStock,
  maxStock,
}) => {
  const query = {};

  if (search) {
    query.$or = [
      { poNo: { $regex: search, $options: "i" } },
      { itemCode: { $regex: search, $options: "i" } },
    ];
  }

  if (status) query.status = status;
  if (poNo) query.poNo = poNo;
  if (product) query.product = product;
  if (itemCode) query.itemCode = itemCode;


  if (minStock !== undefined || maxStock !== undefined) {
    query.availableQty = {};

    if (minStock !== undefined) {
      query.availableQty.$gte = Number(minStock);
    }

    if (maxStock !== undefined) {
      query.availableQty.$lte = Number(maxStock);
    }
  }

  const skip = (page - 1) * limit;

  const [inventories, totalCount] = await Promise.all([
    Inventory.find(query)
      .populate("product", "name itemCode")
      .populate("vendor", "name")
      .populate("createdBy", "name")
      .select("-__v")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Inventory.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  return {
    content: inventories,
    totalCount,
    totalPages,
    currentPage: page,
    limit,
  };
};

export const createInventory = async (data) => {
  const { poNo, items, vendor, reference } = data;

  if (!poNo || !items?.length) {
    throw createError("PO Number and items are required", 400);
  }

  const createdInventories = [];

  for (const item of items) {
    const { productId, itemCode, quantity } = item;

    if (!productId || !itemCode || !quantity) {
      throw createError("Invalid item payload", 400);
    }

    // 🔒 Prevent duplicate inventory per PO + product
    const exists = await Inventory.findOne({
      poNo,
      product: productId,
    });

    if (exists) {
      throw createError(
        `Inventory already exists for PO ${poNo} and item ${itemCode}`,
        400
      );
    }

    const inventory = await Inventory.create({
      poNo,
      product: productId,
      vendor,
      itemCode,
      reference,
      orderedQty: quantity,
      availableQty: quantity,
      createdBy: data.createdBy,
      history: [
        {
          type: "ADD_STOCK",
          stock: quantity,
          note: `Inventory created (manual PO: ${poNo})`,
        },
      ],
    });

    const obj = inventory.toObject();
    delete obj.__v;
    createdInventories.push(obj);
  }

  return createdInventories;
};

export const updateInventory = async (id, data) => {
  const inventory = await Inventory.findById(id);
  if (!inventory) throw createError("Inventory not found", 404);

  const { orderedQty, note = "Inventory updated" } = data;

  // 🔒 Ensure PO + Product uniqueness if changed
  if (data.poNo || data.product) {
    const poNo = data.poNo || inventory.poNo;
    const product = data.product || inventory.product;

    const exists = await Inventory.findOne({
      poNo,
      product,
      _id: { $ne: id },
    });

    if (exists) {
      throw createError(
        "Inventory with this PO Number and Product already exists",
        400
      );
    }
  }

  // 🔥 Handle quantity delta
  if (typeof orderedQty === "number") {
    const diff = orderedQty - inventory.orderedQty;

    inventory.orderedQty = orderedQty;
    inventory.availableQty += diff;

    if (inventory.availableQty < 0) {
      throw createError("Available quantity cannot be negative", 400);
    }

    inventory.history.push({
      type: "INVENTORY_ADJUSTMENT",
      stock: diff, // Use diff directly to show increase/decrease
      note,
    });
  }

  // Safe updates
  ["poNo", "product", "itemCode", "reference"].forEach((field) => {
    if (data[field] !== undefined) inventory[field] = data[field];
  });

  await inventory.save();

  const obj = inventory.toObject();
  delete obj.__v;
  return obj;
};

export const getInventoryById = async (id) => {
  const pipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(id) },
    },

    // Product
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: {
        path: "$product",
        preserveNullAndEmptyArrays: true,
      },
    },

    // Vendor
    {
      $lookup: {
        from: "vendors",
        localField: "vendor",
        foreignField: "_id",
        as: "vendor",
      },
    },
    {
      $unwind: {
        path: "$vendor",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 🔥 Customers for history
    {
      $lookup: {
        from: "customers",
        localField: "history.customerId",
        foreignField: "_id",
        as: "historyCustomers",
      },
    },

    // 🔥 Merge customer into each history item
    {
      $addFields: {
        history: {
          $map: {
            input: "$history",
            as: "h",
            in: {
              $mergeObjects: [
                "$$h",
                {
                  customer: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$historyCustomers",
                          as: "c",
                          cond: { $eq: ["$$c._id", "$$h.customerId"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },

    {
      $project: {
        historyCustomers: 0,
        __v: 0,
      },
    },
  ];

  const result = await Inventory.aggregate(pipeline);
  return result[0] || null;
};

export const deleteInventory = async (id) => {
  const deleted = await Inventory.findByIdAndDelete(id);
  return deleted;
};

export const getInventoryDropdown = async () => {
  return Inventory.find(
    {},
    {
      poNo: 1,
      itemCode: 1,
      product: 1,
    }
  ).populate("product", "name sku");
};

export const getAvailableProducts = async () => {
  const productsInInventory = await Inventory.aggregate([
    {
      $match: {
        status: { $in: ["IN_STOCK", "LOW_STOCK"] },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $project: {
        _id: 1,
        productId: "$productInfo._id",
        name: "$productInfo.name",
        itemCode: "$productInfo.itemCode",
        unit: "$productInfo.unit",
        availableQty: "$availableQty",
        orderedQty: "$orderedQty",
        status: 1,
      },
    },
  ]);

  return productsInInventory;
};
