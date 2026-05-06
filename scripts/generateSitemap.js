import "../src/config/loadEnv.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";
import PromotionPackage from "../src/models/PromotionPackage.js";
import { connectToDatabase } from "../src/utils/db.js";

const SITE_URL = "https://kitepk.com";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, "../../kite-frontend/public/sitemap.xml");

function toIsoDate(value) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildUrlEntry(loc, lastmod, changefreq = "weekly", priority = "0.7") {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
    `    <changefreq>${escapeXml(changefreq)}</changefreq>`,
    `    <priority>${escapeXml(priority)}</priority>`,
    "  </url>",
  ].join("\n");
}

async function generateSitemap() {
  const staticRoutes = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/about", changefreq: "monthly", priority: "0.8" },
    { path: "/products", changefreq: "daily", priority: "0.9" },
    { path: "/promotions-packages", changefreq: "weekly", priority: "0.8" },
    { path: "/export", changefreq: "weekly", priority: "0.7" },
    { path: "/export/safety-matches", changefreq: "weekly", priority: "0.7" },
    { path: "/export/wooden-splints", changefreq: "weekly", priority: "0.7" },
    { path: "/contact", changefreq: "monthly", priority: "0.6" },
  ];

  const now = new Date().toISOString();
  const allEntries = [];
  let products = [];
  let promotions = [];

  for (const route of staticRoutes) {
    const loc = `${SITE_URL}${route.path}`;
    allEntries.push(buildUrlEntry(loc, now, route.changefreq, route.priority));
  }

  try {
    await connectToDatabase();
    [products, promotions] = await Promise.all([
      Product.find({ isActive: true }).select("id updatedAt").lean(),
      PromotionPackage.find({ isActive: true }).select("id updatedAt").lean(),
    ]);
  } catch (error) {
    console.error(
      "Mongo query failed, generating sitemap with static URLs only:",
      error.message || error,
    );
  }

  for (const product of products) {
    if (!product?.id) continue;
    const loc = `${SITE_URL}/products/${encodeURIComponent(product.id)}`;
    allEntries.push(buildUrlEntry(loc, toIsoDate(product.updatedAt), "weekly", "0.8"));
  }

  for (const promotion of promotions) {
    if (!promotion?.id) continue;
    const loc = `${SITE_URL}/promotions-packages?package=${encodeURIComponent(promotion.id)}`;
    allEntries.push(buildUrlEntry(loc, toIsoDate(promotion.updatedAt), "weekly", "0.7"));
  }

  try {
    const sitemap = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...allEntries,
      "</urlset>",
      "",
    ].join("\n");

    await fs.writeFile(outputPath, sitemap, "utf8");
    console.log(`Sitemap generated at ${outputPath}`);
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

generateSitemap();
