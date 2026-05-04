const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * Validate request middleware
 * Checks express-validator validation results and returns errors if any
 * Must be used after express-validator check/validate middleware
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Extract error messages
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    const detailedMessage = `Validation failed: ${errorMessages.map(e => e.message).join(', ')}`;

    // Return validation errors
    return res.status(400).json({
      success: false,
      message: detailedMessage,
      errors: errorMessages,
    });
  }

  next();
};

module.exports = validateRequest;
