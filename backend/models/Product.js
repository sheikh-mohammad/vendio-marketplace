import mongoose from "mongoose";

// Canonical values stored in the DB (query params are matched case-insensitively).
const CATEGORIES = ["Electronics", "Fashion", "Furniture", "Vehicles", "Books", "Other"];
const CONDITIONS = ["New", "Used"];

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: CATEGORIES,
    },
    condition: {
      type: String,
      required: [true, "Condition is required"],
      enum: CONDITIONS,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Product image is required"],
    },
    // Owner — always set by the backend from the JWT, never from the frontend.
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
export { CATEGORIES, CONDITIONS };
