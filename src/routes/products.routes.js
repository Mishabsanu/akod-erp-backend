import express from "express";
import * as productController from "../controllers/products.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import {
  createProductValidator,
  updateProductValidator,
} from "../validators/product.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  allowRoles("product:view"),
  productController.list
);
router.get(
  "/dropdown",
  authMiddleware,
  allowRoles("product:view"),
  productController.dropdown
);
router.get(
  "/:id",
  authMiddleware,
  allowRoles("product:view"),
  productController.getOne
);

router.post(
  "/",
  authMiddleware,
  allowRoles("product:create"),
  createProductValidator,
  validate,
  productController.create
);

router.put(
  "/:id",
  authMiddleware,
  allowRoles("product:update"),
  updateProductValidator,
  validate,
  productController.update
);
router.delete(
  "/:id",
  authMiddleware,
  allowRoles("product:delete"),
  productController.remove
);

export default router;
