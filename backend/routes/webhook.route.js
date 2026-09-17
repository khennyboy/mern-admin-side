import express from "express";
import { handlePaystackWebhook } from "../controllers/webhook.controller.js";

const router = express.Router();

// Paystack signs the RAW body — must NOT be JSON-parsed before this
router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  handlePaystackWebhook,
);

export default router;
