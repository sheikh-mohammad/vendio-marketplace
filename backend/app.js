import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "./models/User.js";
import Product, { CATEGORIES, CONDITIONS } from "./models/Product.js";
import { protect } from "./middlewares/auth.js";
import { notFound, errorHandler } from "./middlewares/error.js";
import { uploadImage, deleteImage, publicIdFromUrl } from "./utils/cloudinary.js";
import { generateOtp, sendOtpEmail } from "./utils/email.js";
import { JWT_SECRET } from "./config/config.js";

const app = express();

// ─── Global middleware ────────────────────────────────────────────────
app.use(cors()); // allow cross-origin requests from the frontend
app.use(express.json({ limit: "10mb" })); // large enough for base64 product images
app.use(express.urlencoded({ extended: true }));

// Automatically include a `status: true|false` boolean on every JSON response,
// derived from the HTTP status code (2xx/3xx = true, everything else = false).
app.use((req, res, next) => {
  const json = res.json;
  res.json = function (body) {
    if (body && typeof body === "object" && !("status" in body)) {
      body.status = res.statusCode >= 200 && res.statusCode < 400;
    }
    return json.call(this, body);
  };
  next();
});

// ─── Shared helpers ───────────────────────────────────────────────────
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeCase = (value) =>
  String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
const isValidId = (id) => mongoose.isValidObjectId(id);

// ─── Auth handlers ────────────────────────────────────────────────────

// POST /api/auth/signup — create account (bcrypt hash, unique email), return JWT
async function signup(req, res) {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ message: "An account with this email already exists" });
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password,
  });

  res.status(201).json({
    status: true,
    message: "Account created successfully",
    token: signToken(user._id),
    user: { id: user._id, name: user.name, email: user.email },
  });
}

// POST /api/auth/login — verify credentials, return JWT
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.status(200).json({
    status: true,
    message: "Login successful",
    token: signToken(user._id),
    user: { id: user._id, name: user.name, email: user.email },
  });
}

// POST /api/auth/logout (protected) — JWT is stateless, so the client discards it.
async function logout(req, res) {
  res.status(200).json({ status: true, message: "Logged out successfully" });
}

// POST /api/auth/forgot-password — send OTP email
async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Respond identically whether or not the email exists (no account leaking).
  if (user) {
    const otp = generateOtp();
    user.passwordResetOtpHash = await bcrypt.hash(otp, 10);
    user.passwordResetOtpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.otpVerified = false;
    await user.save();
    await sendOtpEmail(user.email, otp);
  }

  res.status(200).json({
    status: true,
    message: "If that email is registered, a password reset OTP has been sent to it.",
  });
}

// POST /api/auth/verify-otp — verify the received OTP
async function verifyOtp(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  const valid =
    user &&
    user.passwordResetOtpHash &&
    (!user.passwordResetOtpExpires || new Date(user.passwordResetOtpExpires) > new Date()) &&
    (await bcrypt.compare(String(otp), user.passwordResetOtpHash));

  if (!valid) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.otpVerified = true;
  await user.save();

  res.status(200).json({ status: true, message: "OTP verified successfully" });
}

// POST /api/auth/reset-password — set a new password (requires prior OTP verification)
async function resetPassword(req, res) {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.otpVerified) {
    return res.status(400).json({ message: "Please verify your OTP first" });
  }
  if (!user.passwordResetOtpExpires || new Date(user.passwordResetOtpExpires) < new Date()) {
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  user.password = newPassword; // hashed by the User pre-save hook
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpires = undefined;
  user.otpVerified = false;
  await user.save();

  res.status(200).json({ status: true, message: "Password reset successful. You can log in now." });
}

// ─── Product handlers ─────────────────────────────────────────────────

// GET /api/products (public) — list with search / filter / sort, all combinable
async function listProducts(req, res) {
  const { search, category, condition, sort } = req.query;

  const filter = {};
  if (search) {
    filter.title = { $regex: escapeRegex(search), $options: "i" }; // case-insensitive title search
  }
  if (category) {
    filter.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };
  }
  if (condition) {
    filter.condition = { $regex: `^${escapeRegex(condition)}$`, $options: "i" };
  }

  let sortOption = { createdAt: -1 }; // newest first by default
  if (sort === "price_asc") sortOption = { price: 1 };
  else if (sort === "price_desc") sortOption = { price: -1 };

  const products = await Product.find(filter)
    .sort(sortOption)
    .populate("seller", "name email");

  res.status(200).json({ status: true, count: products.length, products });
}

// GET /api/products/my (protected) — current user's products only
async function myProducts(req, res) {
  const products = await Product.find({ seller: req.userId }).sort({ createdAt: -1 });

  res.status(200).json({ status: true, count: products.length, products });
}

// GET /api/products/:id (public) — single product details
async function getProductById(req, res) {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const product = await Product.findById(id).populate("seller", "name email");
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.status(200).json({ status: true, product });
}

// POST /api/products (protected) — create a product + Cloudinary upload
async function createProduct(req, res) {
  const { title, description, price, category, condition, location, image } = req.body;

  if (!title || !description || price === undefined || price === null || !category || !condition || !location) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (!image) {
    return res.status(400).json({ message: "A product image is required" });
  }

  const priceNum = Number(price);
  if (Number.isNaN(priceNum) || priceNum < 0) {
    return res.status(400).json({ message: "Price must be a valid non-negative number" });
  }

  const cat = normalizeCase(category);
  const cond = normalizeCase(condition);
  if (!CATEGORIES.includes(cat)) {
    return res.status(400).json({ message: `Category must be one of: ${CATEGORIES.join(", ")}` });
  }
  if (!CONDITIONS.includes(cond)) {
    return res.status(400).json({ message: `Condition must be one of: ${CONDITIONS.join(", ")}` });
  }

  let uploaded;
  try {
    uploaded = await uploadImage(image);
  } catch (err) {
    return res.status(400).json({ message: "Image upload failed. Please try a different image." });
  }

  const product = await Product.create({
    title: title.trim(),
    description: description.trim(),
    price: priceNum,
    category: cat,
    condition: cond,
    location: location.trim(),
    image: uploaded.url,
    seller: req.userId, // set from the JWT — never from the client
  });

  res.status(201).json({ status: true, message: "Product created successfully", product });
}

// PUT/PATCH /api/products/:id (protected) — update own product
async function updateProduct(req, res) {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  if (product.seller.toString() !== req.userId) {
    return res.status(403).json({ message: "You do not have permission to update this product" });
  }

  const { title, description, price, category, condition, location, image } = req.body;

  if (title !== undefined) product.title = title.trim();
  if (description !== undefined) product.description = description.trim();

  if (price !== undefined && price !== null) {
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: "Price must be a valid non-negative number" });
    }
    product.price = priceNum;
  }

  if (category !== undefined) {
    const cat = normalizeCase(category);
    if (!CATEGORIES.includes(cat)) {
      return res.status(400).json({ message: `Category must be one of: ${CATEGORIES.join(", ")}` });
    }
    product.category = cat;
  }

  if (condition !== undefined) {
    const cond = normalizeCase(condition);
    if (!CONDITIONS.includes(cond)) {
      return res.status(400).json({ message: `Condition must be one of: ${CONDITIONS.join(", ")}` });
    }
    product.condition = cond;
  }

  if (location !== undefined) product.location = location.trim();

  // If a new image was supplied, upload it and clean up the old one.
  if (image && image !== product.image) {
    let uploaded;
    try {
      uploaded = await uploadImage(image);
    } catch (err) {
      return res.status(400).json({ message: "Image upload failed. Please try a different image." });
    }
    await deleteImage(publicIdFromUrl(product.image)); // best effort
    product.image = uploaded.url;
  }

  await product.save();

  res.status(200).json({ status: true, message: "Product updated successfully", product });
}

// DELETE /api/products/:id (protected) — delete own product
async function deleteProduct(req, res) {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  if (product.seller.toString() !== req.userId) {
    return res.status(403).json({ message: "You do not have permission to delete this product" });
  }

  await product.deleteOne();
  await deleteImage(publicIdFromUrl(product.image)); // best effort

  res.status(200).json({ status: true, message: "Product deleted successfully" });
}

// ─── Routes ───────────────────────────────────────────────────────────

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: true, message: "Vendio API is running" });
});

// Auth
app.post("/api/auth/signup", signup);
app.post("/api/auth/login", login);
app.post("/api/auth/logout", protect, logout);
app.post("/api/auth/forgot-password", forgotPassword);
app.post("/api/auth/verify-otp", verifyOtp);
app.post("/api/auth/reset-password", resetPassword);

// Products
app.get("/api/products", listProducts); // public list (search/filter/sort)
app.post("/api/products", protect, createProduct); // protected create
app.get("/api/products/my", protect, myProducts); // protected, before "/:id"
app.get("/api/products/:id", getProductById); // public single
app.put("/api/products/:id", protect, updateProduct); // owner only
app.patch("/api/products/:id", protect, updateProduct); // owner only
app.delete("/api/products/:id", protect, deleteProduct); // owner only

// ─── Error handling ───────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
