// routes/products.route.js
import express from "express";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../controllers/products.controllers.js";
import { protectRoute } from "../middleware/protected-route.js";

const router = express.Router();

// Public route: Anyone can fetch products
router.get("/", getProducts);

// Protected routes: Admin authentication required
router.post("/", protectRoute, createProduct);
router.put("/:id", protectRoute, updateProduct);
router.delete("/:id", protectRoute, deleteProduct);

export default router;
