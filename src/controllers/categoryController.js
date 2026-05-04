const Category = require('../models/Category');
const Blog = require('../models/Blog');
const asyncHandler = require('express-async-handler');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find();

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  // Using findById or findOne by slug could be useful
  const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
  let category;
  
  if (isObjectId) {
    category = await Category.findById(req.params.id);
  } else {
    category = await Category.findOne({ slug: req.params.id });
  }

  if (!category) {
    return res.status(404).json({ success: false, error: 'Category not found' });
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    data: category
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
  
  let category;
  
  if (isObjectId) {
    category = await Category.findById(req.params.id);
  } else {
    category = await Category.findOne({ slug: req.params.id });
  }

  if (!category) {
    return res.status(404).json({ success: false, error: 'Category not found' });
  }

  category = await Category.findByIdAndUpdate(category._id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
  
  let category;
  if (isObjectId) {
    category = await Category.findById(id);
  } else {
    category = await Category.findOne({ slug: id });
  }

  if (!category) {
    return res.status(404).json({ success: false, message: 'القسم غير موجود في النظام' });
  }

  // Check for linked blogs
  const linkedBlogs = await Blog.countDocuments({ category: category._id });
  if (linkedBlogs > 0) {
    return res.status(400).json({
      success: false,
      message: `لا يمكن حذف هذا القسم حالياً لأنه يحتوي على ${linkedBlogs} مقال. يرجى نقل المقالات أو حذفها أولاً لضمان سلامة البيانات.`
    });
  }

  await Category.findByIdAndDelete(category._id);

  res.status(200).json({
    success: true,
    message: 'تم حذف القسم بنجاح من نظام Elite'
  });
});
