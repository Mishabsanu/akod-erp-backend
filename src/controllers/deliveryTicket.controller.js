import * as deliveryTicketService from "../services/deliveryTicket.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/response.js";

export const AddDeliveryTicket = asyncHandler(async (req, res) => {
  const savedTicket = await deliveryTicketService.addDeliveryTicket(req.body);
  return successResponse(
    res,
    "Delivery ticket created successfully and inventory updated",
    201,
    savedTicket
  );
});
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const updatedDeliveryTicket =
    await deliveryTicketService.updateDeliveryTicket(id, payload);
  if (!updatedDeliveryTicket)
    throw createError("Delivery Ticket not found", 404);
  return successResponse(res, "Delivery Ticket updated successfully", 200, {
    content: updatedDeliveryTicket,
  });
});

export const GetDeliveryTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", startDate, endDate } = req.query;

  const result = await deliveryTicketService.getDeliveryTickets({
    page: Number(page),
    limit: Number(limit),
    search,
    startDate,
    endDate,
  });

  return successResponse(
    res,
    "Delivery tickets fetched successfully",
    200,
    result
  );
});

export const GetLatestDeliveryTicketNo = asyncHandler(async (req, res) => {
  const nextTicketNo = await deliveryTicketService.getLatestDeliveryTicketNo();
  return successResponse(
    res,
    "Next delivery ticket number fetched successfully",
    200,
    nextTicketNo
  );
});
export const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const inventory = await deliveryTicketService.getDeliveryTicketById(id);
  if (!inventory) throw createError("Delivery ticket not found", 404);
  return successResponse(
    res,
    "Delivery ticket fetched successfully",
    200,
    inventory
  );
});

export const GetPoNoDropdown = asyncHandler(async (req, res) => {
  const result = await deliveryTicketService.getPoNoDropdown();
  return successResponse(res, "Dropdown Po fetched successfully", 200, result);
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await deliveryTicketService.deleteDeliveryTickets(id);
  if (!deleted) throw createError("Delivery tickets not found", 404);
  return successResponse(res, "Delivery tickets deleted successfully", 200, {});
});
