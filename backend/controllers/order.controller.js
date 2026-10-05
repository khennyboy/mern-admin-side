import crypto from "crypto";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { sendAdminOrderEmail, sendAdminAlertEmail } from "../services/email.js";
import { saveCustomerDetails } from "../services/paystack.js";
import {
  takeStock,
  giveStockBack,
  releaseOrder,
  confirmPayment,
} from "../services/reservation.js";

const HOLD_MINUTES = 15; // reservation time
const MAX_ITEMS_PER_ORDER = 30;

const confirmedOnly = { orderStatus: { $ne: "unconfirmed" } };

const statusFilters = {
  pending: { deliveryStatus: "pending" },
  completed: { deliveryStatus: "delivered" },
  refund_needed: { refundStatus: "refund_needed" },
  refunded: { refundStatus: "refunded" },
};

const messageFor = (order) =>
  order.refundAmount > 0
    ? "Your payment was successful. We will get back to you shortly."
    : "Your payment was successful. We will be in touch about delivery.";

export const initializePayment = async (req, res) => {
  let createdReference = null;
  let stockHeld = false;
  let verifiedItems = [];

  try {
    const { name, email, address, phone, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided" });
    }
    if (items.length > MAX_ITEMS_PER_ORDER) {
      return res.status(400).json({
        success: false,
        message: `Orders cannot contain more than ${MAX_ITEMS_PER_ORDER} items.`,
      });
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
    stockHeld = true;

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
      deliveryStatus: "pending",
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
    // for handling db error for returing product back to stock after error occured while trying to initialize payment
    try {
      if (createdReference) {
        await releaseOrder({ paystackReference: createdReference }); // after create order error 
      } else if (stockHeld) {
        await giveStockBack(verifiedItems); // before create order error 
      }
    } catch (cleanupError) {
      await sendAdminAlertEmail(
        "Stock may be stuck after a failed checkout",
        `${cleanupError.message}\n\nReference: ${createdReference ?? "none (order was not saved)"}\nItems: ${JSON.stringify(verifiedItems)}`,
      );
    }

    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

// verify payment function
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    // incase if webhook has run first
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

    const { order, justPaid } = await confirmPayment(reference, paystackData.data);

    res.status(200).json({ success: true, message: messageFor(order), order });

    if (justPaid) {
      sendAdminOrderEmail(order).catch((err) => {
        console.error("Failed to send admin order email:", err.message);
      });
      saveCustomerDetails({
        email: order.customerEmail,
        name: order.customerName,
        phone: order.phone,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const limit = 10;
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.pageO) || 1;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = {
      ...confirmedOnly,
      ...(Object.hasOwn(statusFilters, status) ? statusFilters[status] : {}),
    };


    const [totalOrders, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    return res
      .status(200)
      .json({ success: true, data: orders, totalOrders, pageSize: limit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrdersCount = async (_, res) => {
  try {
    const count = await Order.countDocuments({
      ...confirmedOnly,
      $or: [{ deliveryStatus: "pending" }, { refundStatus: "refund_needed" }],
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// mark orders delivered
export const markOrderDelivered = async (req, res) => {
  try {
    const { id } = req.params;

    const waiting = await Order.findOneAndUpdate(
      { _id: id, refundStatus: "refund_needed" },
      { $unset: { refundStatus: "" } },
      { returnDocument: "before" },
    ).lean();

    if (waiting) {
      let held = false;
      try {
        held = await takeStock(waiting.refundItems);
      } finally {
        if (!held) {
          await Order.updateOne({ _id: id }, { $set: { refundStatus: "refund_needed" } });
        }
      }

      if (!held) {
        return res.status(409).json({
          success: false,
          message: "Not enough stock yet. Restock the products first.",
        });
      }

      await Order.updateOne(
        { _id: id },
        {
          $push: { items: { $each: waiting.refundItems } },
          $unset: { refundItems: "", refundAmount: "" },
        },
      );
    }

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

// refund money
export const refundOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOneAndUpdate(
      { _id: id, refundStatus: "refund_needed" },
      { $set: { refundStatus: "refunded", refundedAt: new Date() } },
      { returnDocument: "after" },
    ).lean();

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "No refund pending for this order" });
    }

    try {
      const paystackRes = await fetch("https://api.paystack.co/refund", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction: order.paystackReference,
          amount: Math.round(order.refundAmount * 100),
        }),
      });
      const data = await paystackRes.json();

      if (!paystackRes.ok || !data.status) {
        throw new Error(data.message || "Paystack refund failed");
      }
    } catch (err) {
      await Order.updateOne(
        { _id: id },
        { $set: { refundStatus: "refund_needed" }, $unset: { refundedAt: "" } },
      );
      throw err;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};