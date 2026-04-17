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

function getStatusColors(status) {
  switch (String(status || "").toLowerCase()) {
    case "confirmed":
      return { bg: "#E8FFF4", text: "#007A46" };
    case "shipped":
      return { bg: "#EAF5FF", text: "#005F99" };
    case "cancelled":
      return { bg: "#FFEDEE", text: "#A11A22" };
    case "pending":
    default:
      return { bg: "#FFF7E6", text: "#8A5A00" };
  }
}

function buildInfoRow(label, value) {
  return `
    <tr>
      <td style="padding: 9px 0; color: #666666; font-size: 14px; vertical-align: top; width: 160px;">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 9px 0; color: #222222; font-size: 14px; font-weight: 600; vertical-align: top;">
        ${escapeHtml(displayValue(value))}
      </td>
    </tr>
  `;
}

export async function sendOrderEmail(order, productOrPromotion) {
  const transporter = createTransporter();

  const adminOrderEmail =
    process.env.ADMIN_ORDER_EMAIL || process.env.CLIENT_ORDER_EMAIL;
  if (!adminOrderEmail) {
    console.warn(
      "ADMIN_ORDER_EMAIL (or CLIENT_ORDER_EMAIL) not set; skipping email send",
    );
    return;
  }

  const isProduct = order.type === "product";
  const itemName = isProduct
    ? productOrPromotion?.title || order.productId
    : productOrPromotion?.title || order.promotionId;
  const orderTypeLabel = isProduct ? "Product Order" : "Promotion Order";
  const subject = isProduct
    ? `New product order: ${itemName}`
    : `New promotion order: ${itemName}`;

  const orderId = displayValue(order._id || order.id || order.orderId);
  const createdAt = formatDateTime(order.createdAt);
  const paymentMethod = displayValue(order.paymentMethod);
  const status = displayValue(order.status || "pending");
  const selectedSkuOrSize = displayValue(order.selectedSkuOrSize);
  const adminPanelUrl = process.env.ADMIN_PANEL_URL || process.env.FRONTEND_URL;
  const logoUrl = "https://kitepk.com/logo.png";
  const phoneHref = displayValue(order.phone, "").replace(/[^\d+]/g, "");
  const emailHref = displayValue(order.email, "").trim();
  const statusColors = getStatusColors(status);

  const lines = [];
  lines.push(`Order ID: ${orderId}`);
  lines.push(`Order Type: ${orderTypeLabel}`);
  if (isProduct) {
    lines.push(`Product: ${itemName}`);
  } else {
    lines.push(`Promotion Package: ${itemName}`);
  }
  if (order.selectedSkuOrSize) {
    lines.push(`Selected SKU/Size: ${selectedSkuOrSize}`);
  }
  lines.push("");
  lines.push("Customer Details:");
  lines.push(`Name: ${order.customerName}`);
  lines.push(`Phone: ${order.phone}`);
  if (order.email) lines.push(`Email: ${order.email}`);
  lines.push(`City: ${order.city}`);
  lines.push(`Address: ${order.address}`);
  if (order.note) lines.push(`Note: ${order.note}`);
  lines.push("");
  lines.push(`Payment Method: ${order.paymentMethod}`);
  lines.push(`Status: ${order.status}`);
  lines.push("");
  lines.push(`Created At: ${createdAt}`);

  const text = lines.join("\n");

  const ctaMarkup = adminPanelUrl
    ? `
      <tr>
        <td align="center" style="padding: 6px 0 0 0;">
          <a href="${escapeHtml(adminPanelUrl)}" style="display: inline-block; background: #00AEEF; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.2px; padding: 12px 22px; border-radius: 999px;">
            Open Admin Panel
          </a>
        </td>
      </tr>
    `
    : "";

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(subject)}</title>
    </head>
    <body style="margin: 0; padding: 0; background: #F3F8FB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #222222;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #F3F8FB; padding: 28px 14px;">
        <tr>
          <td align="center">
            <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="max-width: 680px; width: 100%; background: #FFFFFF; border-radius: 18px; overflow: hidden; border: 1px solid #DDECF7; box-shadow: 0 8px 30px rgba(0, 56, 87, 0.08);">
              <tr>
                <td style="background: linear-gradient(135deg, #00AEEF 0%, #0095CC 100%); padding: 24px 26px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td valign="middle" style="width: 88px;">
                        <img src="${logoUrl}" alt="Kite" width="70" style="width: 70px; height: auto; display: block; border: 0; border-radius: 10px;" />
                      </td>
                      <td valign="middle" style="color: #FFFFFF;">
                        <div style="font-size: 22px; font-weight: 800; line-height: 1.2;">New Order Received</div>
                        <div style="font-size: 13px; opacity: 0.9; margin-top: 5px;">${escapeHtml(orderTypeLabel)} for Kite FMCG</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 20px 26px 0 26px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%;">
                    <tr>
                      <td style="padding-right: 8px; padding-bottom: 10px;">
                        <span style="display: inline-block; background: #EAF8FF; color: #005F8A; font-size: 12px; font-weight: 700; letter-spacing: 0.2px; padding: 7px 11px; border-radius: 999px;">${escapeHtml(orderTypeLabel)}</span>
                      </td>
                      <td style="padding-right: 8px; padding-bottom: 10px;">
                        <span style="display: inline-block; background: ${statusColors.bg}; color: ${statusColors.text}; font-size: 12px; font-weight: 700; letter-spacing: 0.2px; padding: 7px 11px; border-radius: 999px;">Status: ${escapeHtml(status)}</span>
                      </td>
                      <td style="padding-bottom: 10px;">
                        <span style="display: inline-block; background: #FFF0F8; color: #A61565; font-size: 12px; font-weight: 700; letter-spacing: 0.2px; padding: 7px 11px; border-radius: 999px;">Payment: ${escapeHtml(paymentMethod)}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 16px 26px 0 26px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #F8FCFF; border: 1px solid #DCEFFC; border-radius: 14px;">
                    <tr>
                      <td style="padding: 16px 18px;">
                        <div style="font-size: 13px; color: #00AEEF; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">Order Overview</div>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          ${buildInfoRow("Order ID", orderId)}
                          ${buildInfoRow(isProduct ? "Product" : "Promotion Package", itemName)}
                          ${order.selectedSkuOrSize ? buildInfoRow("Selected SKU/Size", selectedSkuOrSize) : ""}
                          ${buildInfoRow("Created At", createdAt)}
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 14px 26px 0 26px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #FFFFFF; border: 1px solid #E4E4E4; border-radius: 14px;">
                    <tr>
                      <td style="padding: 16px 18px;">
                        <div style="font-size: 13px; color: #00AEEF; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">Customer Details</div>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          ${buildInfoRow("Name", order.customerName)}
                          ${buildInfoRow("Phone", order.phone)}
                          ${order.email ? buildInfoRow("Email", order.email) : ""}
                          ${buildInfoRow("City", order.city)}
                          ${buildInfoRow("Address", order.address)}
                          ${order.note ? buildInfoRow("Note", order.note) : ""}
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              ${ctaMarkup}

              <tr>
                <td style="padding: 20px 26px 26px 26px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #EAEAEA;">
                    <tr>
                      <td style="padding-top: 16px; font-size: 12px; color: #7A7A7A; line-height: 1.65;">
                        This is an automated order notification from Kite FMCG.<br />
                        ${phoneHref ? `Customer phone: <a href="tel:${escapeHtml(phoneHref)}" style="color: #00AEEF; text-decoration: none;">${escapeHtml(order.phone)}</a><br />` : ""}
                        ${emailHref ? `Customer email: <a href="mailto:${escapeHtml(emailHref)}" style="color: #00AEEF; text-decoration: none;">${escapeHtml(emailHref)}</a>` : ""}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || adminOrderEmail,
    to: adminOrderEmail,
    subject,
    text,
    html,
  });
}
