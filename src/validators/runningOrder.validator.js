import { body } from "express-validator";

const statusEnum = [
  "Order placed",
  "Production going on",
  "Ready to dispatch",
  "Loaded",
  "On the way to port",
  "Arrive at port",
  "Depart from port",
  "In transit to destination",
  "Arrived at destination",
  "Completed",
];

const currencyEnum = ["INR", "USD", "EUR", "GBP", "JPY", "CNY"];

export const createRunningOrderValidator = [
  body("company_name").notEmpty().withMessage("Company name is required"),
  body("client_name").notEmpty().withMessage("Client name is required"),
  body("ordered_date")
    .notEmpty()
    .withMessage("Ordered date is required")
    .isISO8601()
    .toDate(),
  body("invoice_number").notEmpty().withMessage("Invoice number is required"),
  body("po_number").optional().isString(),
  body("invoice_amount")
    .notEmpty()
    .withMessage("Invoice amount is required")
    .isNumeric(),
  body("advance_payment").optional().isNumeric(),
  body("currency").optional().isIn(currencyEnum),
  body("etd").optional().isISO8601().toDate(),
  body("eta").optional().isISO8601().toDate(),
  body("remarks").optional().isString(),
  body("status").optional().isIn(statusEnum),
];

export const updateRunningOrderValidator = [
  body("company_name").optional().notEmpty().withMessage("Company name is required"),
  body("client_name").optional().notEmpty().withMessage("Client name is required"),
  body("ordered_date").optional().isISO8601().toDate(),
  body("invoice_number")
    .optional()
    .notEmpty()
    .withMessage("Invoice number is required"),
  body("po_number").optional().isString(),
  body("invoice_amount").optional().isNumeric(),
  body("advance_payment").optional().isNumeric(),
  body("currency").optional().isIn(currencyEnum),
  body("etd").optional().isISO8601().toDate(),
  body("eta").optional().isISO8601().toDate(),
  body("remarks").optional().isString(),
  body("status").optional().isIn(statusEnum),
];
