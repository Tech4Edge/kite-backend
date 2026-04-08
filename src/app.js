import "./config/loadEnv.js";
import express from "express";
import cors from "cors";

import productsRouter from "./routes/products.js";
import promotionsRouter from "./routes/promotions.js";
import ordersRouter from "./routes/orders.js";
import adminAuthRouter from "./routes/adminAuth.js";
import adminProductsRouter from "./routes/adminProducts.js";
import adminPromotionsRouter from "./routes/adminPromotions.js";
import adminOrdersRouter from "./routes/adminOrders.js";
import { getUploadsBaseDir } from "./utils/uploadsPath.js";

const app = express();
const uploadsDir = getUploadsBaseDir();
const frontendOrigin = (process.env.FRONTEND_ORIGIN || "").trim();
const frontendOrigins = (process.env.FRONTEND_ORIGINS || "").trim();

// Respect reverse-proxy headers (e.g. Vercel) so req.protocol is correct.
app.set("trust proxy", true);

function normalizeOrigin(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

const allowedOrigins = `${frontendOrigin},${frontendOrigins}`
  .split(",")
  .map((value) => normalizeOrigin(value))
  .filter(Boolean);

if (!allowedOrigins.length && process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173", "http://127.0.0.1:5173");
}

function isVercelPreviewOrigin(origin) {
  return /https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

function corsOriginValidator(origin, callback) {
  // Allow non-browser and same-origin requests.
  if (!origin) {
    callback(null, true);
    return;
  }

  // If FRONTEND_ORIGIN is missing in env, fail open so deployment remains reachable.
  if (!allowedOrigins.length) {
    callback(null, true);
    return;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (allowedOrigins.includes(normalizedOrigin)) {
    callback(null, true);
    return;
  }

  // Optional safety valve for Vercel previews when env vars lag behind deployments.
  if (
    process.env.VERCEL &&
    process.env.ALLOW_VERCEL_PREVIEW_ORIGINS !== "false" &&
    isVercelPreviewOrigin(normalizedOrigin)
  ) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked for origin: ${origin}`));
}

const corsOptions = {
  origin: corsOriginValidator,
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api", (_req, res) => {
  res.json({
    name: "kite-backend",
    status: "ok",
  });
});

app.use("/api/products", productsRouter);
app.use("/api/promotions", promotionsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/promotions", adminPromotionsRouter);
app.use("/api/admin/orders", adminOrdersRouter);

export default app;
