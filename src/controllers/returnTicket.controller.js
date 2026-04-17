import * as returnTicketService from "../services/returnTicket.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const AddReturnTicket = asyncHandler(async (req, res) => {
  const payload = { ...req.body, createdBy: req.user.id };
  const savedTicket = await returnTicketService.addReturnTicket(payload);
  return successResponse(
    res,
    "Return ticket created successfully and inventory updated",
    201,
    savedTicket
  );
});

export const GetReturnTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", startDate, endDate } = req.query;

  const result = await returnTicketService.getReturnTickets({
    page: Number(page),
    limit: Number(limit),
    search,
    startDate,
    endDate,
  });

  return successResponse(
    res,
    "Return tickets fetched successfully",
    200,
    result
  );
});

export const GetLatestReturnTicketNo = asyncHandler(async (req, res) => {
  const nextTicketNo = await returnTicketService.getLatestReturnTicketNo();
  return successResponse(
    res,
    "Next return ticket number fetched successfully",
    200,
    nextTicketNo
  );
});

export const GetDeliveredProducts = asyncHandler(async (req, res) => {
  const deliveredProducts = await returnTicketService.getDeliveredProducts();
  return successResponse(
    res,
    "Delivered products fetched successfully",
    200,
    deliveredProducts
  );
});

export const GetDeliveryByPo = asyncHandler(async (req, res) => {
  const { poNo } = req.query;

  if (!poNo) {
    throw createError("PO number is required", 400);
  }

  const data = await returnTicketService.getDeliveryByPo(poNo);

  return successResponse(
    res,
    "Delivery tickets fetched successfully",
    200,
    data
  );
});

export const GetPoReport = asyncHandler(async (req, res) => {
  const report = await returnTicketService.getPoReport(req.query.po_no);
  return successResponse(res, "PO report fetched successfully", 200, report);
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await returnTicketService.deleteReturnTickets(id);
  if (!deleted) throw createError("Return tickets not found", 404);
  return successResponse(res, "Return tickets deleted successfully", 200, {});
});

export const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const inventory = await returnTicketService.getReturnTicketById(id);
  if (!inventory) throw createError("Return ticket not found", 404);
  return successResponse(
    res,
    "Return ticket fetched successfully",
    200,
    inventory
  );
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const updatedReturnTicket = await returnTicketService.updateReturnTicket(
    id,
    payload
  );
  if (!updatedReturnTicket) throw createError("Return Ticket not found", 404);
  return successResponse(res, "Return Ticket updated successfully", 200, {
    content: updatedReturnTicket,
  });
});
