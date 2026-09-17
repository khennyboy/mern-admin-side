import crypto from "crypto";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { sendAdminOrderEmail } from "../services/email.js";

export const handlePaystackWebhook = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.body) // raw Buffer, not parsed JSON
    .digest("hex");

  if (hash !== signature) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid signature" });
  }

  // Acknowledge Paystack immediately — they just need a fast 200.
  // Everything after this runs in the background.
  res.status(200).json({ received: true });

  try {
    const event = JSON.parse(req.body.toString());
    if (event.event !== "charge.success") return;

    const data = event.data;
    const reference = data.reference;

    const existingOrder = await Order.findOne({ paystackReference: reference });
    if (existingOrder) return; // already created (e.g. via /verify)

    const metadata = data.metadata;
    if (!metadata || !metadata.items) return;

    const productIds = metadata.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    let totalAmount = 0;
    const verifiedItems = metadata.items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.product);
      if (!product) throw new Error(`Product not found: ${item.product}`);
      const quantity = Math.max(1, Number(item.quantity) || 1);
      totalAmount += product.price * quantity;
      return {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
      };
    });

    const expectedAmount = Math.round(totalAmount * 100);
    const baseAmountPaid = data.requested_amount || data.amount;
    if (baseAmountPaid !== expectedAmount) {
      console.error(`Webhook amount mismatch for ref ${reference}`);
      return;
    }

    let order;
    try {
      order = await Order.create({
        customerName: metadata.customerName,
        customerEmail: metadata.customerEmail,
        shippingAddress: metadata.shippingAddress,
        phone: metadata.phone,
        items: verifiedItems,
        totalAmount,
        paystackReference: reference,
      });
    } catch (err) {
      if (err.code === 11000) return; // race with /verify — it already created it
      throw err;
    }

    sendAdminOrderEmail(order);
  } catch (error) {
    console.error("Webhook processing error:", error.message);
  }
};
