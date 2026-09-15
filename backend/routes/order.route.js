import express from "express";
import {
  initializePayment,
  verifyPayment,
  getOrders,
  markOrderDelivered,
} from "../controllers/order.controller.js";
import { protectRoute } from "../middleware/protected-route.js";
import { getOrdersCount } from "../controllers/order.controller.js";

const router = express.Router();

router.post("/initialize", initializePayment);
router.get("/verify", verifyPayment);

// Admin Routes
router.get("/", protectRoute, getOrders);
router.get("/count", protectRoute, getOrdersCount);
router.patch("/:id/deliver", protectRoute, markOrderDelivered);

export default router;
