import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

const CLOUDINARY_CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const CLOUDINARY_API_KEY = (process.env.CLOUDINARY_API_KEY || "").trim();
const CLOUDINARY_API_SECRET = (process.env.CLOUDINARY_API_SECRET || "").trim();

const isConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET,
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

export function isCloudinaryConfigured() {
  return isConfigured;
}

async function optimizeImageFileToWebp(file) {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer)) {
    const error = new Error("Invalid image file buffer.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const optimizedBuffer = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 640,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 75 })
      .toBuffer();

    const optimizedName = String(file.originalname || "image")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

    return {
      buffer: optimizedBuffer,
      originalname: `${optimizedName || "image"}.webp`,
    };
  } catch {
    const error = new Error("Failed to optimize uploaded image.");
    error.statusCode = 400;
    throw error;
  }
}

export async function uploadImageBuffer(file, options = {}) {
  if (!isConfigured) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend env.",
    );
  }

  const optimizedFile = await optimizeImageFileToWebp(file);
  const folder = options.folder || "kite/products";
  const filename = String(optimizedFile.originalname || "image")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "webp",
        public_id: filename ? `${Date.now()}-${filename}` : undefined,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result?.secure_url || "");
      },
    );

    uploadStream.end(optimizedFile.buffer);
  });
}
