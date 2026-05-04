const Blog = require('../models/Blog');
const asyncHandler = require('express-async-handler');
const { z } = require('zod');

// Zod Validation Schema for strict whitelisting
const blogValidationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  slug: z.string().regex(/^[a-z0-9\u0621-\u064A\u0660-\u0669-]+$/, 'Invalid slug format').max(200).optional(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().max(500).optional(),
  image: z.string().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  focusKeywords: z.array(z.string()).optional(),
  relatedCars: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid car ID format')).optional(),
  primaryCta: z.object({
    text: z.string().optional(),
    link: z.string().optional(),
    type: z.enum(['booking', 'offer', 'contact', 'custom']).optional()
  }).optional(),
  faqs: z.array(z.object({
    question: z.string().optional(),
    answer: z.string().optional(),
    keywords: z.array(z.string()).optional()
  })).optional(),
  readingTime: z.number().optional(),
  status: z.enum(['draft', 'published']).optional()
});

// @desc    Get related blogs with Smart Logic (Category + Keywords -> Category -> Popular)
// @route   GET /api/blogs/:id/related
// @access  Public
exports.getRelatedBlogs = asyncHandler(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).json({ success: false, error: 'Blog not found' });
  }

  const limit = parseInt(req.query.limit, 10) || 4;
  let relatedBlogs = [];

  // Tier 1: Same category + keyword intersection
  if (blog.focusKeywords && blog.focusKeywords.length > 0) {
    relatedBlogs = await Blog.find({
      _id: { $ne: blog._id },
      category: blog.category,
      status: 'published',
      focusKeywords: { $in: blog.focusKeywords }
    }).populate('category', 'name slug').limit(limit).lean();
  }

  // Tier 2: If not enough, same category
  if (relatedBlogs.length < limit) {
    const additionalBlogs = await Blog.find({
      _id: { $ne: blog._id, $nin: relatedBlogs.map(b => b._id) },
      category: blog.category,
      status: 'published'
    }).populate('category', 'name slug').limit(limit - relatedBlogs.length).lean();
    relatedBlogs = relatedBlogs.concat(additionalBlogs);
  }

  // Tier 3: If still not enough, global popular (most viewed)
  if (relatedBlogs.length < limit) {
    const popularBlogs = await Blog.find({
      _id: { $ne: blog._id, $nin: relatedBlogs.map(b => b._id) },
      status: 'published'
    })
    .sort('-views')
    .populate('category', 'name slug')
    .limit(limit - relatedBlogs.length)
    .lean();
    relatedBlogs = relatedBlogs.concat(popularBlogs);
  }

  res.status(200).json({
    success: true,
    count: relatedBlogs.length,
    data: relatedBlogs
  });
});

// @desc    Get all blogs (with advanced filtering, pagination, and related data)
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Parse query safely - no auto-operator conversion to prevent query injection
  const parsedQuery = JSON.parse(queryStr);
  
  // Remove empty string filters to prevent matching against empty fields
  Object.keys(parsedQuery).forEach(key => {
    if (parsedQuery[key] === '') {
      delete parsedQuery[key];
    }
  });

  if (req.user?.role !== 'admin') {
    parsedQuery.status = 'published';
  } else if (req.query.status) {
    // Admins can specify status, but if they don't, we show everything in the dashboard
    parsedQuery.status = req.query.status;
  }

  // Add search functionality
  if (req.query.search) {
    parsedQuery.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { summary: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Finding resource with default selective fields for list view
  const defaultSelect = 'title slug summary image category views readingTime createdAt status metaTitle metaDescription';
  query = Blog.find(parsedQuery)
    .select(req.query.select || defaultSelect)
    .populate('category', 'name slug')
    .populate('relatedCars', 'name image pricePerDay region')
    .lean();

  // Select Fields (override default)
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination with max cap protection
  const page = parseInt(req.query.page, 10) || 1;
  const maxLimit = req.user?.role === 'admin' ? 5000 : 50;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), maxLimit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Blog.countDocuments(parsedQuery);

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const blogs = await query;

  // Pagination result object
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  pagination.totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  pagination.currentPage = page;

  res.status(200).json({
    success: true,
    count: blogs.length,
    pagination,
    total,
    data: blogs
  });
});

// @desc    Get single blog by slug or ID
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlog = asyncHandler(async (req, res, next) => {
  const isObjectId = typeof req.params.id === 'string' && req.params.id.match(/^[0-9a-fA-F]{24}$/);
  
  let blog;
  
  if (isObjectId) {
    // Populate category and relatedCars when fetching individual blog to show recommendations
    blog = await Blog.findById(req.params.id)
        .populate('category', 'name slug')
        .populate({
            path: 'relatedCars',
            select: 'name image pricePerDay slug region category order' // Corrected fields from Car.js
        })
        .lean();
  } else {
    blog = await Blog.findOne({ slug: req.params.id })
        .populate('category', 'name slug')
        .populate({
            path: 'relatedCars',
            select: 'name image pricePerDay slug region category order'
        })
        .lean();
  }

  if (!blog) {
    return res.status(404).json({ success: false, error: 'Blog post not found' });
  }

  // Prevent draft leakage to public users
  if (blog.status !== 'published' && req.user?.role !== 'admin') {
    return res.status(404).json({ success: false, error: 'Blog post not found' });
  }

  // Increment view count atomically — skip for admin users to prevent analytics inflation
  if (req.user?.role !== 'admin') {
    await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });
  }

  res.status(200).json({
    success: true,
    data: blog
  });
});

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private/Admin
exports.createBlog = asyncHandler(async (req, res, next) => {
  // Validate request body
  const parsed = blogValidationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      success: false, 
      error: parsed.error.issues.map(err => `${err.path.length > 0 ? err.path.join('.') + ': ' : ''}${err.message}`).join(' | ') 
    });
  }

  const validatedData = parsed.data;
  validatedData.author = req.user?._id || req.user?.id;

  // Auto-generate slug from title if not provided
  if (!validatedData.slug && validatedData.title) {
    validatedData.slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0621-\u064A\u0660-\u0669-]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  // Helper to calculate reading time (approx 200 wpm)
  if (validatedData.content && !validatedData.readingTime) {
    const words = validatedData.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
    validatedData.readingTime = Math.ceil(words / 200) || 1;
  }

  const blog = await Blog.create(validatedData);

  res.status(201).json({
    success: true,
    data: blog
  });
});

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
exports.updateBlog = asyncHandler(async (req, res, next) => {
  const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
  
  let blog;
  
  if (isObjectId) {
    blog = await Blog.findById(req.params.id);
  } else {
    blog = await Blog.findOne({ slug: req.params.id });
  }

  if (!blog) {
    return res.status(404).json({ success: false, error: 'Blog not found' });
  }

  // Validate only the provided fields for update
  const parsed = blogValidationSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      success: false, 
      error: parsed.error.issues.map(err => `${err.path.length > 0 ? err.path.join('.') + ': ' : ''}${err.message}`).join(' | ') 
    });
  }

  const validatedData = parsed.data;

  if (validatedData.content && typeof validatedData.content === 'string') {
    const words = validatedData.content.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(w => w.length > 0).length;
    validatedData.readingTime = Math.ceil(words / 200) || 1;
  }

  Object.assign(blog, validatedData);
  blog = await blog.save();

  res.status(200).json({
    success: true,
    data: blog
  });
});

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
exports.deleteBlog = asyncHandler(async (req, res, next) => {
  const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
  
  let blog;
  
  if (isObjectId) {
    blog = await Blog.findById(req.params.id);
  } else {
    blog = await Blog.findOne({ slug: req.params.id });
  }

  if (!blog) {
    return res.status(404).json({ success: false, error: 'Blog not found' });
  }

  await Blog.findByIdAndDelete(blog._id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});
