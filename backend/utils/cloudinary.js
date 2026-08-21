import { v2 as cloudinary } from "cloudinary";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "../config/config.js";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const FOLDER = "vendio/products";

/**
 * Upload a product image to Cloudinary.
 * @param {string} source - A data URI ("data:image/...;base64,...") or raw base64.
 * @returns {Promise<{ publicId: string, url: string }>}
 */
export async function uploadImage(source) {
  if (!source) throw new Error("No image provided");
  const result = await cloudinary.uploader.upload(source, {
    folder: FOLDER,
    resource_type: "image",
  });
  return { publicId: result.public_id, url: result.secure_url };
}

/**
 * Best-effort delete of a Cloudinary image (does not throw on failure).
 * @param {string} publicId - e.g. "vendio/products/abc123"
 */
export async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Failed to delete image from Cloudinary:", err.message);
  }
}

/**
 * Extract the public_id from a Cloudinary URL, or null if it is not one.
 * @param {string} url - e.g. https://res.cloudinary.com/<name>/image/upload/v1/vendio/products/abc.jpg
 */
export function publicIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\/upload\/v\d+\/(.+)$/);
  return match ? match[1] : null;
}
