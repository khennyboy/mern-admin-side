import crypto from "crypto";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { sendAdminOrderEmail } from "../services/email.js";
import {
  takeStock,
  giveStockBack,
  releaseOrder,
  confirmPayment,
} from "../services/reservation.js";

const HOLD_MINUTES = 15;


const confirmedOnly = { orderStatus: { $ne: "unconfirmed" } };

const messageFor = (order) => {
  if (!order.refundAmount) return "Payment verified successfully";
  const names = order.refundItems.map((i) => i.name).join(", ");
  return `Payment received, but these items are no longer available: ${names}. We will contact you about a refund of ₦${order.refundAmount.toLocaleString()}.`;
};

// 1. Initialize Paystack Payment
export const initializePayment = async (req, res) => {
  let createdReference = null;
  let verifiedItems = [];

  try {
    const { name, email, address, phone, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided" });
    }
    if (!name || !email || !address || !phone) {
      return res.status(400).json({ success: false, message: "User details is required" });
    }

    const productIds = items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    let totalAmount = 0;
    verifiedItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.product);
      if (!product) throw new Error(`Product not found: ${item.product}`);

      const quantity = Math.max(1, parseInt(item.quantity) || 1);

      if (quantity > product.quantity) {
        const err = new Error(
          product.quantity === 0
            ? `"${product.name}" is out of stock`
            : `Only ${product.quantity} of "${product.name}" available`,
        );
        err.statusCode = 400;
        throw err;
      }

      totalAmount += product.price * quantity;
      return {
        product: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity,
      };
    });


    const held = await takeStock(verifiedItems);
    if (!held) {
      return res.status(409).json({
        success: false,
        message: "Some items just sold out or are being held by other buyers. Try again shortly.",
      });
    }

    const reference = `REF_${crypto.randomUUID()}`;
    await Order.create({
      customerName: name,
      customerEmail: email,
      shippingAddress: address,
      phone,
      items: verifiedItems,
      totalAmount,
      paystackReference: reference,
      orderStatus: "unconfirmed",
      expiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
    });
    createdReference = reference;

    const paystackPayload = {
      email,
      amount: Math.round(totalAmount * 100),
      reference,
      callback_url: `${process.env.CUSTOMER_URL}/payment-verify?reference=${reference}`,
      metadata: {
        customerName: name,
        customerEmail: email,
        shippingAddress: address,
        phone,
        items: verifiedItems,
        totalAmount,
      },
    };

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackRes.json();
    if (!paystackRes.ok) {
      throw new Error(paystackData.message || "Paystack initialization failed");
    }

    return res.status(200).json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference,
    });
  } catch (error) {
    if (createdReference) {
      await releaseOrder({ paystackReference: createdReference }); // payment failed
    } else if (verifiedItems.length > 0) {
      await giveStockBack(verifiedItems); // order creation failed
    }

    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};


// 2. Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    // webhook already confirmed the order
    const existing = await Order.findOne({ paystackReference: reference });
    if (existing?.orderStatus === "confirmed") {
      return res
        .status(200)
        .json({ success: true, message: messageFor(existing), order: existing });
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } },
    );
    const paystackData = await paystackRes.json();

    if (!paystackRes.ok) {
      throw new Error(paystackData.message || "Paystack verification failed");
    }

    if (paystackData.data.status !== "success") {
      if (["abandoned", "failed"].includes(paystackData.data.status)) {
        await releaseOrder({ paystackReference: reference });
      }
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    const { order, justPaid, reason } = await confirmPayment(reference, paystackData.data);

    if (!order) {
      return res.status(409).json({ success: false, message: reason });
    }


    res.status(200).json({ success: true, message: messageFor(order), order });

    if (justPaid) sendAdminOrderEmail(order);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const limit = 10;
// 3. Admin: Get all confirmed orders
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.pageO) || 1;
    const skip = (page - 1) * limit;
    const [totalOrders, orders] = await Promise.all([
      Order.countDocuments(confirmedOnly),
      Order.find(confirmedOnly)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("items.product", "name"),
    ]);

    return res
      .status(200)
      .json({ success: true, data: orders, totalOrders, pageSize: limit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Admin: Get count of orders awaiting delivery
export const getOrdersCount = async (req, res) => {
  try {
    const count = await Order.countDocuments({
      ...confirmedOnly,
      deliveryStatus: "pending",
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Admin: Mark order as delivered
export const markOrderDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(
      id,
      { deliveryStatus: "delivered" },
      { returnDocument: "after" },
    );
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};