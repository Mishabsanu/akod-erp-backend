import { Product } from "../models/Product.model.js";
import { createError } from "../utils/AppError.js";

export const getAll = async ({ page = 1, limit = 10, search = "", status }) => {
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [products, totalCount] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    content: products,
    totalCount,
    totalPages,
    currentPage: Number(page),
  };
};

export const getById = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw createError("Product not found", 404);
  return product;
};

export const create = async (data) => {
  const product = await Product.create(data);
  return product;
};

export const update = async (id, data) => {
  const updated = await Product.findByIdAndUpdate(id, data, { new: true });
  if (!updated) throw createError("Product not found", 404);
  return updated;
};

export const remove = async (id) => {
  const deleted = await Product.findByIdAndDelete(id);
  return deleted;
};

export const getDropdown = async () => {
  return Product.find(
    {},
    {
      name: 1,
      itemCode: 1,
      unit: 1,
    }
  );
};
