import express from "express";
import {
  AddReturnTicket,
  GetDeliveredProducts,
  GetDeliveryByPo,
  GetLatestReturnTicketNo,
  getOne,
  GetPoReport,
  GetReturnTickets,
  remove,
  update,
} from "../controllers/returnTicket.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();
router.get(
  "/next-ticket-no",
  authMiddleware,
  allowRoles("return_ticket:view"),
  GetLatestReturnTicketNo
);
router.get(
  "/delivered-products",
  authMiddleware,
  allowRoles("return_ticket:view"),
  GetDeliveredProducts
);
router.get(
  "/by-po",
  authMiddleware,
  allowRoles("return_ticket:view"),
  GetDeliveryByPo
);
router.get(
  "/po-report",
  authMiddleware,
  allowRoles("return_ticket:view"),
  GetPoReport
);
router.post(
  "/",
  authMiddleware,
  allowRoles("return_ticket:create"),
  AddReturnTicket
);
router.get(
  "/",
  authMiddleware,
  allowRoles("return_ticket:view"),
  GetReturnTickets
);

router.delete(
  "/:id",
  authMiddleware,
  allowRoles("return_ticket:delete"),
  remove
);
router.get("/:id", authMiddleware, allowRoles("return_ticket:view"), getOne);
router.put("/:id", authMiddleware, allowRoles("return_ticket:update"), update);
export default router;
