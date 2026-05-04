const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');
const { getSetting, getSettings, upsertSetting, deleteSetting } = require('../controllers/settingController');

// Public routes
router.get('/:key', getSetting);

// Protected routes (Admin only)
router.use(isAuth);
router.use(isAdmin);

router.get('/', getSettings);
router.post('/', upsertSetting);
router.delete('/:key', deleteSetting);

module.exports = router;