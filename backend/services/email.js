import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = '"E-Store" <onboarding@resend.dev>';

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

// 1. Send New Order Alert Email to Admin
export const sendAdminOrderEmail = async (order) => {
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

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: process.env.EMAIL_USER,
      subject: `New Order Received! - Ref: ${order.paystackReference}`,
      html: emailWrapper("New Order Alert", body),
    });
  } catch (error) {
    console.error("Failed to send admin email:", error.message);
  }
};

// 2. Send Order Confirmation Email to Customer (this will activate when i have my own domain)
// const sendCustomerOrderEmail = async (order) => {
//   const body = `
//     <p style="font-size:15px; color:#333333; margin:0 0 12px 0;">Hi ${order.customerName}, thanks for your order! 🎉</p>
//     <p style="font-size:14px; color:#666666; margin:0 0 16px 0;">Ref: <strong style="word-break:break-all;">${order.paystackReference}</strong></p>

//     ${itemsTable(order.items)}

//     <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%; border-top:2px solid #7c3aed; margin-top:8px; padding-top:12px;">
//       <tr>
//         <td style="font-weight:600; font-size:15px; color:#111111;">Total Paid</td>
//         <td style="font-weight:600; font-size:15px; color:#7c3aed; text-align:right;">$${order.totalAmount}</td>
//       </tr>
//     </table>

//     <div style="margin-top:24px; padding-top:16px; border-top:1px solid #eeeeee;">
//       <p style="font-size:14px; color:#333333; margin:0 0 4px 0;"><strong>Shipping Address:</strong></p>
//       <p style="font-size:14px; color:#666666; margin:0; line-height:1.5; word-break:break-word;">${order.shippingAddress}</p>
//     </div>

//     <p style="font-size:13px; color:#999999; margin-top:24px;">We'll notify you once your order is out for delivery.</p>
//   `;

//   try {
//     await resend.emails.send({
//       from: FROM_ADDRESS,
//       to: order.customerEmail,
//       subject: `Order Confirmation - Ref: ${order.paystackReference}`,
//       html: emailWrapper("Order Confirmed", body),
//     });
//   } catch (error) {
//     console.error("Failed to send customer email:", error.message);
//   }
// };
