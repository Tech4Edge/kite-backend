import { v2 as cloudinary } from "cloudinary";

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

export async function uploadImageBuffer(file, options = {}) {
  if (!isConfigured) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend env.",
    );
  }

  const folder = options.folder || "kite/products";
  const filename = String(file?.originalname || "image")
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
        public_id: filename ? `${Date.now()}-${filename}` : undefined,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result?.secure_url || "");
      },
    );

    uploadStream.end(file.buffer);
  });
}
