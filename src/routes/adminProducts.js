import express from 'express';
import Product from '../models/Product.js';
import { requireAdminAuth } from '../utils/adminAuthMiddleware.js';

const router = express.Router();

// All routes here require admin auth
router.use(requireAdminAuth);

// POST /api/admin/products
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id || !data.title || !data.category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existing = await Product.findOne({ id: data.id });
    if (existing) {
      return res.status(409).json({ message: 'Product with this id already exists' });
    }
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product', err);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// PUT /api/admin/products/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Error updating product', err);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product', err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;

