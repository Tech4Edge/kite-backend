import nodemailer from 'nodemailer';

export function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
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

export async function sendOrderEmail(order, productOrPromotion) {
  const transporter = createTransporter();

  const clientEmail = process.env.CLIENT_ORDER_EMAIL;
  if (!clientEmail) {
    console.warn('CLIENT_ORDER_EMAIL not set; skipping email send');
    return;
  }

  const isProduct = order.type === 'product';
  const subject = isProduct
    ? `New product order: ${productOrPromotion?.title || order.productId}`
    : `New promotion order: ${productOrPromotion?.title || order.promotionId}`;

  const lines = [];
  lines.push(`Order Type: ${order.type}`);
  if (isProduct) {
    lines.push(`Product: ${productOrPromotion?.title || order.productId}`);
  } else {
    lines.push(`Promotion Package: ${productOrPromotion?.title || order.promotionId}`);
  }
  if (order.selectedSkuOrSize) {
    lines.push(`Selected SKU/Size: ${order.selectedSkuOrSize}`);
  }
  lines.push('');
  lines.push('Customer Details:');
  lines.push(`Name: ${order.customerName}`);
  lines.push(`Phone: ${order.phone}`);
  if (order.email) lines.push(`Email: ${order.email}`);
  lines.push(`City: ${order.city}`);
  lines.push(`Address: ${order.address}`);
  if (order.note) lines.push(`Note: ${order.note}`);
  lines.push('');
  lines.push(`Payment Method: ${order.paymentMethod}`);
  lines.push(`Status: ${order.status}`);
  lines.push('');
  lines.push(`Created At: ${order.createdAt}`);

  const text = lines.join('\n');

  await transporter.sendMail({
    from: process.env.SMTP_FROM || clientEmail,
    to: clientEmail,
    subject,
    text,
  });
}

