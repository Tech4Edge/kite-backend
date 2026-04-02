import dotenv from "dotenv";
import app from "../src/app.js";
import { connectToDatabase } from "../src/utils/db.js";

dotenv.config();

function isHealthRequest(req) {
  const path = req.url?.split("?")[0] || "";
  return path === "/api/health" || path === "/api";
}

export default async function handler(req, res) {
  if (!isHealthRequest(req)) {
    try {
      await connectToDatabase();
    } catch (err) {
      console.error("Database connection failed", err);
      return res.status(503).json({
        message: "Database is not available",
      });
    }
  }
  return app(req, res);
}
