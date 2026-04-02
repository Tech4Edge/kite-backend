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
const isProduction = process.env.NODE_ENV === "production";

function getAllowedOrigins() {
  const fromSingle = process.env.FRONTEND_ORIGIN || "";
  const fromList = process.env.FRONTEND_ORIGINS || "";
  const raw = `${fromSingle},${fromList}`
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!raw.length && !isProduction) {
    return ["http://localhost:5173", "http://127.0.0.1:5173"];
  }

  return raw;
}

const allowedOrigins = getAllowedOrigins();

function corsOriginValidator(origin, callback) {
  // Allow non-browser and same-origin requests.
  if (!origin) {
    callback(null, true);
    return;
  }

  // If no allowlist is configured, allow all origins.
  // This keeps production from failing closed due to missing env config.
  if (!allowedOrigins.length) {
    callback(null, true);
    return;
  }

  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked for origin: ${origin}`));
}

app.use(
  cors({
    origin: corsOriginValidator,
    credentials: false,
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
