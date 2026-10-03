import cron from "node-cron";
import Order from "../models/order.model.js";
import { releaseOrder } from "../services/reservation.js";

// Every minute: delete unpaid orders past their deadline and return their stock
export function startExpiryJob() {
  cron.schedule("* * * * *", async () => {
    try {
      const stale = await Order.find({
        orderStatus: "unconfirmed",
        expiresAt: { $lt: new Date() },
      }).select("_id");

      for (const { _id } of stale) {
        try {
          await releaseOrder({ _id });
        } catch (err) {
          console.error(`Expiry failed for order ${_id}:`, err.message);
        }
      }
    } catch (err) {
      console.error("Expiry job error:", err.message);
    }
  });
}