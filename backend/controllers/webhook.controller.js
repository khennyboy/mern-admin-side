import crypto from "crypto";
import { sendAdminOrderEmail } from "../services/email.js";
import { confirmPayment } from "../services/reservation.js";

export const handlePaystackWebhook = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest("hex");

  if (hash !== signature) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid signature" });
  }


  res.status(200).json({ received: true });

  try {
    const event = JSON.parse(req.body.toString());
    if (event.event !== "charge.success") return;

    const { order, justPaid, reason } = await confirmPayment(
      event.data.reference,
      event.data,
    );

    if (!order) {
      console.error(`Webhook: ${reason} (ref ${event.data.reference})`);
      return;
    }

    if (justPaid) sendAdminOrderEmail(order);
  } catch (error) {
    console.error("Webhook processing error:", error.message);
  }
};