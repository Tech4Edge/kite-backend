import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

function normalizeIdentifier(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const onlyActive = req.query.active !== "false";
    const query = onlyActive ? { isActive: true } : {};
    const products = await Product.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const requested = req.params.id;
    const normalizedRequested = normalizeIdentifier(requested);

    let product = await Product.findOne({
      $or: [{ id: requested }, { slug: requested }],
    }).lean();

    // Backward-compatible fallback for legacy records without a dedicated slug field.
    if (!product) {
      const candidates = await Product.find().lean();
      product =
        candidates.find((item) => {
          const idMatch = normalizeIdentifier(item.id) === normalizedRequested;
          const slugMatch =
            normalizeIdentifier(item.slug) === normalizedRequested;
          const titleMatch =
            normalizeIdentifier(item.title) === normalizedRequested;
          return idMatch || slugMatch || titleMatch;
        }) || null;
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching product", err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

export default router;
