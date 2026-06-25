import { body, cookie } from "express-validator";

export const registerValidation = [
  body("name").notEmpty().withMessage("Name is required").isLength({ min: 3 }),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["admin", "user"]).withMessage("Invalid role"),
];

export const loginValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email or Mobile is required")
    .custom((value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const sanitizedPhone = value.replace(/[\s\-()]/g, "");
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!emailRegex.test(value) && !phoneRegex.test(sanitizedPhone)) {
        throw new Error("Enter a valid email or mobile number");
      }
      return true;
    }),
  body("password").notEmpty().withMessage("Password is required"),
];

export const refreshValidation = [
  cookie("refreshToken").notEmpty().withMessage("Refresh token is required"),
];
