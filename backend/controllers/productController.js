import mongoose from "mongoose";
import Product, { CATEGORIES, CONDITIONS } from "../models/Product.js";
import { uploadImage, deleteImage, publicIdFromUrl } from "../utils/cloudinary.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeCase = (value) =>
  String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
const isValidId = (id) => mongoose.isValidObjectId(id);

// GET /api/products (public) — list with search / filter / sort, all combinable
export async function listProducts(req, res, next) {
  try {
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

    res.status(200).json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/my (protected) — current user's products only
export async function myProducts(req, res, next) {
  try {
    const products = await Product.find({ seller: req.userId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/:id (public) — single product details
export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(id).populate("seller", "name email");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
}

// POST /api/products (protected) — create a product + Cloudinary upload
export async function createProduct(req, res, next) {
  try {
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

    res.status(201).json({ success: true, message: "Product created successfully", product });
  } catch (err) {
    next(err);
  }
}

// PUT/PATCH /api/products/:id (protected) — update own product
export async function updateProduct(req, res, next) {
  try {
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

    res.status(200).json({ success: true, message: "Product updated successfully", product });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/products/:id (protected) — delete own product
export async function deleteProduct(req, res, next) {
  try {
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

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
}
