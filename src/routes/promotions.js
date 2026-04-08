import express from "express";
import PromotionPackage from "../models/PromotionPackage.js";

const router = express.Router();

function normalizeMediaUrl(url, req) {
  if (!url || typeof url !== "string") return url;
  const uploadPathMatch = url.match(/\/uploads\/(products|promotions)\/.+$/i);
  if (!uploadPathMatch) return url;
  const normalizedPath = uploadPathMatch[0].replace(/\\/g, "/");
  const forwardedProto = (req.get("x-forwarded-proto") || "")
    .split(",")[0]
    .trim();
  const protocol = forwardedProto || req.protocol;
  return `${protocol}://${req.get("host")}${normalizedPath}`;
}

function normalizePromotionMedia(promo, req) {
  if (!promo || typeof promo !== "object") return promo;
  return {
    ...promo,
    image: normalizeMediaUrl(promo.image, req),
    images: Array.isArray(promo.images)
      ? promo.images.map((item) => normalizeMediaUrl(item, req))
      : promo.images,
  };
}

// GET /api/promotions
router.get("/", async (req, res) => {
  try {
    const onlyActive = req.query.active !== "false";
    const query = onlyActive ? { isActive: true } : {};
    const promos = await PromotionPackage.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    res.json(promos.map((item) => normalizePromotionMedia(item, req)));
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
    res.json(normalizePromotionMedia(promo, req));
  } catch (err) {
    console.error("Error fetching promotion", err);
    res.status(500).json({ message: "Failed to fetch promotion" });
  }
});

export default router;
