const mongoose = require("mongoose");

const promoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      maxlength: [60, "Title cannot exceed 60 characters"],
      trim: true,
    },
    subtitle: {
      type: String,
      required: [true, "Subtitle is required"],
      maxlength: [150, "Subtitle cannot exceed 150 characters"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    linkUrl: {
      type: String,
      default: "",
    },
    layoutType: {
      type: String,
      enum: ["image-left", "image-right", "full-bg"],
      default: "image-right",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
      min: [0, "Priority cannot be negative"],
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance and sorting
promoSchema.index({ priority: 1, isActive: 1 });
promoSchema.index({ expiresAt: 1 });

// Pre-save middleware to auto-generate slug from title
promoSchema.pre("save", function(next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});

module.exports = mongoose.model("Promo", promoSchema);