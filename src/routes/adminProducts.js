import express from "express";
import Product from "../models/Product.js";
import { requireAdminAuth } from "../utils/adminAuthMiddleware.js";
import multer from "multer";
import {
  isCloudinaryConfigured,
  uploadImageBuffer,
} from "../utils/cloudinary.js";

const router = express.Router();
const parseMultipartForm = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 10,
  },
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

function pickProductImageFiles(files = []) {
  const allFiles = Array.isArray(files) ? files : [];
  const productImages = allFiles.filter((file) => file.fieldname === "productImages");
  const image = allFiles.find((file) => file.fieldname === "image") || null;
  const images = allFiles.filter((file) => file.fieldname === "images");

  const primaryImage = productImages[0] || image;
  const galleryImages = productImages.length ? productImages.slice(1) : images;

  return { primaryImage, galleryImages };
}

async function applyCloudinaryUploads(req, payload) {
  const { primaryImage, galleryImages } = pickProductImageFiles(req.files);
  if (!primaryImage && !galleryImages.length) return payload;

  if (!isCloudinaryConfigured()) {
    const error = new Error("Cloudinary credentials are missing.");
    error.statusCode = 500;
    throw error;
  }

  if (primaryImage) {
    payload.image = await uploadImageBuffer(primaryImage, { folder: "kite/products" });
  }

  if (galleryImages.length) {
    payload.images = await Promise.all(
      galleryImages.map((file) =>
        uploadImageBuffer(file, { folder: "kite/products/gallery" }),
      ),
    );
  }

  return payload;
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

function buildPayload(req) {
  const body = req.body || {};

  return {
    id: body.id,
    title: body.title,
    category: body.category,
    productType: body.productType || "general",
    navGroup: body.navGroup || "",
    iconType: body.iconType || null,
    description: body.description || "",
    // Expect pre-uploaded Cloudinary URLs/public links from client.
    image: parseImage(body.image),
    images: parseImagesField(body.images),
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
  parseMultipartForm,
  async (req, res) => {
    try {
      const data = await applyCloudinaryUploads(req, buildPayload(req));
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
      res
        .status(err.statusCode || 500)
        .json({ message: err.message || "Failed to create product" });
    }
  },
);

// PUT /api/admin/products/:id
router.put(
  "/:id",
  parseMultipartForm,
  async (req, res) => {
    try {
      const data = await applyCloudinaryUploads(req, buildPayload(req));
      const existing = await Product.findOne({ id: req.params.id });
      if (!existing) {
        return res.status(404).json({ message: "Product not found" });
      }

      data.image = data.image || existing.image;
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
      res
        .status(err.statusCode || 500)
        .json({ message: err.message || "Failed to update product" });
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
