import crypto from "crypto";
import { sendAdminOrderEmail, sendAdminAlertEmail } from "../services/email.js";
import { confirmPayment } from "../services/reservation.js";
import { saveCustomerDetails } from "../services/paystack.js";

const paymentDetails = (data = {}) =>
  [
    `Reference: ${data.reference}`,
    `Customer: ${data.customer?.email}`,
    `Amount paid: ₦${(data.amount / 100).toLocaleString()}`,
  ].join("\n");

export const handlePaystackWebhook = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest("hex");

  if (hash !== signature) {
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());

    if (event.event === "charge.success") {
      const { order, justPaid } = await confirmPayment(
        event.data.reference,
        event.data,
      );

      if (justPaid) {
        await sendAdminOrderEmail(order);
        await saveCustomerDetails({
          email: order.customerEmail,
          name: order.customerName,
          phone: order.phone,
        });
      }

    }
    res.status(200).json({ received: true });
  } catch (error) {
    await sendAdminAlertEmail(
      "Payment processing failed, Paystack will retry",
      `${error.message}\n\n${paymentDetails(event?.data)}`,
    );
    res.status(500).json({ received: false });
  }
};