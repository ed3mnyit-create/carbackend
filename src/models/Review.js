const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: [true, "Car is required"],
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Compound unique index: One review per booking
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });
reviewSchema.index({ car: 1 });
reviewSchema.index({ createdAt: -1 });

/**
 * Static method to calculate and update car's average rating
 * Called after adding or deleting a review
 * @param {ObjectId} carId - The car ID to recalculate rating for
 */
reviewSchema.statics.calculateAverageRating = async function (carId) {
  const Car = require("./Car");

  const stats = await this.aggregate([
    { $match: { car: carId } },
    {
      $group: {
        _id: "$car",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Car.findByIdAndUpdate(carId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal
      totalReviews: stats[0].totalReviews,
    });
  } else {
    // No reviews left, reset to defaults
    await Car.findByIdAndUpdate(carId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
};

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
