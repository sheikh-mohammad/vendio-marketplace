import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import { notFound, errorHandler } from "./middlewares/error.js";

const app = express();

// Global middleware
app.use(cors()); // allow cross-origin requests from the frontend
app.use(express.json({ limit: "10mb" })); // large enough for base64 product images
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Vendio API is running" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// 404 + central error handler
app.use(notFound);
app.use(errorHandler);

export default app;
