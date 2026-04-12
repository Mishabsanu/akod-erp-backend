import express from "express";
import * as runningOrderCtrl from "../controllers/runningOrder.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import {
  createRunningOrderValidator,
  updateRunningOrderValidator,
} from "../validators/runningOrder.validator.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, allowRoles("running_order:view"), runningOrderCtrl.list);
router.post("/", authMiddleware, allowRoles("running_order:create"), createRunningOrderValidator, validate, runningOrderCtrl.create);

router.get("/:id", authMiddleware, allowRoles("running_order:view"), runningOrderCtrl.getOne);
router.put("/:id", authMiddleware, allowRoles("running_order:update"), updateRunningOrderValidator, validate, runningOrderCtrl.update);
router.delete("/:id", authMiddleware, allowRoles("running_order:delete"), runningOrderCtrl.remove);

export default router;
