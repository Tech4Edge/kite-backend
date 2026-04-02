import dotenv from "dotenv";
import app from "../src/app.js";
import { connectToDatabase } from "../src/utils/db.js";

dotenv.config();

export default async function handler(req, res) {
  await connectToDatabase();
  return app(req, res);
}
