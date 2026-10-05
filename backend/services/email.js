import { Resend } from "resend";
import { getAvailableBalance } from "./paystack.js";
import Order from "../models/order.model.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = '"E-Store" <onboarding@resend.dev>';

const send = async (payload) => {
  const { error } = await resend.emails.send(payload);
  if (error) throw new Error(error.message);
};

const escapeHtml = (text = "") =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// whole email
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

// for the items
const itemsTable = (items) => `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; margin:16px 0;">
    ${items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #eeeeee;">
        <td style="padding:10px 0; font-size:14px; color:#333333; word-break:break-word;">
          ${escapeHtml(item.name)} <span style="color:#999999; white-space:nowrap;">×${item.quantity}</span>
          ${item.product?.quantity !== undefined ? `<span style="color:#999999; white-space:nowrap;">· ${item.product.quantity} left in stock</span>` : ""}
        </td>
        <td style="padding:10px 0; font-size:14px; color:#333333; text-align:right; font-weight:500; white-space:nowrap; vertical-align:top;">
          ₦${item.price.toLocaleString()}
        </td>
      </tr>`,
    )
    .join("")}
  </table>
`;

// button that works as a link (table based so it also renders in Outlook)
const linkButton = (url, label) => `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:24px auto 0 auto;">
    <tr>
      <td align="center" bgcolor="#7c3aed" style="border-radius:8px;">
        <a href="${url}" target="_blank" style="display:inline-block; padding:12px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px; background:#7c3aed;">${label}</a>
      </td>
    </tr>
  </table>
`;

export const sendAdminOrderEmail = async (order) => {
  const hasRefund = order.refundAmount > 0;

  await order
    .populate([
      { path: "items.product", select: "quantity" },
      { path: "refundItems.product", select: "quantity" },
    ])
    .catch((error) => console.error("Could not load stock for the email:", error.message));

  const count = await Order.countDocuments({
    orderStatus: { $ne: "unconfirmed" },
    $or: [{ deliveryStatus: "pending" }, { refundStatus: "refund_needed" }],
  }).catch((error) => {
    console.error("Could not count orders for the email:", error.message);
    return 0;
  });

  const balance = await getAvailableBalance();

  const name = escapeHtml(order.customerName);
  const email = escapeHtml(order.customerEmail);
  const phone = escapeHtml(order.phone);
  const address = escapeHtml(order.shippingAddress);

  const attentionLine =
    count > 0
      ? `<p style="font-size:14px; font-weight:600; color:#7c3aed; margin:0 0 4px 0;">📦 ${count} ${count === 1 ? "order needs" : "orders need"} your attention.</p>`
      : "";

  const balanceText =
    balance === null ? null : `₦${balance.toLocaleString()}`;

  const balanceLine =
    balance === null
      ? `<p style="margin:8px 0 0 0; font-size:13px; color:#666666;">Paystack balance could not be loaded.</p>`
      : `<p style="margin:8px 0 0 0; font-size:13px; color:#666666;">Paystack available balance: <strong>${balanceText}</strong></p>`;

  const refundBalanceLine =
    balance === null
      ? `<p style="margin:8px 0 0 0; font-size:13px; color:#666666;">Paystack balance could not be loaded.</p>`
      : `<p style="margin:8px 0 0 0; font-size:13px; color:#666666;">Paystack available balance: <strong>${balanceText}</strong> (${balance >= order.refundAmount ? "enough to cover this refund" : "less than the refund amount"})</p>`;

  const refundBlock = hasRefund
    ? `
    <div style="margin-top:20px; padding:14px 16px; background:#fff4e5; border:1px solid #ffd8a8; border-radius:8px;">
      <p style="margin:0 0 6px 0; font-size:14px; font-weight:600; color:#b45309;">⚠️ Refund needed: ₦${order.refundAmount.toLocaleString()}</p>
      <p style="margin:0; font-size:13px; color:#666666;">The customer paid after the stock hold expired, and these items were no longer available:</p>
      ${itemsTable(order.refundItems)}
      ${refundBalanceLine}
      <p style="margin:8px 0 0 0; font-size:13px; color:#666666;">Call ${name} on ${phone} to offer a refund or a wait.</p>
    </div>`
    : "";

  const itemsBlock =
    order.items.length > 0
      ? itemsTable(order.items)
      : `<p style="font-size:14px; color:#b45309; margin:16px 0;">None of the ordered items were available.</p>`;

  const dashboardUrl = escapeHtml(process.env.VITE_ADMIN_URL || "");

  const dashboardBlock = dashboardUrl
    ? linkButton(dashboardUrl, "Go to admin dashboard")
    : `<p style="font-size:13px; color:#999999; margin-top:24px;">Log in to the admin dashboard to do the needful.</p>`;

  const body = `
    <p style="font-size:15px; color:#333333; margin:0 0 16px 0;">${hasRefund ? "⚠️ An order came in that needs a refund call." : "🚨 A new order just came in."}</p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%; font-size:14px; color:#333333; margin:16px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:6px 0; color:#888888; width:30%; vertical-align:top;">Customer</td>
        <td style="padding:6px 0; text-align:right; font-weight:500; word-break:break-word; width:70%;">${name}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#888888; vertical-align:top;">Email</td>
        <td style="padding:6px 0; text-align:right; font-weight:500; word-break:break-all;"><a href="mailto:${email}" style="color:#7c3aed; text-decoration:none;">${email}</a></td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#888888; vertical-align:top;">Phone</td>
        <td style="padding:6px 0; text-align:right; font-weight:500; word-break:break-word;">${phone}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#888888; vertical-align:top;">Address</td>
        <td style="padding:6px 0; text-align:right; font-weight:500; word-break:break-word; line-height:1.4;">${address}</td>
      </tr>
    </table>

    ${itemsBlock}
    ${attentionLine}
    ${balanceLine}

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%; border-top:2px solid #7c3aed; margin-top:8px; padding-top:12px;">
      <tr>
        <td style="font-weight:600; font-size:15px; color:#111111;">Total Paid</td>
        <td style="font-weight:600; font-size:15px; color:#7c3aed; text-align:right;">₦${order.totalAmount.toLocaleString()}</td>
      </tr>
    </table>

    ${refundBlock}

    ${dashboardBlock}
  `;

  try {
    await send({
      from: FROM_ADDRESS,
      to: process.env.EMAIL_USER,
      subject: hasRefund
        ? `Order needs a refund call - Ref: ${order.paystackReference}`
        : `New Order Received! - Ref: ${order.paystackReference}`,
      html: emailWrapper("New Order Alert", body),
    });
  } catch (error) {
    console.error("Failed to send admin email:", error.message);
  }
};

export const sendAdminAlertEmail = async (subject, details) => {
  const body = `
    <p style="font-size:15px; color:#333333; margin:0 0 16px 0;">Something needs your attention.</p>
    <pre style="white-space:pre-wrap; word-break:break-word; background:#fafafa; border:1px solid #eeeeee; border-radius:8px; padding:12px; font-size:13px; color:#333333; margin:0; font-family:inherit;">${escapeHtml(details)}</pre>
    <p style="font-size:13px; color:#999999; margin-top:24px;">Look up the reference on your Paystack dashboard to check the payment.</p>
  `;

  try {
    await send({
      from: FROM_ADDRESS,
      to: process.env.EMAIL_USER,
      subject: `⚠️ ${subject}`,
      html: emailWrapper("Action needed", body),
    });
  } catch (error) {
    console.error("Failed to send admin alert:", error.message);
  }
};