import { Resend } from "resend";
import { IOrder } from "@/types";
import { formatPrice } from "./utils";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test_placeholder");

export async function sendOrderConfirmationEmail(order: IOrder, recipientEmail?: string) {
  const targetEmail = recipientEmail || order.guestEmail;
  if (!targetEmail || !process.env.RESEND_API_KEY) {
    console.log("Email service skipped: missing API key or recipient email.");
    return;
  }

  try {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
        </tr>
      `
      )
      .join("");

    await resend.emails.send({
      from: "NovaStore <onboarding@resend.dev>",
      to: targetEmail,
      subject: `Order Confirmed — ${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px;">
          <h2 style="color: #059669; margin-top: 0;">Thank You for Your Order!</h2>
          <p>Your order reference number is <strong>${order.orderNumber}</strong>.</p>

          <h3>Order Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 8px; text-align: left;">Product</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 16px; border-top: 2px solid #eee; padding-top: 12px; text-align: right;">
            <p>Subtotal: <strong>${formatPrice(order.subtotal)}</strong></p>
            <p>Shipping Fee: <strong>${order.shippingFee === 0 ? "FREE" : formatPrice(order.shippingFee)}</strong></p>
            <h3 style="color: #059669;">Total Amount: ${formatPrice(order.totalAmount)}</h3>
          </div>

          <p style="color: #6b7280; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">
            NovaStore E-Commerce • Dhaka, Bangladesh
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }
}

export async function sendOrderShippedEmail(order: IOrder, recipientEmail: string, note?: string) {
  if (!recipientEmail || !process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({
      from: "NovaStore <onboarding@resend.dev>",
      to: recipientEmail,
      subject: `Your order ${order.orderNumber} has shipped!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px;">
          <h2 style="color: #2563eb; margin-top: 0;">Order Shipped 🎉</h2>
          <p>Great news! Your order <strong>${order.orderNumber}</strong> is on its way to your delivery address.</p>
          ${note ? `<p style="background: #eff6ff; padding: 12px; border-radius: 8px; font-weight: bold;">Tracking Note: ${note}</p>` : ""}
          <p>Expected delivery within 24-48 hours across Bangladesh.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send shipped email:", error);
  }
}
