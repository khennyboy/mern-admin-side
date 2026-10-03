import cron from "node-cron";
import Order from "../models/order.model.js";
import { releaseOrder } from "../services/reservation.js";

// Every minute: release holds that ran out of time and were never paid
export function startExpiryJob() {
    cron.schedule("* * * * *", async () => {
        const stale = await Order.find({
            paymentStatus: "pending",
            expiresAt: { $lt: new Date() },
        }).select("_id");

        for (const { _id } of stale) {
            await releaseOrder({ _id });
        }
    });
}