import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { PRODUCTS_SEED } from '../seeds/seedData.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

let inMemoryProducts = JSON.parse(JSON.stringify(PRODUCTS_SEED));

/**
 * @desc    Get all product suites and their product items
 * @route   GET /api/products
 * @access  Public
 */
export const getAllProducts = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const products = await Product.find().sort({ order: 1, createdAt: 1 });
      const totalIndividualProducts = products.reduce(
        (acc, suite) => acc + (suite.products ? suite.products.length : 0),
        0
      );

      return ApiResponse.success(res, products, 'Products retrieved successfully', 200, {
        totalSuites: products.length,
        totalProducts: totalIndividualProducts,
      });
    }

    const totalIndividualProducts = inMemoryProducts.reduce(
      (acc, suite) => acc + (suite.products ? suite.products.length : 0),
      0
    );

    return ApiResponse.success(res, inMemoryProducts, 'Products retrieved (offline mode)', 200, {
      totalSuites: inMemoryProducts.length,
      totalProducts: totalIndividualProducts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get product suite by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req, res, next) => {
  try {
    const id = req.params.id.toLowerCase();

    if (mongoose.connection.readyState === 1) {
      const product = await Product.findOne({ $or: [{ id }, { _id: id }] });
      if (!product) {
        return ApiResponse.notFound(res, `Product suite '${id}' not found`);
      }
      return ApiResponse.success(res, product, 'Product suite retrieved');
    }

    const product = inMemoryProducts.find((p) => p.id === id || p._id === id);
    if (!product) return ApiResponse.notFound(res, `Product suite '${id}' not found`);
    return ApiResponse.success(res, product, 'Product suite retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create product suite
 * @route   POST /api/products
 * @access  Private / Admin
 */
export const createProduct = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const product = await Product.create(req.body);
      return ApiResponse.created(res, product, 'Product suite created successfully');
    }

    const newProd = { _id: `prd_${Date.now()}`, ...req.body };
    inMemoryProducts.push(newProd);
    return ApiResponse.created(res, newProd, 'Product suite created');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product suite
 * @route   PUT /api/products/:id
 * @access  Private / Admin
 */
export const updateProduct = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!product) return ApiResponse.notFound(res, 'Product suite not found');
      return ApiResponse.success(res, product, 'Product suite updated successfully');
    }

    const index = inMemoryProducts.findIndex((p) => p._id === req.params.id || p.id === req.params.id);
    if (index === -1) return ApiResponse.notFound(res, 'Product suite not found');

    inMemoryProducts[index] = { ...inMemoryProducts[index], ...req.body };
    return ApiResponse.success(res, inMemoryProducts[index], 'Product suite updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product suite
 * @route   DELETE /api/products/:id
 * @access  Private / Admin
 */
export const deleteProduct = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const product = await Product.findById(req.params.id);
      if (!product) return ApiResponse.notFound(res, 'Product suite not found');

      if (product.img && product.img.includes('res.cloudinary.com')) {
        await deleteFromCloudinary(product.img, 'image');
      }

      await Product.findByIdAndDelete(req.params.id);
      return ApiResponse.success(res, null, 'Product suite and Cloudinary asset deleted successfully');
    }

    const prd = inMemoryProducts.find((p) => p._id === req.params.id || p.id === req.params.id);
    if (prd?.img && prd.img.includes('res.cloudinary.com')) {
      await deleteFromCloudinary(prd.img, 'image');
    }

    inMemoryProducts = inMemoryProducts.filter((p) => p._id !== req.params.id && p.id !== req.params.id);
    return ApiResponse.success(res, null, 'Product suite deleted');
  } catch (error) {
    next(error);
  }
};


export const createProductSuite = createProduct;
export const updateProductSuite = updateProduct;
export const deleteProductSuite = deleteProduct;


