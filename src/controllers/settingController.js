const Setting = require('../models/Setting');
const asyncHandler = require('express-async-handler');
const { z } = require('zod');

// Zod Validation Schema for settings
const settingValidationSchema = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .max(100)
    .refine(val => /^[a-z0-9_]+$/.test(val), {
      message: 'Key must contain only lowercase letters, numbers, and underscores'
    }),
  data: z.any().refine(val => val !== undefined, 'Data is required'),
  description: z.string().optional()
});

// Allowed setting keys for security
const ALLOWED_KEYS = [
  'social_links',
  'about_content', 
  'contact_info',
  'site_logo',
  'site_favicon',
  'seo_defaults',
  'homepage_content',
  'footer_content',
  'email_templates'
];

const isAllowedKey = (key) => ALLOWED_KEYS.includes(key);

// @desc    Get setting by key
// @route   GET /api/settings/:key
// @access  Public
exports.getSetting = asyncHandler(async (req, res, next) => {
  const { key } = req.params;
  
  // Sanitize key
  const sanitizedKey = key.replace(/[^a-z0-9_]/g, '');
  
  const setting = await Setting.findOne({ key: sanitizedKey });
  
  if (!setting) {
    return res.status(404).json({ 
      success: false, 
      error: `Setting with key '${sanitizedKey}' not found` 
    });
  }

  res.status(200).json({
    success: true,
    data: setting.data
  });
});

// @desc    Get all settings (for admin inspection)
// @route   GET /api/settings
// @access  Private/Admin
exports.getSettings = asyncHandler(async (req, res, next) => {
  const settings = await Setting.find().sort({ key: 1 });

  res.status(200).json({
    success: true,
    count: settings.length,
    data: settings
  });
});

// @desc    Upsert (Create or Update) setting
// @route   POST /api/settings
// @access  Private/Admin
exports.upsertSetting = asyncHandler(async (req, res, next) => {
  const parsed = settingValidationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      success: false, 
      error: parsed.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(' | ') 
    });
  }

  try {
    const { key, data, description } = parsed.data;

    // Security: Only allow specific keys
    if (!isAllowedKey(key)) {
      return res.status(400).json({
        success: false,
        error: `Invalid setting key. Allowed keys: ${ALLOWED_KEYS.join(', ')}`
      });
    }

    // Validate data based on key
    if (key === 'social_links') {
      const socialSchema = z.object({
        facebook: z.string().url().optional().or(z.literal('')),
        twitter: z.string().url().optional().or(z.literal('')),
        instagram: z.string().url().optional().or(z.literal('')),
        tiktok: z.string().url().optional().or(z.literal('')),
        whatsapp: z.string().optional(),
        snapchat: z.string().url().optional().or(z.literal('')),
        linktree: z.string().url().optional().or(z.literal('')),
        qrCode: z.string().url().optional().or(z.literal('')),
      });
      socialSchema.parse(data);
    }

    if (key === 'contact_info') {
      const contactSchema = z.object({
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        address: z.string().optional(),
      });
      contactSchema.parse(data);
    }

    // Use findOneAndUpdate with upsert to create if doesn't exist
    const setting = await Setting.findOneAndUpdate(
      { key },
      { key, data, description },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.issues.map(err => err.message).join(' | ')
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while saving setting'
    });
  }
});

// @desc    Delete setting
// @route   DELETE /api/settings/:key
// @access  Private/Admin
exports.deleteSetting = asyncHandler(async (req, res, next) => {
  const { key } = req.params;
  
  // Sanitize key
  const sanitizedKey = key.replace(/[^a-z0-9_]/g, '');
  
  // Security: Don't allow deletion of critical settings
  const PROTECTED_KEYS = ['site_logo', 'site_favicon', 'seo_defaults'];
  if (PROTECTED_KEYS.includes(sanitizedKey)) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete protected setting'
    });
  }

  const setting = await Setting.findOneAndDelete({ key: sanitizedKey });
  
  if (!setting) {
    return res.status(404).json({
      success: false,
      error: `Setting '${sanitizedKey}' not found`
    });
  }

  res.status(200).json({
    success: true,
    message: `Setting '${sanitizedKey}' deleted`
  });
});