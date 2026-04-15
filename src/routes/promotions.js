import express from "express";
import PromotionPackage from "../models/PromotionPackage.js";

const router = express.Router();

// GET /api/promotions
router.get("/", async (req, res) => {
  try {
    const onlyActive = req.query.active !== "false";
    const query = onlyActive ? { isActive: true } : {};
    const promos = await PromotionPackage.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    res.json(promos);
  } catch (err) {
    console.error("Error fetching promotions", err);
    res.status(500).json({ message: "Failed to fetch promotions" });
  }
});

// GET /api/promotions/:id
router.get("/:id", async (req, res) => {
  try {
    const promo = await PromotionPackage.findOne({ id: req.params.id }).lean();
    if (!promo) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    res.json(promo);
  } catch (err) {
    console.error("Error fetching promotion", err);
    res.status(500).json({ message: "Failed to fetch promotion" });
  }
});

export default router;
