const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name can not be more than 50 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description can not be more than 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Add regex or simple pre-save hook for auto-slug generation if slug is not provided, 
// normally this is handled in the controller before saving to DB or on frontend, 
// but putting a failsafe here is good.
categorySchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9-ء-ي]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
