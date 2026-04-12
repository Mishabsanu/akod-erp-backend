import express from "express";
import * as inventoryController from "../controllers/inventory.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import {
  createInventory,
  updateInventory,
} from "../validators/inventory.validator.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.get(
  "/available-products",
  authMiddleware,
  allowRoles("inventory:view"),
  inventoryController.GetAvailableProducts
);

router.get(
  "/",
  authMiddleware,
  allowRoles("inventory:view"),
  inventoryController.getAll
);
router.get(
  "/dropdown",
  authMiddleware,
  allowRoles("inventory:view"),
  inventoryController.dropdown
);
router.get(
  "/:id",
  authMiddleware,
  allowRoles("inventory:view"),
  inventoryController.getOne
);
router.post(
  "/",
  authMiddleware,
  allowRoles("inventory:create"),
  createInventory, // Added validator
  validate,
  inventoryController.create
);
router.put(
  "/:id",
  authMiddleware,
  allowRoles("inventory:update"),
  updateInventory, // Added validator
  validate,
  inventoryController.update
);
router.delete(
  "/:id",
  authMiddleware,
  allowRoles("inventory:delete"),
  inventoryController.remove
);

export default router;
