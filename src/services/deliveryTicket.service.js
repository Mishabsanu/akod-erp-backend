import { DeliveryTicket } from "../models/DeliveryTicket.model.js";
import { Inventory } from "../models/Inventory.model.js";
import { createError } from "../utils/AppError.js";
export const addDeliveryTicket = async (ticketData) => {
  const { items, ticketNo, deliveredBy, customerId, receivedBy, ...rest } =
    ticketData;
  console.log(ticketData, "ticketData");

  /* ---------------- INVENTORY VALIDATION ---------------- */
  for (const item of items) {
    const inventoryItem = await Inventory.findOne({
      itemCode: item.itemCode,
    });

    if (!inventoryItem) {
      throw createError(
        `Item with code ${item.itemCode} not found in inventory`,
        400
      );
    }

    if (inventoryItem.stock < item.quantity) {
      throw createError(`Insufficient stock for item ${item.itemCode}`, 400);
    }
  }

  /* ---------------- BUILD PAYLOAD ---------------- */
  const finalPayload = {
    ...rest,
    ticketNo,
    items: items.map((item) => ({
      ...item,
      description: item.description || "",
    })),
    customerId: customerId,
    deliveredBy: {
      deliveredByName: deliveredBy?.deliveredByName || "",
      deliveredByMobile: deliveredBy?.deliveredByMobile || "",
      deliveredDate: deliveredBy?.deliveredDate || null,
    },

    receivedBy: {
      receivedByName: receivedBy?.receivedByName || "",
      receivedByMobile: receivedBy?.receivedByMobile || "",
      qatarId: receivedBy?.qatarId || "",
      receivedDate: receivedBy?.receivedDate || null,
    },
  };

  /* ---------------- SAVE DELIVERY TICKET ---------------- */
  const savedTicket = await DeliveryTicket.create(finalPayload);

  /* ---------------- UPDATE INVENTORY ---------------- */
  for (const item of items) {
    const inventoryItem = await Inventory.findOne({ itemCode: item.itemCode });
    if (!inventoryItem) {
      throw createError(
        `Item with code ${item.itemCode} not found in inventory`,
        400
      );
    }

    inventoryItem.availableQty -= item.quantity;
    inventoryItem.history.push({
      type: "DELIVERY",
      stock: item.quantity,
      customerId: customerId,
      note: `Delivered via ${ticketNo}`,
      date: new Date(),
    });
    await inventoryItem.save();
  }

  return savedTicket;
};

export const getDeliveryTickets = async (queryParams) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    startDate,
    endDate,
    client_name,
    ticket_no,
  } = queryParams;

  const query = {};

  if (search) {
    query.$or = [
      { ticketNo: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { poNo: { $regex: search, $options: "i" } },
      { invoiceNo: { $regex: search, $options: "i" } },
      { noteCategory: { $regex: search, $options: "i" } },
    ];
  }

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  if (client_name) {
    query.client_name = { $regex: client_name, $options: "i" };
  }
  if (ticket_no) {
    query.ticket_no = { $regex: ticket_no, $options: "i" };
  }

  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);
  const skip = (pageNumber - 1) * pageSize;

  const [tickets, totalCount] = await Promise.all([
    DeliveryTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    DeliveryTicket.countDocuments(query),
  ]);

  return {
    content: tickets,
    totalCount,
    pageNumber,
    pageSize,
  };
};
export const getDeliveryTicketById = async (id) => {
  return await DeliveryTicket.findById(id).select("-__v").lean();
};
export const getLatestDeliveryTicketNo = async () => {
  const latest = await DeliveryTicket.findOne()
    .sort({ ticketNo: -1 })
    .lean();
  let nextNo = "DT-00001";
  if (latest?.ticketNo) {
    const lastNumber = parseInt(latest.ticketNo.replace("DT-", ""), 10);

    if (!isNaN(lastNumber)) {
      nextNo = `DT-${String(lastNumber + 1).padStart(5, "0")}`;
    }
  }
  return nextNo;
};

export const getPoNoDropdown = async () => {
  const distinctPoNos = await DeliveryTicket.distinct("poNo");
  distinctPoNos.sort((a, b) => a.localeCompare(b));
  const result = distinctPoNos.map((po) => ({ poNo: po }));
  return result;
};

export const updateDeliveryTicket = async (id, payload) => {
  const { items, deliveredBy, receivedBy, customerId, ...rest } = payload;

  /* ---------------- FETCH EXISTING TICKET ---------------- */
  const existingTicket = await DeliveryTicket.findById(id);
  if (!existingTicket) {
    throw createError("Delivery Ticket not found", 404);
  }

  /* ---------------- RESTORE OLD INVENTORY ---------------- */
  for (const oldItem of existingTicket.items) {
    const inventoryItem = await Inventory.findOne({
      itemCode: oldItem.itemCode,
    });
    if (!inventoryItem) continue; // Should not happen if data integrity is maintained

    inventoryItem.availableQty += oldItem.quantity; // restore
    inventoryItem.history.push({
      type: "DELIVERY_ROLLBACK",
      stock: oldItem.quantity,
      customerId: customerId,
      note: `Reverted delivery from ${existingTicket.ticketNo}`,
      date: new Date(),
    });
    await inventoryItem.save();
  }
  console.log(items, 'items');

  /* ---------------- VALIDATE NEW INVENTORY ---------------- */
  for (const item of items) {
    const inventoryItem = await Inventory.findOne({
      itemCode: item.itemCode
    });

    if (!inventoryItem) {
      throw createError(
        `Item with code ${item.itemCode} not found in inventory`,
        400
      );
    }

    if (inventoryItem.availableQty < item.quantity) {
      throw createError(`Insufficient stock for item ${item.itemCode}`, 400);
    }
  }

  /* ---------------- APPLY NEW INVENTORY ---------------- */
  for (const item of items) {
    const inventoryItem = await Inventory.findOne({ itemCode: item.itemCode });
    if (!inventoryItem) {
      throw createError(
        `Item with code ${item.itemCode} not found in inventory`,
        400
      );
    }

    // Validation is done before this block
    inventoryItem.availableQty -= item.quantity;
    inventoryItem.history.push({
      type: "DELIVERY",
      stock: item.quantity,
      customerId: customerId,
      note: `Updated delivery via ${existingTicket.ticketNo}`,
      date: new Date(),
    });
    await inventoryItem.save();
  }

  /* ---------------- UPDATE DELIVERY TICKET ---------------- */
  existingTicket.set({
    ...rest,
    items: items.map((item) => ({
      ...item,
      description: item.description || "",
    })),

    deliveredBy: {
      deliveredByName: deliveredBy?.deliveredByName || "",
      deliveredByMobile: deliveredBy?.deliveredByMobile || "",
      deliveredDate: deliveredBy?.deliveredDate || null,
    },

    receivedBy: {
      receivedByName: receivedBy?.receivedByName || "",
      receivedByMobile: receivedBy?.receivedByMobile || "",
      qatarId: receivedBy?.qatarId || "",
      receivedDate: receivedBy?.receivedDate || null,
    },
  });

  await existingTicket.save();

  return existingTicket;
};
export const deleteDeliveryTickets = async (id) => {
  const deletedTicket = await DeliveryTicket.findById(id);
  if (!deletedTicket) {
    throw createError("Delivery Ticket not found", 404);
  }

  // Restore inventory for each item in the deleted ticket
  for (const item of deletedTicket.items) {
    const inventoryItem = await Inventory.findOne({ itemCode: item.itemCode });
    if (!inventoryItem) continue; // Should not happen if data integrity is maintained

    inventoryItem.availableQty += item.quantity; // Restore the quantity
    inventoryItem.history.push({
      type: "DELIVERY_DELETE_ROLLBACK",
      stock: item.quantity,
      customerId: deletedTicket.customerId,
      note: `Delivery ticket ${deletedTicket.ticketNo} deleted, stock restored`,
      date: new Date(),
    });
    await inventoryItem.save();
  }

  await DeliveryTicket.findByIdAndDelete(id);
  return deletedTicket;
};
