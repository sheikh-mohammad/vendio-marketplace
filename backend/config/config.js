import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 50001;

const MONGODB_URI = process.env.MONGODB_URI;

const JWT_SECRET = process.env.JWT_SECRET;

const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const SMTP_SERVICE = process.env.SMTP_SERVICE;

const SMTP_EMAIL = process.env.SMTP_EMAIL;

const SMTP_APP_PASS = process.env.SMTP_APP_PASS;

export {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
  SMTP_EMAIL,
  SMTP_APP_PASS,
  SMTP_SERVICE,
};
