import express from "express";
import Product from "../models/Product.js";
import { requireAdminAuth } from "../utils/adminAuthMiddleware.js";
import multer from "multer";
import path from "path";
import { getUploadsSubDir } from "../utils/uploadsPath.js";

const router = express.Router();
const uploadsDir = getUploadsSubDir("products");

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
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB each
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
  return `${req.protocol}://${req.get("host")}/uploads/products/${file.filename}`;
}

function buildPayload(req) {
  const body = req.body || {};
  const files = req.files || {};
  const unifiedImageFiles = files.productImages || [];
  const primaryImageFile = unifiedImageFiles[0] || files.image?.[0];
  const galleryFiles = unifiedImageFiles.length
    ? unifiedImageFiles.slice(1)
    : files.images || [];

  return {
    id: body.id,
    title: body.title,
    category: body.category,
    productType: body.productType || "general",
    navGroup: body.navGroup || "",
    iconType: body.iconType || null,
    description: body.description || "",
    image: primaryImageFile
      ? buildFileUrl(req, primaryImageFile)
      : body.image || "",
    images: galleryFiles.length
      ? galleryFiles.map((f) => buildFileUrl(req, f))
      : parseJsonField(body.images, []),
    color: body.color || "",
    tagline: body.tagline || "",
    features: parseJsonField(body.features, []),
    variants: parseJsonField(body.variants, []),
    brands: parseJsonField(body.brands, []),
    sizes: parseJsonField(body.sizes, []),
    skus: parseJsonField(body.skus, []),
    facilities: parseJsonField(body.facilities, []),
    services: body.services || "",
    displayOrder: toNumber(body.displayOrder, 0),
    isActive: toBoolean(body.isActive, true),
    showOnLanding: toBoolean(body.showOnLanding, true),
    showInProductsPage: toBoolean(body.showInProductsPage, true),
    showInNavbar: toBoolean(body.showInNavbar, true),
  };
}

// All routes here require admin auth
router.use(requireAdminAuth);

// GET /api/admin/products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// POST /api/admin/products
router.post(
  "/",
  upload.fields([
    { name: "productImages", maxCount: 10 },
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const data = buildPayload(req);
      if (!data.id || !data.title || !data.category) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const existing = await Product.findOne({ id: data.id });
      if (existing) {
        return res
          .status(409)
          .json({ message: "Product with this id already exists" });
      }
      const product = await Product.create(data);
      res.status(201).json(product);
    } catch (err) {
      console.error("Error creating product", err);
      res.status(500).json({ message: "Failed to create product" });
    }
  },
);

// PUT /api/admin/products/:id
router.put(
  "/:id",
  upload.fields([
    { name: "productImages", maxCount: 10 },
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const data = buildPayload(req);
      const existing = await Product.findOne({ id: req.params.id });
      if (!existing) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!req.files?.image?.length) data.image = data.image || existing.image;
      if (!req.files?.images?.length)
        data.images =
          Array.isArray(data.images) && data.images.length
            ? data.images
            : existing.images || [];

      const updated = await Product.findOneAndUpdate(
        { id: req.params.id },
        data,
        { new: true },
      );
      res.json(updated);
    } catch (err) {
      console.error("Error updating product", err);
      res.status(500).json({ message: "Failed to update product" });
    }
  },
);

// DELETE /api/admin/products/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("Error deleting product", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

export default router;
