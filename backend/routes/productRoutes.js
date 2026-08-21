import { Router } from "express";
import {
  listProducts,
  myProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

// Public list + protected create
router.route("/").get(listProducts).post(protect, createProduct);

// Protected — current user's products (must be declared before "/:id")
router.get("/my", protect, myProducts);

// Public single read + owner-only update/delete
router
  .route("/:id")
  .get(getProductById)
  .put(protect, updateProduct)
  .patch(protect, updateProduct)
  .delete(protect, deleteProduct);

export default router;
