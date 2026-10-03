import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = '"E-Store" <onboarding@resend.dev>';

// Resend does NOT throw when sending fails, it returns { error }.
// This helper turns that into a real error so our try/catch can see it.
const send = async (payload) => {
  const { error } = await resend.emails.send(payload);
  if (error) throw new Error(error.message);
};

const escapeHtml = (text = "") =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
          ₦${item.price.toLocaleString()}
        </td>
      </tr>`,
      )
      .join("")}
  </table>
`;

// 1. Send New Order Alert Email to Admin
export const sendAdminOrderEmail = async (order) => {
  // Shown only when the customer paid late and some items were out of stock
  const refundBlock =
    order.refundAmount > 0
      ? `
    <div style="margin-top:20px; padding:14px 16px; background:#fff4e5; border:1px solid #ffd8a8; border-radius:8px;">
      <p style="margin:0 0 6px 0; font-size:14px; font-weight:600; color:#b45309;">⚠️ Refund needed: ₦${order.refundAmount.toLocaleString()}</p>
      <p style="margin:0; font-size:13px; color:#666666;">The customer paid after the stock hold expired, and these items were no longer available:</p>
      ${itemsTable(order.refundItems)}
    </div>`
      : "";

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
        <td style="font-weight:600; font-size:15px; color:#7c3aed; text-align:right;">₦${order.totalAmount.toLocaleString()}</td>
      </tr>
    </table>

    ${refundBlock}

    <p style="font-size:13px; color:#999999; margin-top:24px;">Log in to the admin dashboard to update the delivery status.</p>
  `;

  try {
    await send({
      from: FROM_ADDRESS,
      to: process.env.EMAIL_USER,
      subject:
        order.refundAmount > 0
          ? `Order needs a refund call - Ref: ${order.paystackReference}`
          : `New Order Received! - Ref: ${order.paystackReference}`,
      html: emailWrapper("New Order Alert", body),
    });
  } catch (error) {
    console.error("Failed to send admin email:", error.message);
  }
};

// 2. Send an alert to the admin when a payment could not be processed
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
    // an alert must never crash or hide the original problem
    console.error("Failed to send admin alert:", error.message);
  }
};

