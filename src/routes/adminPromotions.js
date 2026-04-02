import express from 'express';
import PromotionPackage from '../models/PromotionPackage.js';
import { requireAdminAuth } from '../utils/adminAuthMiddleware.js';

const router = express.Router();

router.use(requireAdminAuth);

// POST /api/admin/promotions
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id || !data.title || !data.category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existing = await PromotionPackage.findOne({ id: data.id });
    if (existing) {
      return res.status(409).json({ message: 'Promotion with this id already exists' });
    }
    const promo = await PromotionPackage.create(data);
    res.status(201).json(promo);
  } catch (err) {
    console.error('Error creating promotion', err);
    res.status(500).json({ message: 'Failed to create promotion' });
  }
});

// PUT /api/admin/promotions/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await PromotionPackage.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Error updating promotion', err);
    res.status(500).json({ message: 'Failed to update promotion' });
  }
});

// DELETE /api/admin/promotions/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await PromotionPackage.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    res.json({ message: 'Promotion deleted' });
  } catch (err) {
    console.error('Error deleting promotion', err);
    res.status(500).json({ message: 'Failed to delete promotion' });
  }
});

export default router;

