const asyncHandler = require("express-async-handler");
const Car = require("../models/Car");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const ApiError = require("../utils/ApiError");

const parseOptionalNumber = (value, parser = parseFloat) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = parser(value);
  if (isNaN(parsed)) {
    return undefined;
  }

  return parsed;
};

/**
 * @desc    Get all cars with filters and pagination
 * @route   GET /api/cars
 * @access  Public
 */
const getCars = asyncHandler(async (req, res) => {
  const {
    region,
    category,
    search,
    minPrice,
    maxPrice,
    available,
    year,
    page = 1,
    limit = 20,
    sort = "order",
  } = req.query;

  // Build filter object
  const filter = {};

  // Region filter
  if (region && ["eastern", "jeddah", "riyadh"].includes(region)) {
    filter.region = region;
  }

  // Category filter
  if (category && ["regular", "with_driver", "corporate"].includes(category)) {
    filter.category = category;
  }

  if (available !== undefined) {
    filter.available = available === "true";
  }

  // Search by name
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter.pricePerDay = {};
    if (minPrice) filter.pricePerDay.$gte = parseFloat(minPrice);
    if (maxPrice) filter.pricePerDay.$lte = parseFloat(maxPrice);
  }

  // Year filter
  if (year) {
    filter.year = parseInt(year);
  }

  // Pagination with max cap protection
  const pageNum = parseInt(page) || 1;
  const maxLimit = req.user?.role === "admin" ? 5000 : 50;
  const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), maxLimit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query with pagination
  let sortBy = { order: 1, createdAt: -1 };

  if (sort) {
    if (sort === "averageRating") {
      sortBy = { averageRating: -1, createdAt: -1 };
    } else if (sort === "pricePerDay") {
       sortBy = { pricePerDay: 1 };
    } else if (sort === "-pricePerDay") {
       sortBy = { pricePerDay: -1 };
    }
  }

  const [cars, total] = await Promise.all([
    Car.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Car.countDocuments(filter),
  ]);

  // No need to add full image URLs as they are already stored as full URLs
  const carsWithUrls = cars;

  res.status(200).json({
    success: true,
    data: {
      cars: carsWithUrls,
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
 * @desc    Get single car by ID with reviews and related cars
 * @route   GET /api/cars/:id
 * @access  Public
 */
const getCar = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id).lean();

  if (!car) {
    throw new ApiError(404, "Car not found");
  }

  const reviewsLimit = Math.min(Math.max(parseInt(req.query.reviewsLimit) || 5, 1), 20);
  const relatedLimit = Math.min(Math.max(parseInt(req.query.relatedLimit) || 6, 1), 20);

  const reviews = await Review.find({ car: car._id })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .limit(reviewsLimit)
    .lean();

  const relatedCars = await Car.find({
    region: car.region,
    _id: { $ne: car._id },
    available: true,
  })
    .sort({ averageRating: -1 })
    .limit(relatedLimit)
    .lean();

  // No need to add full image URLs
  const carWithUrl = car;
  const relatedCarsWithUrls = relatedCars;

  res.status(200).json({
    success: true,
    data: {
      car: carWithUrl,
      reviews,
      relatedCars: relatedCarsWithUrls,
    },
  });
});

/**
 * @desc    Create new car
 * @route   POST /api/cars
 * @access  Private/Admin
 */
const createCar = asyncHandler(async (req, res) => {
  const {
    name,
    year,
    region,
    pricePerDay,
    driverHourlyRate,
    imageUrl,
    description,
    seats,
    fuelType,
    priceWeekly,
    priceHalfMonth,
    priceMonthly,
    order,
  } = req.body;

  // Create car
  const car = await Car.create({
    name,
    year: isNaN(parseInt(year)) ? undefined : parseInt(year),
    image: imageUrl,
    region,
    pricePerDay: isNaN(parseFloat(pricePerDay)) ? undefined : parseFloat(pricePerDay),
    driverHourlyRate: parseOptionalNumber(driverHourlyRate),
    priceWeekly: parseOptionalNumber(priceWeekly),
    priceHalfMonth: parseOptionalNumber(priceHalfMonth),
    priceMonthly: parseOptionalNumber(priceMonthly),
    seats: parseOptionalNumber(seats, parseInt),
    fuelType: fuelType || "",
    category: req.body.category || "regular",
    description: description || "",
    order: parseOptionalNumber(order, parseInt) || 0,
  });

  res.status(201).json({
    success: true,
    data: car,
    message: "تم إضافة السيارة بنجاح",
  });
});

/**
 * @desc    Update car
 * @route   PUT /api/cars/:id
 * @access  Private/Admin
 */
const updateCar = asyncHandler(async (req, res) => {
  const {
    name,
    year,
    region,
    pricePerDay,
    driverHourlyRate,
    available,
    imageUrl,
    category,
    description,
    seats,
    fuelType,
    priceWeekly,
    priceHalfMonth,
    priceMonthly,
    order,
  } = req.body;

  let car = await Car.findById(req.params.id);

  if (!car) {
    throw new ApiError(404, "Car not found");
  }

  // Build update object
  const updateData = {};
  if (name) updateData.name = name;
  if (year) {
    const parsedYear = parseInt(year);
    if (!isNaN(parsedYear)) updateData.year = parsedYear;
  }
  if (category) updateData.category = category;
  if (region) updateData.region = region;
  if (pricePerDay) {
    const parsedPrice = parseFloat(pricePerDay);
    if (!isNaN(parsedPrice)) updateData.pricePerDay = parsedPrice;
  }
  if (driverHourlyRate !== undefined)
    updateData.driverHourlyRate = parseOptionalNumber(driverHourlyRate);
  if (priceWeekly !== undefined)
    updateData.priceWeekly = parseOptionalNumber(priceWeekly);
  if (priceHalfMonth !== undefined)
    updateData.priceHalfMonth = parseOptionalNumber(priceHalfMonth);
  if (priceMonthly !== undefined)
    updateData.priceMonthly = parseOptionalNumber(priceMonthly);
  if (seats !== undefined) updateData.seats = parseOptionalNumber(seats, parseInt);
  if (fuelType !== undefined) updateData.fuelType = fuelType;
  if (available !== undefined)
    updateData.available = available === "true" || available === true;
  if (imageUrl) updateData.image = imageUrl;
  if (description !== undefined) updateData.description = description;
  if (order !== undefined)
    updateData.order = parseOptionalNumber(order, parseInt);

  // Update car
  car = await Car.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).lean();

  res.status(200).json({
    success: true,
    data: car,
    message: "تم تحديث بيانات السيارة بنجاح",
  });
});

/**
 * @desc    Delete car
 * @route   DELETE /api/cars/:id
 * @access  Private/Admin
 */
const deleteCar = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id);

  if (!car) {
    throw new ApiError(404, "Car not found");
  }

  // Check for active pending/approved bookings
  const activeBookings = await Booking.countDocuments({
    car: car._id,
    status: { $in: ["pending", "approved"] },
    endDate: { $gte: new Date() },
  });

  // If user explicitly wants to force delete (from admin dashboard with confirmation)
  const forceDelete = req.query.force === "true";

  if (activeBookings > 0 && !forceDelete) {
    return res.status(400).json({
      success: false,
      error: `cannot_delete_car_with_active_bookings`,
      message: `هذه السيارة لديها ${activeBookings} حجز نشط. يرجى إلغاء الحجوزات أولاً أو استخدام خيار الحذف الإجباري.`,
      data: { activeBookings },
    });
  }

  // Delete all related bookings (including past ones if force deleting)
  await Booking.deleteMany({ car: car._id });

  // Delete all related reviews
  await Review.deleteMany({ car: car._id });

  // Delete the car
  await car.deleteOne();

  res.status(200).json({
    success: true,
    message: forceDelete 
      ? "تم حذف السيارة وجميع بياناتها بنجاح (بما فيها الحجوزات)"
      : "تم حذف السيارة بنجاح",
  });
});

module.exports = {
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
};
