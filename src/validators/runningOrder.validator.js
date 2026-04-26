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
const transactionTypeEnum = ["Sale", "Hire", "Contract"];

export const createRunningOrderValidator = [
  body("company_name").optional().isString(),
  body("client_name").optional().isString(),
  body("ordered_date")
    .notEmpty()
    .withMessage("Ordered date is required")
    .isISO8601()
    .toDate(),
  body("order_number").notEmpty().withMessage("Order number is required"),
  body("invoice_number").optional().isString(),
  body("po_number").optional().isString(),
  body("project_location").optional().isString(),
  body("invoice_amount").optional().isNumeric(),
  body("advance_payment").optional().isNumeric(),
  body("currency").optional().isIn(currencyEnum),
  body("etd").optional().isISO8601().toDate(),
  body("eta").optional().isISO8601().toDate(),
  body("remarks").optional().isString(),
  body("status").optional().isIn(statusEnum),
  body("transaction_type")
    .notEmpty()
    .withMessage("Transaction type is required")
    .isIn(transactionTypeEnum),
];

export const updateRunningOrderValidator = [
  body("company_name").optional().isString(),
  body("client_name").optional().isString(),
  body("ordered_date").optional().isISO8601().toDate(),
  body("order_number").optional().isString(),
  body("invoice_number").optional().isString(),
  body("po_number").optional().isString(),
  body("project_location").optional().isString(),
  body("invoice_amount").optional().isNumeric(),
  body("advance_payment").optional().isNumeric(),
  body("currency").optional().isIn(currencyEnum),
  body("etd").optional().isISO8601().toDate(),
  body("eta").optional().isISO8601().toDate(),
  body("remarks").optional().isString(),
  body("status").optional().isIn(statusEnum),
  body("transaction_type").optional().isIn(transactionTypeEnum),
];
