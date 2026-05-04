const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
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
    idCardImage: {
      type: String,
    },
    licenseImage: {
      type: String,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    kmPerDay: {
      type: Number,
      required: [true, "Kilometers per day is required"],
      min: [1, "Kilometers per day must be at least 1"],
    },
    numberOfDays: {
      type: Number,
      required: [true, "Number of days is required"],
      min: [0.1, "Number of days must be at least 0.1"],
    },
    driverHours: {
      type: Number,
      default: 0,
      min: [0, "Driver hours cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Status must be pending, approved, or rejected",
      },
      default: "pending",
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
bookingSchema.index({ user: 1 });
bookingSchema.index({ car: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ startDate: 1, endDate: 1 });
bookingSchema.index({ car: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
