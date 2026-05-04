const asyncHandler = require("express-async-handler");
const Booking = require("../models/Booking");
const Car = require("../models/Car");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");

const getTieredDailyRate = (car, numberOfDays) => {
  if (numberOfDays >= 30) {
    return car.priceMonthly || car.pricePerDay;
  }

  if (numberOfDays >= 15) {
    return car.priceHalfMonth || car.pricePerDay;
  }

  if (numberOfDays >= 7) {
    return car.priceWeekly || car.pricePerDay;
  }

  return car.pricePerDay;
};

/**
 * @desc    Create new booking
 * @route   POST /api/bookings
 * @access  Private
 */
const createBooking = asyncHandler(async (req, res) => {
  const {
    carId,
    phoneNumber,
    kmPerDay,
    numberOfDays,
    driverHours,
    startDate,
    endDate,
    idCardImageUrl,
    licenseImageUrl,
  } = req.body;

  if (req.user.role === "admin") {
    throw new ApiError(403, "Administrators cannot create bookings");
  }

  // Check if car exists
  const car = await Car.findById(carId);

  if (!car) {
    throw new ApiError(404, "Car not found");
  }

  // Check if car is available
  if (!car.available) {
    throw new ApiError(400, "Car is not available for booking");
  }

  // Validate ID and License if it's NOT a with_driver booking
  if (car.category !== "with_driver") {
    if (!idCardImageUrl || !licenseImageUrl) {
      throw new ApiError(400, "ID card and License images are required for this booking");
    }
  }

  // overlapping bookings check removed. Admins will handle approvals manually.

  // Calculate total price
  const parsedNumberOfDays = parseFloat(numberOfDays);
  const tieredDailyRate = getTieredDailyRate(car, parsedNumberOfDays);
  let totalPrice = 0;
  let parsedDriverHours = 0;

  if (car.category === "with_driver" && parsedNumberOfDays < 1) {
    // Hourly booking logic: Price is strictly (hourly rate * hours)
    parsedDriverHours = Math.round(parsedNumberOfDays * 24);
    totalPrice = Math.round((car.driverHourlyRate || 0) * parsedDriverHours);
  } else {
    // Daily booking logic
    totalPrice = Math.round(tieredDailyRate * parsedNumberOfDays);
    
    // Legacy support: if driverHours is explicitly provided for a daily booking
    if (car.category === "with_driver" && driverHours) {
      parsedDriverHours = parseFloat(driverHours) || 0;
      const driverCost = (car.driverHourlyRate || 0) * parsedDriverHours * parsedNumberOfDays;
      totalPrice += Math.round(driverCost);
    }
  }

  // Create booking
  const booking = await Booking.create({
    user: req.user._id,
    car: carId,
    idCardImage: idCardImageUrl,
    licenseImage: licenseImageUrl,
    phoneNumber,
    startDate,
    endDate,
    kmPerDay: parseInt(kmPerDay),
    numberOfDays: parsedNumberOfDays,
    driverHours: parsedDriverHours,
    totalPrice,
    status: "pending",
  });

  // Populate car info for response
  await booking.populate("car", "name image region pricePerDay");

  // Notify Admins
  await Notification.create({
    forAdmin: true,
    title: "حجز جديد",
    message: `يوجد حجز جديد بانتظار المراجعة لسيارة ${car.name}`,
    type: "booking_new",
    relatedBooking: booking._id,
  });

  res.status(201).json({
    success: true,
    data: booking,
    message: "تم إنشاء طلب الحجز بنجاح. بانتظار موافقة الإدارة.",
  });
});

/**
 * @desc    Get all bookings (user gets their own, admin gets all)
 * @route   GET /api/bookings
 * @access  Private
 */
const getBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  // Build filter
  const filter = {};

  // If user is not admin, only show their bookings
  if (req.user.role !== "admin") {
    filter.user = req.user._id;
  }

  // Status filter
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    filter.status = status;
  }

  // Pagination with max cap protection
  const pageNum = parseInt(page) || 1;
  const maxLimit = req.user.role === "admin" ? 5000 : 50;
  const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), maxLimit);
  const skip = (pageNum - 1) * limitNum;
 
  // Execute query
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("user", "name email phoneNumber isActive")
      .populate("car", "name image region pricePerDay")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  // No need to add full URLs as they are already stored as full URLs
  const bookingsWithUrls = bookings;

  res.status(200).json({
    success: true,
    data: {
      bookings: bookingsWithUrls,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
      },
    },
  });
});

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("user", "name email phoneNumber")
    .populate("car", "name image region pricePerDay year")
    .lean();

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check authorization: user can only see their own bookings, admin can see all
  if (
    req.user.role !== "admin" &&
    booking.user._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not authorized to view this booking");
  }

  // No need to add full URLs

  res.status(200).json({
    success: true,
    data: booking,
  });
});

/**
 * @desc    Approve booking
 * @route   PATCH /api/bookings/:id/approve
 * @access  Private/Admin
 */
const approveBooking = asyncHandler(async (req, res) => {
  let booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.status !== "pending") {
    throw new ApiError(
      400,
      `Cannot approve booking with status: ${booking.status}`,
    );
  }

  // Update status
  booking.status = "approved";
  await booking.save();

  // Populate for response
  await booking.populate("user", "name email");
  await booking.populate("car", "name image region");

  // Notify User
  await Notification.create({
    user: booking.user._id,
    title: "تم قبول الحجز",
    message: `تهانينا! تمت الموافقة على حجزك لسيارة ${booking.car.name}`,
    type: "booking_approved",
    relatedBooking: booking._id,
  });

  res.status(200).json({
    success: true,
    data: booking,
    message: "تم قبول الحجز بنجاح",
  });
});

/**
 * @desc    Reject booking
 * @route   PATCH /api/bookings/:id/reject
 * @access  Private/Admin
 */
const rejectBooking = asyncHandler(async (req, res) => {
  let booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.status !== "pending") {
    throw new ApiError(
      400,
      `Cannot reject booking with status: ${booking.status}`,
    );
  }

  // Update status
  booking.status = "rejected";
  await booking.save();

  // Populate for response
  await booking.populate("user", "name email");
  await booking.populate("car", "name image region");

  // Notify User
  await Notification.create({
    user: booking.user._id,
    title: "تم رفض الحجز",
    message: `نعتذر، لقد تم رفض حجزك لسيارة ${booking.car.name}`,
    type: "booking_rejected",
    relatedBooking: booking._id,
  });

  res.status(200).json({
    success: true,
    data: booking,
    message: "تم رفض الحجز",
  });
});

/**
 * @desc    Delete booking
 * @route   DELETE /api/bookings/:id
 * @access  Private/Admin
 */
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Delete related review if exists
  const review = await Review.findOne({ booking: booking._id });
  if (review) {
    const carId = review.car;
    await review.deleteOne();
    // Recalculate car rating
    await Review.calculateAverageRating(carId);
  }

  // Delete the booking
  await booking.deleteOne();

  res.status(200).json({
    success: true,
    message: "تم حذف الحجز بنجاح",
  });
});

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  approveBooking,
  rejectBooking,
  deleteBooking,
};
