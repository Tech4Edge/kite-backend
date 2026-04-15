import express from "express";
import PromotionPackage from "../models/PromotionPackage.js";
import { requireAdminAuth } from "../utils/adminAuthMiddleware.js";
import multer from "multer";
import {
  isCloudinaryConfigured,
  uploadImageBuffer,
} from "../utils/cloudinary.js";

const router = express.Router();
const parseMultipartForm = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
}).any();

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

function parseImage(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function parseImagesField(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  const parsed = parseJsonField(value, []);
  if (Array.isArray(parsed)) {
    return parsed.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return [];
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

function pickPromotionImageFiles(files = []) {
  const allFiles = Array.isArray(files) ? files : [];
  const promotionImages = allFiles.filter(
    (file) => file.fieldname === "promotionImages",
  );
  const image = allFiles.find((file) => file.fieldname === "image") || null;
  const images = allFiles.filter((file) => file.fieldname === "images");

  const primaryImage = promotionImages[0] || image;
  const galleryImages = promotionImages.length ? promotionImages.slice(1) : images;

  return { primaryImage, galleryImages };
}

async function applyCloudinaryUploads(req, payload) {
  const { primaryImage, galleryImages } = pickPromotionImageFiles(req.files);
  if (!primaryImage && !galleryImages.length) {
    return { payload, hasPrimaryUpload: false, hasGalleryUpload: false };
  }

  if (!isCloudinaryConfigured()) {
    const error = new Error("Cloudinary credentials are missing.");
    error.statusCode = 500;
    throw error;
  }

  if (primaryImage) {
    payload.image = await uploadImageBuffer(primaryImage, {
      folder: "kite/promotions",
    });
  }

  if (galleryImages.length) {
    payload.images = await Promise.all(
      galleryImages.map((file) =>
        uploadImageBuffer(file, { folder: "kite/promotions/gallery" }),
      ),
    );
  }

  return {
    payload,
    hasPrimaryUpload: Boolean(primaryImage),
    hasGalleryUpload: galleryImages.length > 0,
  };
}

function buildPayload(req) {
  const body = req.body || {};
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
    image: parseImage(body.image),
    images: parseImagesField(body.images),
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
  parseMultipartForm,
  async (req, res) => {
    try {
      const { payload: data } = await applyCloudinaryUploads(req, buildPayload(req));
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
      res
        .status(err.statusCode || 500)
        .json({ message: err.message || "Failed to create promotion" });
    }
  },
);

// PUT /api/admin/promotions/:id
router.put(
  "/:id",
  parseMultipartForm,
  async (req, res) => {
    try {
      const { payload: data, hasPrimaryUpload, hasGalleryUpload } =
        await applyCloudinaryUploads(req, buildPayload(req));
      const existing = await PromotionPackage.findOne({ id: req.params.id });
      if (!existing) {
        return res.status(404).json({ message: "Promotion not found" });
      }

      if (!hasPrimaryUpload) {
        data.image = data.image || existing.image;
      }
      if (!hasGalleryUpload) {
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
      res
        .status(err.statusCode || 500)
        .json({ message: err.message || "Failed to update promotion" });
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
