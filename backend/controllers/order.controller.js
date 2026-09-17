import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { sendAdminOrderEmail } from "../services/Email.js";
// 1. Initialize Paystack Payment
export const initializePayment = async (req, res) => {
  try {
    const { name, email, address, phone, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items provided" });
    }
    if (!name || !email || !address || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "User details is required" });
    }

    const productIds = items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    let totalAmount = 0;
    const verifiedItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.product);
      if (!product) throw new Error(`Product not found: ${item.product}`);

      const quantity = Math.max(1, Number(item.quantity) || 1);
      totalAmount += product.price * quantity;

      return {
        product: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity,
      };
    });

    const reference = `REF_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    const paystackPayload = {
      email,
      amount: Math.round(totalAmount * 100),
      reference,
      // callback_url: `${process.env.CUSTOMER_URL}/payment-verify?reference=${reference}`,
      metadata: {
        customerName: name,
        customerEmail: email,
        shippingAddress: address,
        phone,
        items: verifiedItems,
      },
    };

    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackPayload),
      },
    );

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok) {
      throw new Error(paystackData.message || "Paystack initialization failed");
    }

    res.status(200).json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    // Fast path — webhook usually beats the redirect
    let order = await Order.findOne({ paystackReference: reference });
    if (order) {
      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        order,
      });
    }

    // Fallback — webhook hasn't landed yet, verify directly
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );
    const paystackData = await paystackRes.json();

    if (!paystackRes.ok) {
      throw new Error(paystackData.message || "Paystack verification failed");
    }
    if (paystackData.data.status !== "success") {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    const metadata = paystackData.data.metadata;
    if (!metadata || !metadata.items) {
      return res.status(400).json({
        success: false,
        message: "Missing order metadata for this transaction",
      });
    }

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
    const baseAmountPaid =
      paystackData.data.requested_amount || paystackData.data.amount;
    if (baseAmountPaid !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: "Payment amount mismatch — order not created",
      });
    }

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
      if (err.code === 11000) {
        order = await Order.findOne({ paystackReference: reference }); // webhook won the race
      } else {
        throw err;
      }
    }

    // Respond first — emails never delay the user
    res
      .status(200)
      .json({ success: true, message: "Payment verified successfully", order });

    sendAdminOrderEmail(order);
    sendCustomerOrderEmail(order);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const limit = 10;
// 3. Admin: Get all successful orders
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.pageO) || 1;
    const skip = (page - 1) * limit;
    const [totalOrders, orders] = await Promise.all([
      Order.countDocuments(),
      Order.find()
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
      { new: true },
    );
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
