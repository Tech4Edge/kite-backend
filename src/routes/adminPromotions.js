import express from "express";
import PromotionPackage from "../models/PromotionPackage.js";
import { requireAdminAuth } from "../utils/adminAuthMiddleware.js";
import multer from "multer";
import path from "path";
import { getUploadsSubDir } from "../utils/uploadsPath.js";

const router = express.Router();
const uploadsDir = getUploadsSubDir("promotions");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path
      .basename(file.originalname || "image", ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

function parseJsonField(value, fallback = []) {
  if (value == null || value === "") return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed;
  } catch {
    return fallback;
  }
}

function toBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || value === "")
    return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

function toNumber(value, defaultValue = 0) {
  if (value === undefined || value === null || value === "")
    return defaultValue;
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
}

function buildFileUrl(req, file) {
  const forwardedProto = (req.get("x-forwarded-proto") || "")
    .split(",")[0]
    .trim();
  const protocol = forwardedProto || req.protocol;
  return `${protocol}://${req.get("host")}/uploads/promotions/${file.filename}`;
}

function buildPayload(req) {
  const body = req.body || {};
  const files = req.files || {};
  const unifiedImageFiles = files.promotionImages || [];
  const primaryImageFile = unifiedImageFiles[0] || files.image?.[0];
  const galleryFiles = unifiedImageFiles.length
    ? unifiedImageFiles.slice(1)
    : files.images || [];
  const items = parseJsonField(body.items, []);

  const totalQuantityFromItems = items.reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0),
    0,
  );
  const totalPriceFromItems = items.reduce(
    (sum, item) =>
      sum + (Number(item?.quantity) || 0) * (Number(item?.price) || 0),
    0,
  );

  return {
    id: body.id,
    title: body.title,
    category: body.category,
    description: body.description || "",
    image: primaryImageFile
      ? buildFileUrl(req, primaryImageFile)
      : body.image || "",
    images: galleryFiles.length
      ? galleryFiles.map((f) => buildFileUrl(req, f))
      : parseJsonField(body.images, []),
    items,
    totalQuantity: items.length
      ? totalQuantityFromItems
      : toNumber(body.totalQuantity, 0),
    totalPrice: items.length
      ? totalPriceFromItems
      : toNumber(body.totalPrice, 0),
    displayOrder: toNumber(body.displayOrder, 0),
    isActive: toBoolean(body.isActive, true),
  };
}

router.use(requireAdminAuth);

// GET /api/admin/promotions
router.get("/", async (req, res) => {
  try {
    const promos = await PromotionPackage.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    res.json(promos);
  } catch (err) {
    console.error("Error fetching promotions", err);
    res.status(500).json({ message: "Failed to fetch promotions" });
  }
});

// POST /api/admin/promotions
router.post(
  "/",
  upload.fields([
    { name: "promotionImages", maxCount: 10 },
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const data = buildPayload(req);
      if (!data.id || !data.title || !data.category) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const existing = await PromotionPackage.findOne({ id: data.id });
      if (existing) {
        return res
          .status(409)
          .json({ message: "Promotion with this id already exists" });
      }
      const promo = await PromotionPackage.create(data);
      res.status(201).json(promo);
    } catch (err) {
      console.error("Error creating promotion", err);
      res.status(500).json({ message: "Failed to create promotion" });
    }
  },
);

// PUT /api/admin/promotions/:id
router.put(
  "/:id",
  upload.fields([
    { name: "promotionImages", maxCount: 10 },
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const data = buildPayload(req);
      const existing = await PromotionPackage.findOne({ id: req.params.id });
      if (!existing) {
        return res.status(404).json({ message: "Promotion not found" });
      }

      if (!req.files?.promotionImages?.length && !req.files?.image?.length) {
        data.image = data.image || existing.image;
      }
      if (!req.files?.promotionImages?.length && !req.files?.images?.length) {
        data.images =
          Array.isArray(data.images) && data.images.length
            ? data.images
            : existing.images || [];
      }

      const updated = await PromotionPackage.findOneAndUpdate(
        { id: req.params.id },
        data,
        { new: true },
      );
      res.json(updated);
    } catch (err) {
      console.error("Error updating promotion", err);
      res.status(500).json({ message: "Failed to update promotion" });
    }
  },
);

// DELETE /api/admin/promotions/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await PromotionPackage.findOneAndDelete({
      id: req.params.id,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    res.json({ message: "Promotion deleted" });
  } catch (err) {
    console.error("Error deleting promotion", err);
    res.status(500).json({ message: "Failed to delete promotion" });
  }
});

export default router;
