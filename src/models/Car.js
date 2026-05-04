const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Car name is required"],
      trim: true,
      minlength: [2, "Car name must be at least 2 characters"],
      maxlength: [100, "Car name cannot exceed 100 characters"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2000, "Year must be 2000 or later"],
      max: [new Date().getFullYear() + 1, "Year cannot be more than next year"],
    },
    image: {
      type: String,
      required: [true, "Car image is required"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    region: {
      type: String,
      required: [true, "Region is required"],
      enum: {
        values: ["eastern", "jeddah", "riyadh"],
        message: "Region must be eastern, jeddah, or riyadh",
      },
    },
    pricePerDay: {
      type: Number,
      required: [true, "Price per day is required"],
      min: [1, "Price must be at least 1 SAR"],
    },
    driverHourlyRate: {
      type: Number,
      min: [0, "Hourly rate cannot be negative"],
      default: 0,
    },
    priceWeekly: {
      type: Number,
      min: [1, "Weekly price must be at least 1 SAR"],
    },
    priceHalfMonth: {
      type: Number,
      min: [1, "Half-month price must be at least 1 SAR"],
    },
    priceMonthly: {
      type: Number,
      min: [1, "Monthly price must be at least 1 SAR"],
    },
    seats: {
      type: Number,
      min: [1, "Seats must be at least 1"],
      default: 5,
    },
    fuelType: {
      type: String,
      trim: true,
      default: "",
    },
    available: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: {
        values: ["regular", "with_driver", "corporate"],
        message: "Category must be regular, with_driver, or corporate",
      },
      default: "regular",
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot exceed 5"],
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
carSchema.index({ region: 1 });
carSchema.index({ category: 1 });
carSchema.index({ available: 1 });
carSchema.index({ pricePerDay: 1 });
carSchema.index({ averageRating: -1 });
carSchema.index({ createdAt: -1 });
carSchema.index({ order: 1 });
carSchema.index({ region: 1, available: 1 });
carSchema.index({ category: 1, available: 1 });
carSchema.index({ name: "text" });

const Car = mongoose.model("Car", carSchema);

module.exports = Car;
