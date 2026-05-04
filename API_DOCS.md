# C4R Platform API Documentation

Welcome to the comprehensive API documentation for the C4R (Car For Rent) Platform backend. This document covers all available endpoints, their methods, and usage details.

## 🔗 Base URL
```
https://c4r-platform-backend.vercel.app/api
```
*(For local development, you can switch this to `http://localhost:5000/api`)*

---

## 🛡️ Authentication & Authorization
Most endpoints require authentication. Provide a valid JWT token in the `Authorization` header:
`Authorization: Bearer <your_jwt_token>`

Some endpoints are restricted to Admins only (`isAdmin` middleware).

---

## 🚦 System & Health
Endpoints to check system status.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/health` | Check if the server is running and healthy. | Public |
| GET | `/` | API Root welcome message. | Public |
| GET | `/api` | API Base welcome message. | Public |

---

## 🔐 Authentication (`/api/auth`)
Handles user registration, login, and password management.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user account. | Public |
| POST | `/api/auth/login` | Authenticate and get a JWT token. | Public |
| POST | `/api/auth/forgot-password` | Request a password reset link. | Public |
| POST | `/api/auth/reset-password` | Reset password using a valid token. | Public |
| PUT | `/api/auth/change-password` | Change the password for the logged-in user. | Private |
| GET | `/api/auth/logout` | Clear the auth cookie and logout the user. | Private |

---

## 👤 Users (`/api/users`)
Manage user profiles and accounts.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/users/` | Get a list of all registered users. | Admin |
| GET | `/api/users/profile` | Get the profile of the currently logged-in user. | Private |
| PUT | `/api/users/profile` | Update the profile of the currently logged-in user. | Private |
| PUT | `/api/users/:id` | Update a specific user's details. | Admin |
| DELETE| `/api/users/:id` | Delete a user account. | Admin |

---

## 🌍 Regions (`/api/regions`)
Manage available regions or cities for car rentals.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/regions/` | Get all available regions. | Public |

---

## 🚗 Cars (`/api/cars`)
Manage the vehicle fleet.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/cars/` | Get all cars (supports filtering, pagination, search). | Public |
| GET | `/api/cars/:id` | Get details of a specific car by ID. | Public |
| POST | `/api/cars/` | Add a new car to the fleet. | Admin |
| PUT | `/api/cars/:id` | Update an existing car's details. | Admin |
| DELETE| `/api/cars/:id` | Remove a car from the fleet. | Admin |

---

## 📅 Bookings (`/api/bookings`)
Handle reservation requests and statuses.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/bookings/` | Create a new booking reservation. | Private |
| GET | `/api/bookings/` | Get bookings (User sees own; Admin sees all). | Private |
| GET | `/api/bookings/:id` | Get details of a specific booking. | Private |
| PATCH | `/api/bookings/:id/approve` | Approve a pending booking. | Admin |
| PATCH | `/api/bookings/:id/reject` | Reject a pending booking. | Admin |
| DELETE| `/api/bookings/:id` | Delete a booking. | Admin |

---

## ⭐ Reviews (`/api/reviews`)
Manage customer feedback and ratings for cars.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/reviews/car/:carId` | Get all approved reviews for a specific car. | Public |
| POST | `/api/reviews/` | Submit a new review for a car. | Private |
| GET | `/api/reviews/user` | Get all reviews written by the logged-in user. | Private |
| GET | `/api/reviews/recent` | Get recently submitted reviews. | Public |
| GET | `/api/reviews/admin/all` | Get all reviews (including unapproved) for management. | Admin |
| DELETE| `/api/reviews/:id` | Delete a review. | Admin |

---

## 📊 Admin Dashboard (`/api/admin`)
Platform analytics and summary endpoints.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/admin/stats` | Retrieve platform-wide statistics (counts, revenue). | Admin |

---

## 🔔 Notifications (`/api/notifications`)
In-app notifications system for users and admins.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/notifications/` | Get all notifications for the current user. | Private |
| POST | `/api/notifications/` | Create a new notification (system/admin). | Private |
| PATCH | `/api/notifications/mark-all-read`| Mark all notifications as read for the user. | Private |
| PATCH | `/api/notifications/:id/read` | Mark a specific notification as read. | Private |
| DELETE| `/api/notifications/:id` | Delete a specific notification. | Private |

---

## 📁 Categories (`/api/categories`)
Manage car classifications (e.g., SUV, Sedan, Luxury).

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/categories/` | Get all car categories. | Public |
| POST | `/api/categories/` | Create a new car category. | Admin |
| GET | `/api/categories/:id` | Get a specific category by ID. | Public |
| PUT | `/api/categories/:id` | Update a specific category. | Admin |
| DELETE| `/api/categories/:id` | Delete a specific category. | Admin |

---

## 📝 Blogs (`/api/blogs`)
Content management for platform articles and news.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/blogs/` | Get all published blog posts. | Public |
| POST | `/api/blogs/` | Create a new blog post. | Admin |
| GET | `/api/blogs/:id` | Get a specific blog post by ID or Slug. | Public |
| GET | `/api/blogs/:id/related` | Get related blog posts. | Public |
| PUT | `/api/blogs/:id` | Update a specific blog post. | Admin |
| DELETE| `/api/blogs/:id` | Delete a specific blog post. | Admin |

---

## ⚙️ Settings (`/api/settings`)
Global platform configurations and dynamic settings (e.g., SEO, Social Links).

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/settings/` | Get all global settings. | Public |
| GET | `/api/settings/:key` | Get a specific setting by its unique key. | Public |
| POST | `/api/settings/` | Create or update a specific setting. | Admin |
| DELETE| `/api/settings/:key` | Delete a specific setting. | Admin |

---

## 🎫 Promos (`/api/promos`)
Manage discount codes and promotional banners.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/promos/` | Get all active and public promotional codes/banners. | Public |
| GET | `/api/promos/admin` | Get all promos, including inactive/expired. | Admin |
| POST | `/api/promos/` | Create a new promotional code or banner. | Admin |
| PUT | `/api/promos/:id` | Update an existing promo. | Admin |
| DELETE| `/api/promos/:id` | Delete a promo. | Admin |

---

## 📝 General Error Responses
In case of errors, the API will respond with standard HTTP status codes and a JSON error payload:

```json
{
  "success": false,
  "message": "Detailed error message"
}
```

- **400 Bad Request:** Missing fields or validation error.
- **401 Unauthorized:** Missing or invalid token.
- **403 Forbidden:** Valid token, but lacking admin privileges.
- **404 Not Found:** Resource not found.
- **500 Internal Server Error:** Server-side exception.
