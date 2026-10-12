import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { deleteImages } from "./upload.controller.js";

const limit = 10;
// get all products
export const getProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.pageO) || 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category && req.query.category !== "all") {
      filter.category = req.query.category;
    }

    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      totalProducts,
      pageSize: limit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error getting products: ${error.message}`,
    });
  }
};

// create product
export const createProduct = async (req, res) => {
  const { name, description, price, category, images, quantity } = req.body;

  if (
    !name ||
    !description ||
    price === undefined ||
    !category ||
    !Array.isArray(images) ||
    images.length === 0 ||
    quantity === undefined
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all fields" });
  }

  try {
    const newProduct = await Product.create({
      name,
      description,
      price,
      category,
      images,
      quantity,
    });
    return res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A product with this name already exists.",
      });
    }
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: `Error adding product: ${error.message}`,
    });
  }
};

// update product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Product Id" });
  }

  try {
    const existing = await Product.findById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // figure out which images the client removed
    let toDelete = [];
    if (Array.isArray(updates.images)) {
      const incomingIds = new Set(
        updates.images.map((i) => i.publicId).filter(Boolean),
      );

      toDelete = existing.images
        .filter((img) => img.publicId && !incomingIds.has(img.publicId))
        .map((img) => img.publicId);
    }

    const updated = await Product.findOneAndUpdate(
      { _id: id },
      updates,
      { returnDocument: "after", runValidators: true },
    );

    // delete removed images from Cloudinary (after DB succeeds)
    if (toDelete.length) {
      await deleteImages(toDelete);
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A product with this name already exists.",
      });
    }
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: `Error updating product: ${error.message}`,
    });
  }
};

// delete product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Product Id" });
  }

  try {
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // remove all its images from Cloudinary
    if (deleted.images?.length) {
      await deleteImages(
        deleted.images.map((i) => i.publicId).filter(Boolean),
      );
    }

    return res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error deleting product: ${error.message}`,
    });
  }
};

// get product detail 
export const getProductBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const product = await Product.findOne({ slug }).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

