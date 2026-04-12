import { body } from "express-validator";

export const createVendorValidator = [
  body("name").notEmpty().withMessage("Vendor name is required"),
  body("company").notEmpty().withMessage("Company name is required"),
  body("mobile")
    .optional()
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage("Invalid mobile number"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),

  // Address (optional)
  body("address").optional().trim(),
  body("pincode").optional().trim(),
  body("city").optional().trim(),
  body("district").optional().trim(),
  body("state").optional().trim(),
];

export const updateVendorValidator = [
  body("name").optional().notEmpty().withMessage("Vendor name is required"),
  body("email").optional().isEmail().withMessage("Invalid email address"),
  body("company").optional().notEmpty().withMessage("Company name is required"),
  body("mobile")
    .optional()
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage("Invalid mobile number"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),

  // Address
  body("address").optional().trim(),
  body("pincode").optional().trim(),
  body("city").optional().trim(),
  body("district").optional().trim(),
  body("state").optional().trim(),
];
