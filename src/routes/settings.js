import express from 'express';
import { requireAdminAuth } from '../utils/adminAuthMiddleware.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// GET /api/settings - Get settings (public, so checkout can fetch without auth)
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ defaultShippingCost: 150 });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/settings - Update settings (admin only)
router.put('/', requireAdminAuth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ defaultShippingCost: 150 });
    }
    if (req.body.defaultShippingCost !== undefined) {
      settings.defaultShippingCost = req.body.defaultShippingCost;
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
