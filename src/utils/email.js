import nodemailer from "nodemailer";

export function createTransporter() {
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secureFromEnv = String(process.env.SMTP_SECURE || "").toLowerCase();
    const secure = secureFromEnv ? secureFromEnv === "true" : port === 465;

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: JSON transport for dev so we don't send real emails accidentally
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

const htmlEscapeMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => htmlEscapeMap[ch]);
}

function displayValue(value, fallback = "-") {
  return value == null || value === "" ? fallback : String(value);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getOrderTypeLabel(order) {
  const isProduct = order.type === "product";
  const isCart = order.type === "cart";
  return isCart ? "Cart Order" : (isProduct ? "Product Order" : "Promotion Order");
}

function getItemName(order, productOrPromotion) {
  const isProduct = order.type === "product";
  const isCart = order.type === "cart";
  return isCart
    ? "Cart Order"
    : (isProduct
      ? productOrPromotion?.title || order.productId
      : productOrPromotion?.title || order.promotionId);
}

function buildOrderDetailsText(order, productOrPromotion) {
  const isProduct = order.type === "product";
  const isCart = order.type === "cart";
  const itemName = getItemName(order, productOrPromotion);
  const orderTypeLabel = getOrderTypeLabel(order);

  const lines = [];
  lines.push(`Order ID: ${displayValue(order._id || order.id || order.orderId)}`);
  lines.push(`Order Type: ${orderTypeLabel}`);
  if (isCart) {
    lines.push(`Cart Items:`);
    (order.items || []).forEach((item, i) => {
      if (item.itemType === 'promotion') {
        lines.push(`  ${i + 1}. Promotion: ${item.promotionId}`);
      } else {
        lines.push(`  ${i + 1}. Product: ${item.productId} ${item.brandName ? `(${item.brandName})` : ''}`);
        lines.push(`     Variant: ${item.selectedVariant || 'N/A'}`);
      }
      lines.push(`     Qty: ${item.quantity}`);
    });
  } else if (isProduct) {
    lines.push(`Product: ${itemName}`);
  } else {
    lines.push(`Promotion Package: ${itemName}`);
  }
  if (!isCart && order.selectedSkuOrSize) {
    lines.push(`Selected SKU/Size: ${order.selectedSkuOrSize}`);
  }
  if (!isCart) {
    lines.push(`Quantity: ${displayValue(order.quantity, 1)}`);
  }
  if (order.shippingCost != null) lines.push(`Shipping Cost: Rs ${order.shippingCost}`);
  if (order.totalAmount != null) lines.push(`Total Amount: Rs ${order.totalAmount}`);
  
  return lines.join("\n");
}

export async function sendOrderEmail(order, productOrPromotion) {
  const transporter = createTransporter();

  const adminOrderEmail = process.env.ADMIN_ORDER_EMAIL || process.env.CLIENT_ORDER_EMAIL;
  if (!adminOrderEmail) {
    console.warn("ADMIN_ORDER_EMAIL not set; skipping email send");
    return;
  }

  const isCart = order.type === "cart";
  const itemName = getItemName(order, productOrPromotion);
  const orderTypeLabel = getOrderTypeLabel(order);
  const subject = isCart ? `New Cart Order` : (order.type === "product" ? `New product order: ${itemName}` : `New promotion order: ${itemName}`);

  const createdAt = formatDateTime(order.createdAt);
  const paymentMethod = displayValue(order.paymentMethod);
  const adminPanelUrl = process.env.ADMIN_PANEL_URL || process.env.FRONTEND_URL;

  const orderDetailsText = buildOrderDetailsText(order, productOrPromotion);

  const buildHtml = (title, showAdminBtn) => `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(subject)}</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #fafafa; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; border: 1px solid #eaeaea;">
          <h2 style="margin-top: 0; color: #111;">${escapeHtml(title)}</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.5;">
            <strong>Order Type:</strong> ${escapeHtml(orderTypeLabel)}<br>
            <strong>Status:</strong> ${escapeHtml(order.status || 'pending')}<br>
            <strong>Payment:</strong> ${escapeHtml(paymentMethod)}<br>
            <strong>Date:</strong> ${escapeHtml(createdAt)}
          </p>
          
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;">
          
          <h3 style="margin-top: 0; color: #111;">Order Summary</h3>
          <pre style="background: #f9f9f9; padding: 15px; border-radius: 6px; font-family: inherit; font-size: 14px; color: #444; border: 1px solid #eee; overflow-x: auto; white-space: pre-wrap;">${escapeHtml(orderDetailsText)}</pre>
          
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;">
          
          <h3 style="margin-top: 0; color: #111;">Customer Details</h3>
          <p style="color: #555; font-size: 15px; line-height: 1.5;">
            <strong>Name:</strong> ${escapeHtml(order.customerName)}<br>
            <strong>Phone:</strong> ${escapeHtml(order.phone)}<br>
            ${order.email ? `<strong>Email:</strong> ${escapeHtml(order.email)}<br>` : ''}
            <strong>City:</strong> ${escapeHtml(order.city)}<br>
            <strong>Address:</strong> ${escapeHtml(order.address)}<br>
            ${order.note ? `<strong>Note:</strong> ${escapeHtml(order.note)}` : ''}
          </p>
          
          ${showAdminBtn && adminPanelUrl ? `
          <div style="margin-top: 30px; text-align: center;">
            <a href="${escapeHtml(adminPanelUrl)}" style="background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">
              View in Admin Panel
            </a>
          </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;

  // Admin Email
  await transporter.sendMail({
    from: process.env.SMTP_FROM || adminOrderEmail,
    to: adminOrderEmail,
    subject,
    text: `New Order Received\n\n` + orderDetailsText,
    html: buildHtml("New Order Received", true),
  });

  // Customer Email
  if (order.email) {
    const customerSubject = isCart ? "Your Kite Order Confirmation" : "Your Order Confirmation: " + itemName;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || adminOrderEmail,
      to: order.email,
      subject: customerSubject,
      text: "Thank you for your order!\n\n" + orderDetailsText,
      html: buildHtml("Your Order is Confirmed", false),
    });
  }
}

export async function sendStatusUpdateEmail(order) {
  const transporter = createTransporter();
  const adminOrderEmail = process.env.ADMIN_ORDER_EMAIL || process.env.CLIENT_ORDER_EMAIL || process.env.SMTP_FROM;

  if (!order.email) return; // Cannot send to customer if no email

  const subject = `Update on your Kite Order (${order._id || order.id})`;
  const orderDetailsText = buildOrderDetailsText(order, null);
  const paymentMethod = displayValue(order.paymentMethod);
  const createdAt = formatDateTime(order.createdAt);
  const orderTypeLabel = getOrderTypeLabel(order);

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(subject)}</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #fafafa; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; border: 1px solid #eaeaea;">
          <h2 style="margin-top: 0; color: #111;">Order Status Update</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Hi ${escapeHtml(order.customerName)},
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            The status of your order (<strong>${escapeHtml(order._id || order.id)}</strong>) has been updated to:
          </p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; text-align: center; font-size: 18px; font-weight: bold; color: #111; text-transform: uppercase; margin: 20px 0;">
            ${escapeHtml(order.status)}
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;">
          
          <h3 style="margin-top: 0; color: #111;">Order Summary</h3>
          <p style="color: #555; font-size: 15px; line-height: 1.5;">
            <strong>Order Type:</strong> ${escapeHtml(orderTypeLabel)}<br>
            <strong>Payment:</strong> ${escapeHtml(paymentMethod)}<br>
            <strong>Date:</strong> ${escapeHtml(createdAt)}
          </p>
          <pre style="background: #f9f9f9; padding: 15px; border-radius: 6px; font-family: inherit; font-size: 14px; color: #444; border: 1px solid #eee; overflow-x: auto; white-space: pre-wrap;">${escapeHtml(orderDetailsText)}</pre>
          
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;">

          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            If you have any questions, feel free to reply to this email.
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5; margin-top: 30px;">
            Thank you,<br>
            Kite FMCG
          </p>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: adminOrderEmail,
    to: order.email,
    subject,
    text: `Hi ${order.customerName},\n\nYour order (${order._id || order.id}) status has been updated to: ${order.status}.\n\nOrder Details:\n${orderDetailsText}\n\nThank you,\nKite FMCG`,
    html,
  });
}
