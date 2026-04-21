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
  onlyLowStock,
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
      .populate("product", "name itemCode reorderLevel")
      .populate("vendor", "name")
      .populate("createdBy", "name")
      .select("-__v")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Inventory.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Map to add 'isLowStock' flag dynamically and calculate totalSold
  const contentWithFlags = inventories.map(inv => {
    const item = inv.toObject();
    const reorderLevel = inv.product?.reorderLevel || 0;
    const isLow = inv.availableQty <= reorderLevel && inv.availableQty > 0;
    return {
      ...item,
      totalSold: (inv.orderedQty || 0) - (inv.availableQty || 0),
      isLowStock: isLow,
      status: inv.availableQty === 0 ? "OUT_OF_STOCK" : (isLow ? "LOW_STOCK" : "IN_STOCK")
    };
  });

  // Filter if onlyLowStock is requested
  const finalContent = onlyLowStock === "true" 
    ? contentWithFlags.filter(item => item.isLowStock || item.status === "OUT_OF_STOCK")
    : contentWithFlags;

  return {
    content: finalContent,
    totalCount: onlyLowStock === "true" ? finalContent.length : totalCount,
    totalPages: onlyLowStock === "true" ? 1 : totalPages,
    currentPage: page,
    limit,
  };
};

export const createInventory = async (data) => {
  const { poNo, items, vendor, reference, remarks, deliveryNote, productImage } = data;

  if (!items?.length) {
    throw createError("Items are required", 400);
  }

  const createdInventories = [];

  for (const item of items) {
    const { productId, itemCode, quantity, reorderLevel } = item;

    if (!productId || !itemCode || !quantity) {
      throw createError("Invalid item payload", 400);
    }

    // 🔥 Update product reorder level if provided
    if (reorderLevel !== undefined) {
      await mongoose.model("Product").findByIdAndUpdate(productId, { reorderLevel });
    }

    // 🔒 Upsert logic: Find existing inventory for the same Product
    // This allows consolidation of stock for the same product across different entries
    const existing = await Inventory.findOne({
      product: productId,
    });

    if (existing) {
      existing.orderedQty += Number(quantity);
      existing.availableQty += Number(quantity);
      existing.vendor = vendor || existing.vendor; // Update to latest vendor
      if (reference) existing.reference = reference;
      if (remarks) existing.remarks = remarks;
      if (deliveryNote) existing.deliveryNote = deliveryNote;
      if (productImage) existing.productImage = productImage;

      existing.history.push({
        type: "ADD_STOCK",
        stock: quantity,
        vendorId: vendor,
        note: `Stock added to existing record (PO: ${poNo || 'N/A'})`,
      });

      await existing.save();
      createdInventories.push(existing.toObject());
    } else {
      const inventory = await Inventory.create({
        poNo,
        product: productId,
        vendor,
        itemCode,
        reference,
        remarks,
        deliveryNote,
        productImage,
        orderedQty: quantity,
        availableQty: quantity,
        createdBy: data.createdBy,
        history: [
          {
            type: "ADD_STOCK",
            stock: quantity,
            vendorId: vendor,
            note: `Inventory created (PO: ${poNo || 'N/A'})`,
          },
        ],
      });
      createdInventories.push(inventory.toObject());
    }
  }

  return createdInventories;
};

export const updateInventory = async (id, data) => {
  const inventory = await Inventory.findById(id);
  if (!inventory) throw createError("Inventory not found", 404);

  const { orderedQty, note = "Inventory updated" } = data;

  // 🔒 Ensure Product uniqueness if changed
  if (data.product) {
    const product = data.product || inventory.product;

    const exists = await Inventory.findOne({
      product,
      _id: { $ne: id },
    });

    if (exists) {
      throw createError(
        "Inventory record for this Product already exists. Please update the existing record instead.",
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
