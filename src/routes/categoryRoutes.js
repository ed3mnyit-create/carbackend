const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const router = express.Router();

const { isAuth, isAdmin } = require('../middleware/auth');

router.route('/')
  .get(getCategories)
  .post(isAuth, isAdmin, createCategory);

router.route('/:id')
  .get(getCategory)
  .put(isAuth, isAdmin, updateCategory)
  .delete(isAuth, isAdmin, deleteCategory);

module.exports = router;
