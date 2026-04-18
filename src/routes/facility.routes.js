import express from "express";
import * as facilityController from "../controllers/facility.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Facility Routes
router.get("/", authMiddleware, allowRoles("facility:view"), facilityController.listFacilities);
router.get("/dropdown", authMiddleware, allowRoles("facility:view"), facilityController.facilityDropdown);
router.get("/:id", authMiddleware, allowRoles("facility:view"), facilityController.getFacility);
router.post("/", authMiddleware, allowRoles("facility:create"), facilityController.createFacility);
router.put("/:id", authMiddleware, allowRoles("facility:update"), facilityController.updateFacility);
router.delete("/:id", authMiddleware, allowRoles("facility:delete"), facilityController.deleteFacility);

// Checklist Routes
router.get("/audit/logs", authMiddleware, allowRoles("facility:view"), facilityController.listChecklists);
router.post("/audit/report", authMiddleware, allowRoles("facility:create"), upload.array("photos", 5), facilityController.createChecklist);

export default router;
