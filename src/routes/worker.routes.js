import express from "express";
import * as workerController from "../controllers/worker.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", authMiddleware, allowRoles("worker:view"), workerController.listWorkers);
router.get("/:id", authMiddleware, allowRoles("worker:view"), workerController.getWorker);
router.post("/", authMiddleware, allowRoles("worker:create"), upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
  { name: 'qidDoc', maxCount: 1 },
  { name: 'passportDoc', maxCount: 1 },
  { name: 'insuranceDoc', maxCount: 1 },
  { name: 'healthCardDoc', maxCount: 1 },
  { name: 'certificateDoc', maxCount: 1 }
]), workerController.createWorker);
router.put("/:id", authMiddleware, allowRoles("worker:update"), workerController.updateWorker);
router.delete("/:id", authMiddleware, allowRoles("worker:delete"), workerController.deleteWorker);

export default router;
