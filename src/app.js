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

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: false,
  }),
);

app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/products", productsRouter);
app.use("/api/promotions", promotionsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/promotions", adminPromotionsRouter);
app.use("/api/admin/orders", adminOrdersRouter);

export default app;
