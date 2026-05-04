const sanitizeHtml = require("sanitize-html");

/**
 * Middleware to sanitize user input to prevent XSS attacks.
 * It sanitizes req.body, req.query, and req.params.
 */
const xssClean = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === "string") {
      return sanitizeHtml(value, {
        // Allow safe tags for rich text (e.g., blog posts)
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          'img', 'h1', 'h2', 'h3', 'span', 'u', 's', 'sub', 'sup'
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          '*': ['style', 'class'], // Allow inline styles and classes
          'img': ['src', 'alt', 'width', 'height']
        },
        allowedIframeHostnames: ['www.youtube.com'] // Example if iframes are needed
      });
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value !== null && typeof value === "object") {
      const sanitizedObj = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          sanitizedObj[key] = sanitizeValue(value[key]);
        }
      }
      return sanitizedObj;
    }
    return value;
  };

  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);

  next();
};

module.exports = xssClean;
