import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectUploadsDir = path.join(__dirname, "..", "..", "uploads");
const tempUploadsDir = path.join("/tmp", "uploads");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getUploadsBaseDir() {
  const baseDir = process.env.VERCEL ? tempUploadsDir : projectUploadsDir;
  ensureDir(baseDir);
  return baseDir;
}

export function getUploadsSubDir(folderName) {
  const dir = path.join(getUploadsBaseDir(), folderName);
  ensureDir(dir);
  return dir;
}
