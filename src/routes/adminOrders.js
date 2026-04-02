import express from 'express';
import Order from '../models/Order.js';
import { requireAdminAuth } from '../utils/adminAuthMiddleware.js';

const router = express.Router();

router.use(requireAdminAuth);

// GET /api/admin/orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// GET /api/admin/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error('Error fetching order', err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'shipped', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error('Error updating order status', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

export default router;

