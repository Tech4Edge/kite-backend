import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import PromotionPackage from '../models/PromotionPackage.js';
import { sendOrderEmail } from '../utils/email.js';

const router = express.Router();
const PHONE_REGEX = /^(?:\+92|92|0)3\d{9}$/;

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const {
      type,
      productId,
      promotionId,
      selectedSkuOrSize,
      quantity,
      customerName,
      phone,
      email,
      address,
      city,
      note,
      paymentMethod,
    } = req.body;

    if (!['product', 'promotion'].includes(type)) {
      return res.status(400).json({ message: 'Invalid order type' });
    }
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 1000) {
      return res.status(400).json({ message: 'Quantity must be an integer between 1 and 1000' });
    }

    const normalizedCustomerName = String(customerName || '').trim();
    const normalizedAddress = String(address || '').trim();
    const normalizedCity = String(city || '').trim();
    const normalizedPhone = String(phone || '').replace(/[\s()-]/g, '');
    if (!PHONE_REGEX.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    if (!normalizedCustomerName || !normalizedAddress || !normalizedCity || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required customer fields' });
    }

    if (!['COD', 'Easypaisa', 'JazzCash'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    let productOrPromotion = null;
    if (type === 'product') {
      if (!productId) {
        return res.status(400).json({ message: 'productId is required for product orders' });
      }
      productOrPromotion = await Product.findOne({ id: productId }).lean();
      if (!productOrPromotion) {
        return res.status(404).json({ message: 'Product not found' });
      }
    } else {
      if (!promotionId) {
        return res.status(400).json({ message: 'promotionId is required for promotion orders' });
      }
      productOrPromotion = await PromotionPackage.findOne({ id: promotionId }).lean();
      if (!productOrPromotion) {
        return res.status(404).json({ message: 'Promotion not found' });
      }
    }

    const order = await Order.create({
      type,
      productId: type === 'product' ? productId : undefined,
      promotionId: type === 'promotion' ? promotionId : undefined,
      selectedSkuOrSize,
      quantity: parsedQuantity,
      customerName: normalizedCustomerName,
      phone: normalizedPhone,
      email,
      address: normalizedAddress,
      city: normalizedCity,
      note,
      paymentMethod,
    });

    // Fire-and-forget email; errors shouldn't block order creation
    sendOrderEmail(order.toObject(), productOrPromotion).catch((err) => {
      console.error('Failed to send order email', err);
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Error creating order', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

export default router;

