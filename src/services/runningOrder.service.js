import { Order } from "../models/RunningOrder.model.js";

export const getAllOrders = async ({
  page = 1,
  limit = 10,
  search = "",
  status,
  currency,
}) => {
  const query = {};

  if (search) {
    query.$or = [
      { company_name: { $regex: search, $options: "i" } },
      { client_name: { $regex: search, $options: "i" } },
      { invoice_number: { $regex: search, $options: "i" } },
    ];
  }

  if (status) {
    query.status = status;
  }

  if (currency) {
    query.currency = currency;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, totalCount] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Order.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    orders,
    totalCount,
    totalPages,
    currentPage: Number(page),
  };
};

export const getOrderById = async (id) => {
  return Order.findById(id);
};

export const createOrder = async (orderData) => {
  return Order.create(orderData);
};

export const updateOrderById = async (id, orderData) => {
  return Order.findByIdAndUpdate(id, orderData, {
    new: true,
    runValidators: true,
  });
};

export const deleteOrderById = async (id) => {
  return Order.findByIdAndDelete(id);
};
