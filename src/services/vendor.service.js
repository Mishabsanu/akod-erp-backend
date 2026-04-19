import { Vendor } from "../models/Vendor.model.js";
import { createError } from "../utils/AppError.js";

export const getAllVendors = async ({
  page = 1,
  limit = 10,
  search = "",
  status,
}) => {
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } },
    ];
  }

  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [vendors, totalCount] = await Promise.all([
    Vendor.find(query)
      .select("-__v")
      .populate("createdBy", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Vendor.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    content: vendors,
    totalCount,
    totalPages,
    currentPage: page,
    limit,
  };
};

export const createVendor = async (data) => {
  const { name, email } = data;

  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await Vendor.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw createError("Email already exists", 400);
    }
  }

  const vendor = await Vendor.create({
    ...data,
    name: name.trim(),
    email: email ? email.trim().toLowerCase() : null,
  });

  const v = vendor.toObject();
  delete v.__v;
  return v;
};

export const getVendorById = async (id) => {
  return await Vendor.findById(id).select("-__v").populate("createdBy", "name");
};

export const updateVendor = async (id, data) => {
  const vendor = await Vendor.findById(id);
  if (!vendor) throw createError("Vendor not found", 404);

  const updates = Object.keys(data);

  for (const key of updates) {
    if (key !== "_id") {
      vendor[key] = data[key];
    }
  }

  if (data.email) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingEmail = await Vendor.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });
    if (existingEmail) {
      throw createError("Email already exists", 400);
    }
    vendor.email = normalizedEmail;
  }

  await vendor.save();

  const v = vendor.toObject();
  delete v.__v;
  return v;
};

export const deleteVendor = async (id) => {
  const deleted = await Vendor.findByIdAndDelete(id);
  return deleted;
};

export const getDropdown = async () => {
  return Vendor.find(
    {},
    {
      name: 1,
      mobile: 1,
      company: 1,
    }
  );
};
