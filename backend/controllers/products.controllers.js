import mongoose from "mongoose";
import Product from "../models/product.model.js";

const limit = 10;
// get products
export const getProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;

    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(),
      Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      totalProducts,
      pageSize: limit,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// create product
export const createProduct = async (req, res) => {
  const product = req.body;
  if (!product.name || !product.price || !product.image || product.quantity === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all fields" });
  }

  const quantity = Number(product.quantity);

  if (Number.isNaN(quantity)) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity must be a number" });
  }

  if (!Number.isInteger(quantity)) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity must be a positive integer" });
  }

  if (quantity < 0) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity cannot be negative" });
  }

  const newProduct = new Product(product);
  try {
    await newProduct.save();
    return res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A product with this name already exists.",
      });
    }
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for field '${error.path}'.`,
      });
    }
    return res.status(500).json({ success: false, message: `Error adding product ${error.message}` });
  }
};

// update product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const product = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Product Id" });
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, product, { new: true });
    return res
      .status(200)
      .json({ success: true, data: updatedProduct });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "A product with this name already exists.",
      });
    }
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for field '${error.path}'.`,
      });
    }

    return res.status(500).json({ success: false, message: `Error updating product ${error.message}` });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Product Id" });
  }

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: deletedProduct });
  } catch (error) {
    // console.log(`Error deleting product: ${error.message}`);
    return res.status(500).json({ success: false, message: `Error deleting product ${error.message}` });
  }
};
