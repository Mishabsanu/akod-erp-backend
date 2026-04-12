import { Customer } from "../models/Customer.model.js";
import { createError } from "../utils/AppError.js";

export const getAllCustomers = async ({
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

  const [customers, totalCount] = await Promise.all([
    Customer.find(query)
      .select("-__v")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Customer.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    content: customers,
    totalCount,
    totalPages,
    currentPage: page,
    limit,
  };
};

export const createCustomer = async (data) => {
  const { name, email } = data;

  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await Customer.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw createError("Email already exists", 400);
    }
  }
  const customer = await Customer.create({
    ...data,
    name: name.trim(),
    email: email ? email.trim().toLowerCase() : null,
  });

  const c = customer.toObject();
  delete c.__v;
  return c;
};

export const getCustomerById = async (id) => {
  return await Customer.findById(id).select("-__v");
};

export const updateCustomer = async (id, data) => {
  const customer = await Customer.findById(id);
  if (!customer) throw createError("Customer not found", 404);

  const updates = Object.keys(data);

  for (const key of updates) {
    if (key !== "_id") {
      customer[key] = data[key];
    }
  }

  if (data.email) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingEmail = await Customer.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });
    if (existingEmail) {
      throw createError("Email already exists", 400);
    }
    customer.email = normalizedEmail;
  }

  await customer.save();

  const c = customer.toObject();
  delete c.__v;
  return c;
};

export const deleteCustomer = async (id) => {
  const deleted = await Customer.findByIdAndDelete(id);
  return deleted;
};
