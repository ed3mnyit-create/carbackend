const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [150, 'Blog title can not be more than 150 characters']
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      lowercase: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Blog must belong to a category']
    },
    content: {
      type: String, // Rich Text / HTML
      required: [true, 'Blog content is required']
    },
    summary: {
      type: String, // Short snippet for cards & meta description fallback
      maxlength: [500, 'Summary can not be more than 500 characters']
    },
    image: {
      type: String,
      default: 'no-photo.jpg'
    },
    
    // Advanced SEO
    metaTitle: {
      type: String,
      maxlength: 60 // Google best practice
    },
    metaDescription: {
      type: String,
      maxlength: 160 // Google best practice
    },
    focusKeywords: {
      type: [String] // Array of keywords
    },
    
    // CRO & Integration
    relatedCars: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car'
    }],
    primaryCta: {
      text: { type: String, trim: true },
      link: { type: String, trim: true },
      type: { 
        type: String, 
        enum: ['booking', 'offer', 'contact', 'custom'],
        default: 'custom'
      }
    },
    
    // Internal Link Suggestions mechanism basis 
    // Just simple array for suggested slugs for later smart logic
    suggestedInternalLinks: [{
        type: String 
    }],
    
    // FAQ System for SEO
    faqs: [
      {
        question: { type: String, trim: true },
        answer: { type: String, trim: true },
        keywords: [String] // Optional mapping for smart display
      }
    ],
    
    // Analytics & Metrics
    views: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number,
      default: 5 // fallback in minutes
    },
    
    // Admin Governance
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    },
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for faster queries
blogSchema.index({ status: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ views: -1 });
blogSchema.index({ slug: 1 });

// Pre-validate to auto-generate slug if not explicitly passed
blogSchema.pre('validate', async function(next) {
  if (this.title && (!this.slug || (this.isNew && this.isModified('title')))) {
    const baseSlug = this.title.toLowerCase()
                               .replace(/[^a-z0-9\u0621-\u064A\u0660-\u0669-]+/g, '-')
                               .replace(/(^-|-$)+/g, ''); // Arabic + English slug support
    
    // Check if duplicate slug exists
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    // We only need to check against the DB if the doc is new or the title is modified
    if (this.isNew || this.isModified('title') || this.isModified('slug')) {
      while (slugExists) {
        const existingBlog = await this.constructor.findOne({ slug });
        if (existingBlog && existingBlog._id.toString() !== this._id.toString()) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        } else {
          slugExists = false;
        }
      }
      this.slug = slug;
    }
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
