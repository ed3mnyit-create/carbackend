const express = require('express');
const {
  getBlogs,
  getRelatedBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');

const router = express.Router();

const { isAuth, isAdmin, optionalAuth } = require('../middleware/auth');

router.get('/:id/related', getRelatedBlogs);

router.route('/')
  .get(optionalAuth, getBlogs)
  .post(isAuth, isAdmin, createBlog);

router.route('/:id')
  .get(optionalAuth, getBlog)
  .put(isAuth, isAdmin, updateBlog)
  .delete(isAuth, isAdmin, deleteBlog);

module.exports = router;
