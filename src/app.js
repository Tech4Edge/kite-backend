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

// Respect reverse-proxy headers (e.g. Vercel) so req.protocol is correct.
app.set("trust proxy", true);

function normalizeOrigin(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

const allowedOrigins = frontendOrigin
  .split(",")
  .map((value) => normalizeOrigin(value))
  .filter(Boolean);

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

  if (allowedOrigins.includes(normalizeOrigin(origin))) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked for origin: ${origin}`));
}

app.use(
  cors({
    origin: corsOriginValidator,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

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
