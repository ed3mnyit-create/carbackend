# 🚘 C4R Platform - Backend Architecture

Welcome to the backend repository of the **C4R Car Rental Platform**. This project powers the core functionality of the platform, built with a robust tech stack to ensure high performance, security, and scalability.

---

## 🚀 Key Features
- **Role-Based Authentication:** Secure JWT-based authentication for Users and Administrators.
- **Advanced Car Management:** Full CRUD operations for fleet management, including dynamic pricing models for "With Driver" and "Without Driver" options.
- **Smart Booking System:** Complex tiered pricing calculation, ID/License validation checks, status lifecycle tracking, and admin approvals.
- **Promotions Engine:** Discount code generation, real-time validation, and expiry tracking.
- **Dynamic Content & SEO:** Fully manageable blog system, dynamic platform settings (social links, contact info), and SEO metadata handling.
- **User & Review System:** Customer feedback management with admin moderation capabilities.
- **Security Hardened:** Integrated XSS filtering, NoSQL injection prevention, Rate Limiting, and HPP (HTTP Parameter Pollution) protection.

---

## 🛠️ Technology Stack
- **Framework:** Node.js, Express.js
- **Database:** MongoDB via Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT), Bcrypt.js
- **Security:** Helmet, Express Rate Limit, Express Mongo Sanitize, XSS-Clean
- **Validation:** Express Validator, Zod (in controllers)
- **Deployment:** Vercel (Serverless ready)

---

## 📦 Installation & Local Setup

1. **Clone & Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables Configuration (`.env`):**
   Create a `.env` file in the root backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=30d
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Run the Server:**
   ```bash
   # Development Mode (with Nodemon)
   npm run dev

   # Production Mode
   npm start
   ```

---

## 📚 Complete API Endpoints Summary

Below is a comprehensive list of all backend API endpoints currently available.
*Note: Routes marked with `[Admin]` require an Administrator JWT token. Routes marked with `[Private]` require a standard User JWT token.*

### 🛡️ Authentication & User Management
- `POST   /api/auth/register` - Register a new user
- `POST   /api/auth/login` - Authenticate & get token
- `POST   /api/auth/forgot-password` - Request password reset
- `POST   /api/auth/reset-password` - Reset password via token
- `PUT    /api/auth/change-password` - Change password [Private]
- `GET    /api/auth/logout` - Logout user [Private]
- `GET    /api/users/profile` - Get current user profile [Private]
- `PUT    /api/users/profile` - Update current user profile [Private]
- `GET    /api/users/` - Get all users [Admin]
- `PUT    /api/users/:id` - Update specific user [Admin]
- `DELETE /api/users/:id` - Delete user [Admin]

### 🚗 Cars & Categories
- `GET    /api/cars/` - Get all cars (Supports filters)
- `GET    /api/cars/:id` - Get specific car details
- `POST   /api/cars/` - Create a new car [Admin]
- `PUT    /api/cars/:id` - Update a car [Admin]
- `DELETE /api/cars/:id` - Delete a car [Admin]
- `GET    /api/categories/` - Get all categories
- `POST   /api/categories/` - Create a category [Admin]
- `GET    /api/categories/:id` - Get category by ID
- `PUT    /api/categories/:id` - Update a category [Admin]
- `DELETE /api/categories/:id` - Delete a category [Admin]

### 📅 Bookings
- `POST   /api/bookings/` - Create a reservation [Private]
- `GET    /api/bookings/` - Get bookings (User's own or All for Admin) [Private/Admin]
- `GET    /api/bookings/:id` - Get specific booking [Private]
- `PATCH  /api/bookings/:id/approve` - Approve booking [Admin]
- `PATCH  /api/bookings/:id/reject` - Reject booking [Admin]
- `DELETE /api/bookings/:id` - Delete booking [Admin]

### 🎫 Promos & Regions
- `GET    /api/promos/` - Get active promos
- `GET    /api/promos/admin` - Get all promos [Admin]
- `POST   /api/promos/` - Create a promo [Admin]
- `PUT    /api/promos/:id` - Update a promo [Admin]
- `DELETE /api/promos/:id` - Delete a promo [Admin]
- `GET    /api/regions/` - Get all rental regions

### ⭐ Reviews
- `GET    /api/reviews/car/:carId` - Get reviews for a car
- `POST   /api/reviews/` - Submit a review [Private]
- `GET    /api/reviews/user` - Get user's own reviews [Private]
- `GET    /api/reviews/recent` - Get recent platform reviews
- `GET    /api/reviews/admin/all` - Get all reviews [Admin]
- `DELETE /api/reviews/:id` - Delete a review [Admin]

### 📝 Blogs & Settings
- `GET    /api/blogs/` - Get all blogs
- `POST   /api/blogs/` - Create a blog [Admin]
- `GET    /api/blogs/:id` - Get a blog by ID/Slug
- `GET    /api/blogs/:id/related` - Get related blogs
- `PUT    /api/blogs/:id` - Update a blog [Admin]
- `DELETE /api/blogs/:id` - Delete a blog [Admin]
- `GET    /api/settings/` - Get all platform settings
- `GET    /api/settings/:key` - Get specific setting
- `POST   /api/settings/` - Create/Update setting [Admin]
- `DELETE /api/settings/:key` - Delete setting [Admin]

### 🔔 Admin Stats & Notifications
- `GET    /api/admin/stats` - Get dashboard statistics [Admin]
- `GET    /api/notifications/` - Get user notifications [Private]
- `POST   /api/notifications/` - Send a notification [Private]
- `PATCH  /api/notifications/mark-all-read` - Mark all as read [Private]
- `PATCH  /api/notifications/:id/read` - Mark single as read [Private]
- `DELETE /api/notifications/:id` - Delete notification [Private]

---

## 📖 Deep Dive Documentation
For more in-depth endpoint parameters, body payloads, and integration instructions, refer to:
- **[English Documentation (API_DOCS.md)](./API_DOCS.md)**
- **[Arabic Documentation (API_DOCS_AR.md)](./API_DOCS_AR.md)**

## ⚡ Testing via Postman
A complete `postman_collection.json` is included in the root directory. Import it directly into Postman to explore and test the entire API surface automatically. Ensure you set the `{{baseUrl}}` variable and `{{token}}` for authenticated routes.

---

## 🚢 Deployment (Vercel)
This backend is optimized for serverless deployment on Vercel:
1. Ensure `vercel.json` is correctly configured to rewrite all routes to `src/app.js` or `api/index.js` depending on your build step.
2. In the Vercel Dashboard, navigate to **Settings > Environment Variables** and mirror your `.env` configuration.
3. Deploy directly via Vercel CLI or GitHub integration.
