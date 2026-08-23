import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/User.js";
import Product, { CATEGORIES, CONDITIONS } from "./models/Product.js";
import { protect } from "./middlewares/auth.js";
import { uploadImage, deleteImage, publicIdFromUrl } from "./utils/cloudinary.js";
import { generateOtp, sendOtpEmail } from "./utils/email.js";
import { JWT_SECRET } from "./config/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ─── Global middleware ────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.json({ status: false, message: "Internal server error" });
});


// ─── Shared helpers ───────────────────────────────────────────────────
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });
const normalizeCase = (value) =>
  String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
const isValidId = (id) => mongoose.isValidObjectId(id);

// ─── Auth handlers ────────────────────────────────────────────────────

// POST /api/auth/signup — create account (bcrypt hash, unique email), return JWT
async function signup(req, res) {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.json({ status: false, message: "All fields are required" });
  }
  if (password !== confirmPassword) {
    return res.json({ status: false, message: "Passwords do not match" });
  }
  if (password.length < 6) {
    return res.json({ status: false, message: "Password must be at least 6 characters" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.json({ status: false, message: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  res.json({
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
    return res.json({ status: false, message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.json({ status: false, message: "Invalid email or password" });
  }

  res.json({
    status: true,
    message: "Login successful",
    token: signToken(user._id),
    user: { id: user._id, name: user.name, email: user.email },
  });
}

// POST /api/auth/logout (protected) — JWT is stateless, so the client discards it.
async function logout(req, res) {
  res.json({ status: true, message: "Logged out successfully" });
}

// POST /api/auth/forgot-password — send OTP email
async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.json({ status: false, message: "Email is required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Respond identically whether or not the email exists (no account leaking).
  if (user) {
    const otp = generateOtp();
    user.passwordResetOtpHash = otp;
    user.passwordResetOtpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.otpVerified = false;
    await user.save();
    await sendOtpEmail(user.email, otp);
  }

  res.json({
    status: true,
    message: "If that email is registered, a password reset OTP has been sent to it.",
  });
}

// POST /api/auth/verify-otp — verify the received OTP
async function verifyOtp(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.json({ status: false, message: "Email and OTP are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  const valid =
    user &&
    user.passwordResetOtpHash &&
    (!user.passwordResetOtpExpires || new Date(user.passwordResetOtpExpires) > new Date()) &&
    String(otp) === user.passwordResetOtpHash;

  if (!valid) {
    return res.json({ status: false, message: "Invalid or expired OTP" });
  }

  user.otpVerified = true;
  await user.save();

  res.json({ status: true, message: "OTP verified successfully" });
}

// POST /api/auth/reset-password — set a new password (requires prior OTP verification)
async function resetPassword(req, res) {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    return res.json({ status: false, message: "All fields are required" });
  }
  if (newPassword !== confirmPassword) {
    return res.json({ status: false, message: "Passwords do not match" });
  }
  if (newPassword.length < 6) {
    return res.json({ status: false, message: "Password must be at least 6 characters" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.otpVerified) {
    return res.json({ status: false, message: "Please verify your OTP first" });
  }
  if (!user.passwordResetOtpExpires || new Date(user.passwordResetOtpExpires) < new Date()) {
    return res.json({ status: false, message: "OTP has expired. Please request a new one." });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpires = undefined;
  user.otpVerified = false;
  await user.save();

  res.json({ status: true, message: "Password reset successful. You can log in now." });
}

// ─── Product handlers ─────────────────────────────────────────────────

// GET /api/products (public) — list with search / filter / sort, all combinable
async function listProducts(req, res) {
  const { search, category, condition, sort } = req.query;

  const filter = {};
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }
  if (category) {
    filter.category = normalizeCase(category);
  }
  if (condition) {
    filter.condition = normalizeCase(condition);
  }

  let sortOption = { createdAt: -1 }; // newest first by default
  if (sort === "price_asc") sortOption = { price: 1 };
  else if (sort === "price_desc") sortOption = { price: -1 };

  const products = await Product.find(filter)
    .sort(sortOption)
    .populate("seller", "name email");

  res.json({ status: true, count: products.length, products });
}

// GET /api/products/my (protected) — current user's products only
async function myProducts(req, res) {
  const products = await Product.find({ seller: req.userId }).sort({ createdAt: -1 });

  res.json({ status: true, count: products.length, products });
}

// GET /api/products/:id (public) — single product details
async function getProductById(req, res) {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.json({ status: false, message: "Invalid product id" });
  }

  const product = await Product.findById(id).populate("seller", "name email");
  if (!product) {
    return res.json({ status: false, message: "Product not found" });
  }

  res.json({ status: true, product });
}

// POST /api/products (protected) — create a product + Cloudinary upload
async function createProduct(req, res) {
  const { title, description, price, category, condition, location, image } = req.body;

  if (!title || !description || price === undefined || price === null || !category || !condition || !location) {
    return res.json({ status: false, message: "All fields are required" });
  }
  if (!image) {
    return res.json({ status: false, message: "A product image is required" });
  }

  const priceNum = Number(price);
  if (Number.isNaN(priceNum) || priceNum < 0) {
    return res.json({ status: false, message: "Price must be a valid non-negative number" });
  }

  const cat = normalizeCase(category);
  const cond = normalizeCase(condition);
  if (!CATEGORIES.includes(cat)) {
    return res.json({ status: false, message: `Category must be one of: ${CATEGORIES.join(", ")}` });
  }
  if (!CONDITIONS.includes(cond)) {
    return res.json({ status: false, message: `Condition must be one of: ${CONDITIONS.join(", ")}` });
  }

  let uploaded;
  try {
    uploaded = await uploadImage(image);
  } catch (err) {
    return res.json({ status: false, message: "Image upload failed. Please try a different image." });
  }

  const product = await Product.create({
    title: title.trim(),
    description: description.trim(),
    price: priceNum,
    category: cat,
    condition: cond,
    location: location.trim(),
    image: uploaded.url,
    seller: req.userId,
  });

  res.json({ status: true, message: "Product created successfully", product });
}

// PUT/PATCH /api/products/:id (protected) — update own product
async function updateProduct(req, res) {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.json({ status: false, message: "Invalid product id" });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.json({ status: false, message: "Product not found" });
  }
  if (product.seller.toString() !== req.userId) {
    return res.json({ status: false, message: "You do not have permission to update this product" });
  }

  const { title, description, price, category, condition, location, image } = req.body;

  if (title !== undefined) product.title = title.trim();
  if (description !== undefined) product.description = description.trim();

  if (price !== undefined && price !== null) {
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.json({ status: false, message: "Price must be a valid non-negative number" });
    }
    product.price = priceNum;
  }

  if (category !== undefined) {
    const cat = normalizeCase(category);
    if (!CATEGORIES.includes(cat)) {
      return res.json({ status: false, message: `Category must be one of: ${CATEGORIES.join(", ")}` });
    }
    product.category = cat;
  }

  if (condition !== undefined) {
    const cond = normalizeCase(condition);
    if (!CONDITIONS.includes(cond)) {
      return res.json({ status: false, message: `Condition must be one of: ${CONDITIONS.join(", ")}` });
    }
    product.condition = cond;
  }

  if (location !== undefined) product.location = location.trim();

  if (image && image !== product.image) {
    let uploaded;
    try {
      uploaded = await uploadImage(image);
    } catch (err) {
      return res.json({ status: false, message: "Image upload failed. Please try a different image." });
    }
    await deleteImage(publicIdFromUrl(product.image));
    product.image = uploaded.url;
  }

  await product.save();

  res.json({ status: true, message: "Product updated successfully", product });
}

// DELETE /api/products/:id (protected) — delete own product
async function deleteProduct(req, res) {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.json({ status: false, message: "Invalid product id" });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.json({ status: false, message: "Product not found" });
  }
  if (product.seller.toString() !== req.userId) {
    return res.json({ status: false, message: "You do not have permission to delete this product" });
  }

  await product.deleteOne();
  await deleteImage(publicIdFromUrl(product.image));

  res.json({ status: true, message: "Product deleted successfully" });
}

// ─── Routes ───────────────────────────────────────────────────────────

// Root
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Welcome to Vendio API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      auth: {
        signup: "POST /api/auth/signup",
        login: "POST /api/auth/login",
        logout: "POST /api/auth/logout",
        forgotPassword: "POST /api/auth/forgot-password",
        verifyOtp: "POST /api/auth/verify-otp",
        resetPassword: "POST /api/auth/reset-password",
      },
      products: {
        list: "GET /api/products",
        create: "POST /api/products",
        myProducts: "GET /api/products/my",
        getById: "GET /api/products/:id",
        update: "PUT /api/products/:id",
        delete: "DELETE /api/products/:id",
      },
    },
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: true, message: "Vendio API is running" });
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

export default app;
