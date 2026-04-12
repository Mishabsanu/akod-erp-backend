import express from "express";
import {
    AddDeliveryTicket,
    GetDeliveryTickets,
    GetLatestDeliveryTicketNo,
    GetPoNoDropdown,
    getOne,
    remove,
    update
} from "../controllers/deliveryTicket.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();
router.get(
  "/next-ticket-no",
  authMiddleware,
  allowRoles("delivery_ticket:view"),
  GetLatestDeliveryTicketNo
);

router.get(
  "/po-dropdown",
  authMiddleware,
  allowRoles("delivery_ticket:view"),
  GetPoNoDropdown
);

/* -------- CRUD ROUTES -------- */
router.post(
  "/",
  authMiddleware,
  allowRoles("delivery_ticket:create"),
  AddDeliveryTicket
);
router.get(
  "/",
  authMiddleware,
  allowRoles("delivery_ticket:view"),
  GetDeliveryTickets
);
router.put(
  "/:id",
  authMiddleware,
  allowRoles("delivery_ticket:update"),
  update
);
router.get("/:id", authMiddleware, allowRoles("delivery_ticket:view"), getOne);

router.delete(
  "/:id",
  authMiddleware,
  allowRoles("delivery_ticket:delete"),
  remove
);
export default router;
