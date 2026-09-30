import mongoose from "mongoose";
import Product from "../models/product.model.js";

const limit = 10;
// get products
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(),
      Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      totalProducts,
      pageSize: limit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// create product
export const createProduct = async (req, res) => {
  const product = req.body;
  if (!product.name || !product.price || !product.image) {
    res
      .status(400)
      .json({ success: false, message: "Please provide all fields" });
  }
  const newProduct = new Product(product);
  try {
    await newProduct.save();
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "A product with this name already exists.",
      });
    }
    if (error.name === "CastError") {
      res.status(400).json({
        success: false,
        message: `Invalid value for field '${error.path}'.`,
      });
    }

    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// update product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const product = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res
      .status(404)
      .json({ success: false, message: "Invalid Product Id" });
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, product, { new: true });
    res
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
      res.status(400).json({
        success: false,
        message: `Invalid value for field '${error.path}'.`,
      });
    }

    res.status(500).json({ success: false, message: "Server Error" });
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

    res.status(200).json({ success: true, data: deletedProduct });
  } catch (error) {
    console.log(`Error deleting product: ${error.message}`);
    res.status(500).json({ success: false, message: "Error deleting Product" });
  }
};
