import "../src/config/loadEnv.js";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";
import { connectToDatabase } from "../src/utils/db.js";

const products = [
  {
    id: "kite-matches",
    category: "Safety Matches",
    title: "Kite Safety Matches",
    iconType: "fire",
    productType: "matches",
    navGroup: "Safety Matches",
    description:
      "Our flagship premium brand and Pakistan's leading export match. Known for reliability and superior ignition, Kite represents over 50 years of manufacturing excellence.",
    image: "",
    color: "#ED028C",
    features: [
      "Premium Quality",
      "Damp proof",
      "Carborised sticks",
      "Extra sticks",
      "Reliable always",
    ],
    variants: [
      { name: "LARGE", detail: "58 Sticks", packing: "500 pcs/ctn", price: null },
      { name: "CLASSIC", detail: "45 Sticks", packing: "500 pcs/ctn", price: null },
      { name: "REGULAR", detail: "42 Sticks", packing: "1000 pcs/ctn", price: null },
      { name: "SMALL", detail: "32 Sticks", packing: "1000 pcs/ctn", price: null },
    ],
    services: "Global export and bulk wholesale available.",
  },
  {
    id: "bird-matches",
    category: "Safety Matches",
    title: "Bird Safety Matches",
    iconType: "fire",
    productType: "matches",
    navGroup: "Safety Matches",
    description:
      "A trusted household name providing consistent quality and ease of use. Bird matches are designed for daily domestic utility with high safety standards.",
    image: "",
    color: "#ED028C",
    features: [
      "Reliable ignition",
      "Damp proof",
      "Strong sticks",
      "Standard count",
      "Safe handling",
    ],
    variants: [
      { name: "LARGE", detail: "58 Sticks", packing: "500 pcs/ctn", price: null },
      { name: "CLASSIC", detail: "45 Sticks", packing: "500 pcs/ctn", price: null },
      { name: "REGULAR", detail: "42 Sticks", packing: "1000 pcs/ctn", price: null },
      { name: "SMALL", detail: "32 Sticks", packing: "1000 pcs/ctn", price: null },
    ],
    services: "Local distribution and wholesale.",
  },
  {
    id: "olympia-matches",
    category: "Safety Matches",
    title: "Olympia Safety Matches",
    iconType: "fire",
    productType: "matches",
    navGroup: "Safety Matches",
    description:
      "Designed for high-performance and durability. Olympia matches undergo rigorous quality checks to ensure they perform in various environmental conditions.",
    image: "",
    color: "#ED028C",
    features: [
      "High performance",
      "Sturdy sticks",
      "Damp proof",
      "Precision box striking surface",
      "Eco-friendly materials",
    ],
    variants: [
      { name: "LARGE", detail: "58 Sticks", packing: "500 pcs/ctn", price: null },
      { name: "CLASSIC", detail: "45 Sticks", packing: "500 pcs/ctn", price: null },
      { name: "REGULAR", detail: "42 Sticks", packing: "1000 pcs/ctn", price: null },
      { name: "SMALL", detail: "32 Sticks", packing: "1000 pcs/ctn", price: null },
    ],
    services: "Regional supply and bulk orders.",
  },
  {
    id: "party-matches",
    category: "Safety Matches",
    title: "Party Safety Matches",
    iconType: "fire",
    productType: "matches",
    navGroup: "Safety Matches",
    description:
      "A vibrant and reliable choice for every occasion. Party matches provide the perfect balance of quantity and quality for busy households.",
    image: "",
    color: "#ED028C",
    features: [
      "Fast ignition",
      "Easy strike",
      "Damp proof",
      "Compact packaging",
      "Uniform stick size",
    ],
    variants: [
      { name: "LARGE", detail: "58 Sticks", packing: "500 pcs/ctn", price: null },
      { name: "CLASSIC", detail: "45 Sticks", packing: "500 pcs/ctn", price: null },
      { name: "REGULAR", detail: "42 Sticks", packing: "1000 pcs/ctn", price: null },
      { name: "SMALL", detail: "32 Sticks", packing: "1000 pcs/ctn", price: null },
    ],
    services: "Wholesale and retail supply.",
  },
  {
    id: "tanga-matches",
    category: "Safety Matches",
    title: "Tanga Safety Matches",
    iconType: "fire",
    productType: "matches",
    navGroup: "Safety Matches",
    description:
      "Our heritage-focused brand that offers traditional reliability. Tanga is known for its sturdy build and consistent strike-to-flame ratio.",
    image: "",
    color: "#ED028C",
    features: [
      "Classic design",
      "Extra sturdy sticks",
      "Reliable chemical coating",
      "Damp proof",
      "Traditional count",
    ],
    variants: [
      { name: "LARGE", detail: "58 Sticks", packing: "500 pcs/ctn", price: null },
      { name: "CLASSIC", detail: "45 Sticks", packing: "500 pcs/ctn", price: null },
      { name: "REGULAR", detail: "42 Sticks", packing: "1000 pcs/ctn", price: null },
      { name: "SMALL", detail: "32 Sticks", packing: "1000 pcs/ctn", price: null },
    ],
    services: "Local market distribution.",
  },
  {
    id: "kite-glow",
    category: "Detergents",
    title: "Kite Glow Detergent",
    iconType: "layer",
    productType: "detergents",
    navGroup: "Detergents",
    description:
      "Flagship brand launched in March 2025 with Triple Enzyme technology. Premium cleaning power with fabric care protection and color preservation.",
    image: "",
    color: "#00AEEF",
    features: [
      "Triple Enzyme tech",
      "Tough stains removed",
      "Fabric care",
      "Color protection",
      "Long-lasting freshness",
    ],
    variants: [
      { name: "2 KG", detail: "2000 g", packing: "6 pcs/ctn", price: 550 },
      { name: "1 KG", detail: "1000 g", packing: "12 pcs/ctn", price: 300 },
      { name: "500 GM", detail: "500 g", packing: "24 pcs/ctn", price: 150 },
      { name: "RS.99", detail: "370 g", packing: "48 pcs/ctn", price: 99 },
      { name: "RS.50", detail: "175 g", packing: "96 pcs/ctn", price: 50 },
      { name: "RS.20", detail: "60 g", packing: "96 pcs/ctn", price: 20 },
      { name: "RS.10", detail: "30 g", packing: "144 pcs/ctn", price: 10 },
    ],
    services: "Private labeling and toll manufacturing services available.",
  },
  {
    id: "burq-action",
    category: "Detergents",
    title: "BURQ Action Detergent",
    iconType: "layer",
    productType: "detergents",
    navGroup: "Detergents",
    description:
      "Premium detergent with Colour Guard technology. Maintains color brightness while providing excellent cleaning power. Safe for skin and fabrics.",
    image: "",
    color: "#00AEEF",
    features: [
      "Colour Guard tech",
      "Powerful stain removal",
      "Fabric protection",
      "Color protection",
      "Skin friendly",
    ],
    variants: [
      { name: "2.3 KG", detail: "2300 g", packing: "6 pcs/ctn", price: 499 },
      { name: "1 KG", detail: "1000 g", packing: "12 pcs/ctn", price: 230 },
      { name: "RS.99", detail: "430 g", packing: "24 pcs/ctn", price: 99 },
      { name: "RS.50", detail: "215 g", packing: "48 pcs/ctn", price: 50 },
      { name: "RS.20", detail: "75 g", packing: "96 pcs/ctn", price: 20 },
      { name: "RS.10", detail: "40 g", packing: "204 pcs/ctn", price: 10 },
    ],
    services: "Private labeling and toll manufacturing services available.",
  },
  {
    id: "vero",
    category: "Detergents",
    title: "Vero Detergent",
    iconType: "layer",
    productType: "detergents",
    navGroup: "Detergents",
    description:
      "Premium cleaning powder with natural ingredients. Excellent cleaning power that's safe for colors. Trusted by households across Pakistan.",
    image: "",
    color: "#00AEEF",
    features: [
      "Natural ingredients",
      "Cost-effective",
      "Excellent cleaning",
      "Safe for colors",
      "Long lasting freshness",
    ],
    variants: [
      { name: "20 KG", detail: "20000 g", packing: "4 pcs/ctn", price: null },
      { name: "5 KG", detail: "5000 g", packing: "4 pcs/ctn", price: null },
    ],
    services: "Private labeling and toll manufacturing available.",
  },
  {
    id: "dish-wash-bar",
    category: "Dish Wash",
    title: "Kite Dish Wash Bar",
    iconType: "dish-wash",
    productType: "dish-wash",
    navGroup: "Dish Wash",
    description:
      "Premium lemon fragrance with slow dissolution technology. Perfect for sparkling clean dishes with powerful grease removal. Gentle on hands.",
    image: "",
    color: "#059669",
    features: [
      "Slow dissolution",
      "Premium lemon scent",
      "Tough on grease",
      "Long lasting",
      "Gentle on hands",
    ],
    variants: [
      { name: "SUPER BAR", detail: "240 g", packing: "36 pcs/ctn", price: 60 },
      { name: "LONG BAR", detail: "230 g", packing: "36 pcs/ctn", price: 50 },
      { name: "LARGE BAR", detail: "110 g", packing: "36 pcs/ctn", price: 20 },
      { name: "REGULAR BAR", detail: "55 g", packing: "48 pcs/ctn", price: 10 },
    ],
    services: "Bulk orders and private labeling available.",
  },
];

async function seedProducts() {
  try {
    await connectToDatabase();
    const operations = products.map((product, displayOrder) => ({
      updateOne: {
        filter: { id: product.id },
        update: {
          $set: {
            ...product,
            displayOrder,
            isActive: true,
            showOnLanding: true,
            showInProductsPage: true,
            showInNavbar: true,
          },
        },
        upsert: true,
      },
    }));

    const result = await Product.bulkWrite(operations, { ordered: false });
    console.log(
      `Products seed complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`,
    );
  } catch (error) {
    console.error("Failed seeding products:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedProducts();
