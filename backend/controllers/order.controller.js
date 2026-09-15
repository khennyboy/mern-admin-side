import nodemailer from "nodemailer";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  // service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Shared email styles (Mobile Responsive)
const emailWrapper = (title, bodyContent) => `
  <div style="background:#f4f4f7; padding:16px 8px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width:100%; box-sizing:border-box;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width:520px; width:100%; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border-collapse:collapse;">
      <tr>
        <td style="background:#7c3aed; padding:20px 24px;">
          <h1 style="margin:0; color:#ffffff; font-size:20px; font-weight:600;">${title}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 16px;">
          ${bodyContent}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px; background:#fafafa; border-top:1px solid #eeeeee;">
          <p style="margin:0; font-size:12px; color:#999999; text-align:center;">E-Store · This is an automated email.</p>
        </td>
      </tr>
    </table>
  </div>
`;

const itemsTable = (items) => `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; margin:16px 0;">
    ${items
      .map(
        (item) => `
      <tr style="border-bottom:1px solid #eeeeee;">
        <td style="padding:10px 0; font-size:14px; color:#333333; word-break:break-word;">
          ${item.name} <span style="color:#999999; white-space:nowrap;">×${item.quantity}</span>
        </td>
        <td style="padding:10px 0; font-size:14px; color:#333333; text-align:right; font-weight:500; white-space:nowrap; vertical-align:top;">
          $${item.price}
        </td>
      </tr>`,
      )
      .join("")}
  </table>
`;

// 1. Send Order Confirmation Email to Customer
const sendCustomerOrderEmail = async (order) => {
  const body = `
    <p style="font-size:15px; color:#333333; margin:0 0 12px 0;">Hi ${order.customerName}, thanks for your order! 🎉</p>
    <p style="font-size:14px; color:#666666; margin:0 0 16px 0;">Ref: <strong style="word-break:break-all;">${order.paystackReference}</strong></p>
    
    ${itemsTable(order.items)}
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%; border-top:2px solid #7c3aed; margin-top:8px; padding-top:12px;">
      <tr>
        <td style="font-weight:600; font-size:15px; color:#111111;">Total Paid</td>
        <td style="font-weight:600; font-size:15px; color:#7c3aed; text-align:right;">$${order.totalAmount}</td>
      </tr>
    </table>

    <div style="margin-top:24px; padding-top:16px; border-top:1px solid #eeeeee;">
      <p style="font-size:14px; color:#333333; margin:0 0 4px 0;"><strong>Shipping Address:</strong></p>
      <p style="font-size:14px; color:#666666; margin:0; line-height:1.5; word-break:break-word;">${order.shippingAddress}</p>
    </div>

    <p style="font-size:13px; color:#999999; margin-top:24px;">We'll notify you once your order is out for delivery.</p>
  `;

  const mailOptions = {
    from: `"E-Store" <${process.env.EMAIL_USER}>`,
    to: order.customerEmail,
    subject: `Order Confirmation - Ref: ${order.paystackReference}`,
    html: emailWrapper("Order Confirmed", body),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send customer email:", error.message);
  }
};

// 2. Send New Order Alert Email to Admin
const sendAdminOrderEmail = async (order) => {
  const body = `
    <p style="font-size:15px; color:#333333; margin:0 0 16px 0;">🚨 A new order just came in.</p>
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%; font-size:14px; color:#333333; margin:16px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:6px 0; color:#888888; width:30%; vertical-align:top;">Customer</td>
        <td style="padding:6px 0; text-align:right; font-weight:500; word-break:break-word; width:70%;">${order.customerName}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#888888; vertical-align:top;">Email</td>
        <td style="padding:6px 0; text-align:right; font-weight:500; word-break:break-all;"><a href="mailto:${order.customerEmail}" style="color:#7c3aed; text-decoration:none;">${order.customerEmail}</a></td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#888888; vertical-align:top;">Phone</td>
        <td style="padding:6px 0; text-align:right; font-weight:500; word-break:break-word;">${order.phone}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#888888; vertical-align:top;">Address</td>
        <td style="padding:6px 0; text-align:right; font-weight:500; word-break:break-word; line-height:1.4;">${order.shippingAddress}</td>
      </tr>
    </table>

    ${itemsTable(order.items)}

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%; border-top:2px solid #7c3aed; margin-top:8px; padding-top:12px;">
      <tr>
        <td style="font-weight:600; font-size:15px; color:#111111;">Total Paid</td>
        <td style="font-weight:600; font-size:15px; color:#7c3aed; text-align:right;">$${order.totalAmount}</td>
      </tr>
    </table>

    <p style="font-size:13px; color:#999999; margin-top:24px;">Log in to the admin dashboard to update the delivery status.</p>
  `;

  const mailOptions = {
    from: `"E-Store" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `New Order Received! - Ref: ${order.paystackReference}`,
    html: emailWrapper("New Order Alert", body),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send admin email:", error.message);
  }
};

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
    // Recalculate everything from the DB — never trust price/totalAmount from the client
    const productIds = items.map((item) => item.product);
    // find the products from the db from the productsId the user carted
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

    // No DB write here anymore — the order is only created once payment is
    // confirmed in verifyPayment. Everything needed to build it is carried
    // through Paystack's metadata for this reference.
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

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
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

    // Idempotency: if this reference already produced an order (e.g. the user
    // hits this endpoint twice, or you later add a webhook), just return it.
    const existingOrder = await Order.findOne({ paystackReference: reference });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        order: existingOrder,
      });
    }

    const metadata = paystackData.data.metadata;
    if (!metadata || !metadata.items) {
      return res.status(400).json({
        success: false,
        message: "Missing order metadata for this transaction",
      });
    }

    // Recompute the total fresh from the DB (never trust metadata prices) and
    // cross-check it against what Paystack actually charged.
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

    const order = await Order.create({
      customerName: metadata.customerName,
      customerEmail: metadata.customerEmail,
      shippingAddress: metadata.shippingAddress,
      phone: metadata.phone,
      items: verifiedItems,
      totalAmount,
      paystackReference: reference,
      paymentStatus: "success",
      paidAt: new Date(),
    });

    await Promise.allSettled([
      sendCustomerOrderEmail(order),
      sendAdminOrderEmail(order),
    ]);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Admin: Get all successful orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ paymentStatus: "success" })
      .populate("items.product", "image name")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Admin: Get count of orders awaiting delivery (for the nav badge)
export const getOrdersCount = async (req, res) => {
  try {
    const count = await Order.countDocuments({
      paymentStatus: "success",
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
