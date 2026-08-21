# Vendio — Backend Documentation

> Everything about the **backend** of Vendio, your local marketplace.
> This document is the backend counterpart of `docs/requirements.md` — it collects
> all backend-related requirements, the current codebase state, and the target API/design.

---

## 📋 1. Overview

Vendio's backend is an **Express.js + MongoDB (Mongoose)** REST API that powers the
marketplace. It is responsible for:

- **Authentication** — signup, login, logout, JWT issuance & verification.
- **Password recovery** — forgot password → OTP by email → verify → reset.
- **Product management** — CRUD for products, with **ownership-based authorization**.
- **Cloudinary** image hosting for product images.
- **Search / filter / sort** on the marketplace listing.

> ✅ **Current status: implemented.** All routes, models, middlewares, controllers
> and helpers described below are built and verified against the requirements in
> `docs/requirements.md`. Sections previously marked **Target** are now live.

---

## 🛠 2. Tech Stack & Dependencies

Required by the challenge (`docs/requirements.md` → Technology Stack):

| Layer | Technology |
| --- | --- |
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Auth tokens | JWT (`jsonwebtoken`) |
| Password hashing | bcrypt (`bcryptjs`) |
| Email / OTP | Nodemailer |
| Image hosting | Cloudinary |

Installed in `backend/package.json` (`"type": "module"` — ESM):

```json
{
  "scripts": {
    "start": "node server.js",
    "start:dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cloudinary": "^2.10.1",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^9.9.3",
    "nodemailer": "^9.0.5",
    "nodemon": "^3.1.14"
  }
}
```

---

## 📁 3. Project Structure

```text
backend/
│
├── config/
│   └── config.js            # Loads .env, exports all environment config
├── middlewares/
│   ├── auth.js              # JWT `protect` middleware (attaches req.userId)
│   └── error.js             # notFound 404 + central error handler
├── models/
│   ├── User.js              # bcrypt pre-save hashing, matchPassword, OTP fields
│   └── Product.js           # seller ref, category/condition enums, timestamps
├── utils/
│   ├── cloudinary.js        # Cloudinary config + uploadImage / deleteImage
│   └── email.js             # Nodemailer transporter + generateOtp / sendOtpEmail
├── app.js                   # App builder + all route definitions/handlers
│                            #   (cors, json 10mb, auth + product endpoints, 404, errors)
├── server.js                # Express bootstrap + Mongo connect + listen
├── .env                     # Secrets (git-ignored — never commit)
├── .env.example             # Template keys with placeholder values
└── package.json
```

> **Note:** The structure matches `docs/requirements.md` (models / middleware /
> config / utils / app.js / server.js). There are **no separate `controllers/` or
> `routes/` folders** — all route handlers live directly in `app.js`.

---

## ⚙️ 4. Configuration & Environment Variables

Secrets are loaded via `dotenv` in `config/config.js`. **Never hard-code credentials**
and **never commit `.env`** (it is in `.gitignore`).

`.env` keys expected (as read by `backend/config/config.js`):

| Key | Purpose | Required |
| --- | --- | --- |
| `PORT` | Server port (default `50001`) | optional |
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Secret for signing/verifying JWTs | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | ✅ (image upload) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ (image upload) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ (image upload) |
| `SMTP_SERVICE` | Email service (e.g. Gmail) for Nodemailer | ✅ (forgot password) |
| `SMTP_EMAIL` | Sender email address | ✅ (forgot password) |
| `SMTP_APP_PASS` | App password for the sender account | ✅ (forgot password) |

> Provide a populated `.env.example` with placeholder values for the final submission.

---

## ▶️ 5. Running the Backend

```bash
cd backend
npm install        # first time
npm start          # production: node server.js
npm run start:dev  # dev: nodemon server.js (auto-restart)
```

On boot, `server.js`:

1. Connects to MongoDB via `mongoose.connect(MONGODB_URI)` (logs
   `MongoDB Connected` on success, `Error in MongoDB Connection` on failure).
2. Creates the Express app and applies global middleware:
   - `express.json()` — parse JSON bodies.
   - `cors()` — allow cross-origin requests from the frontend.
3. Listens on `PORT` → `http://localhost:50001`.

---

## 🔐 6. Authentication System

### Target — Signup

- Fields: **Full Name, Email, Password, Confirm Password**.
- Email must be **unique** (duplicates rejected).
- Password must be **bcrypt-hashed** — never stored in plain text.
- Proper validation + clear error messages.

### Target — Login

- Registered user logs in with **email + password**.
- On success, issue a **JWT token**.
- Protected routes only accessible with a valid token.
- Invalid credentials → proper error response.

### Target — Logout

- User logs out cleanly; protected functionality must no longer be reachable
  (frontend discards the token; backend should reject/invalidate as designed).

### Target — JWT / Protected APIs

- Protected APIs secured via an **auth middleware** that verifies the token.

---

## 📧 7. Forgot Password & OTP Verification

Expected flow (per requirements):

1. User enters their **registered email**.
2. Backend sends an **OTP** to that email via **Nodemailer**.
3. User submits the received OTP.
4. Backend **verifies the OTP**.
5. On success, user sets a **new password**.
6. New password is **bcrypt-hashed** and updated in the database.

Mandatory behaviors:

- **Invalid OTP** → rejected.
- **OTP expiry** → OTP must expire after a time limit.
- **Invalid / non-existing email** → handled gracefully (no leaking whether email exists).
- New password must **not** be stored in plain text.

---

## 🛍 8. Product Management

### Target — Product fields (minimum)

| Field | Notes |
| --- | --- |
| Title | — |
| Description | — |
| Price | — |
| Category | Electronics, Fashion, Furniture, Vehicles, Books, Other |
| Condition | `New` or `Used` |
| Location | — |
| Image | Uploaded to Cloudinary; URL stored in DB |
| Seller | **Set by backend from JWT** — never selected by the frontend |
| Created / Updated | timestamps |

### Target — Product CRUD

| Operation | Who can do it |
| --- | --- |
| **Create** | Any authenticated user |
| **Read (list / single)** | Anyone |
| **Update** | **Only the owner** |
| **Delete** | **Only the owner** |

### Target — Authorization (important)

Authentication ≠ authorization. Even if a logged-in **User B** manually calls
`DELETE /api/products/:id` on **User A**'s product, the backend **must reject** it:

```text
User A → Creates Product #123
User B → DELETE /api/products/123  →  ❌ Access Denied
```

Ownership validation is **mandatory on the backend**. Hiding Edit/Delete buttons in
the frontend does **not** count as authorization.

---

## 🖼 9. Cloudinary Image Upload

- Image upload is **mandatory** when creating a product.
- Images must **not** be stored permanently on the local server / project.
- Image is uploaded to **Cloudinary**; the returned URL is saved in MongoDB.
- The URL is used for the listing & product detail page display.
- Cloudinary integration is a self-learning part of the task — see Cloudinary docs.

---

## 🔎 10. Marketplace Listing — Search / Filter / Sort

Target query support on `GET /api/products` (all combinable — see section 11):

| Feature | Query params |
| --- | --- |
| **Search** (title, case-insensitive) | `?search=iphone` |
| **Category filter** | `?category=electronics` |
| **Condition filter** | `?condition=used` |
| **Price sort Low → High** | `?sort=price_asc` |
| **Price sort High → Low** | `?sort=price_desc` |

Combined example:

```text
GET /api/products?search=iphone&category=electronics&condition=used&sort=price_asc
```

→ *Used Electronics, "iPhone" search, cheapest first.*

### Target — My Products

- Logged-in user sees **only their own** products (list scoped to the JWT user).
- From there they can view / edit / delete their products.

---

## 🗄 11. Target Database Schema

### User

```javascript
{
  name,
  email,
  password,      // bcrypt hash
  isVerified,    // e.g. true after OTP-verified signup/reset
  createdAt,
  updatedAt
}
```

### Product

```javascript
{
  title,
  description,
  price,
  category,
  condition,
  location,
  image,         // Cloudinary URL
  seller,        // ObjectId reference → User
  createdAt,
  updatedAt
}
```

`seller` should be managed as a **reference/ObjectId to the User document**.
Invalid MongoDB IDs must **not** crash the app (validate before querying).

---

## 🔌 12. Target API Surface

A complete list of the endpoints to build, mapped to the requirements:

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | public | Create account (bcrypt hash, unique email) |
| POST | `/api/auth/login` | public | Login, return JWT |
| POST | `/api/auth/logout` | user | Logout |
| POST | `/api/auth/forgot-password` | public | Send OTP email |
| POST | `/api/auth/verify-otp` | public | Verify OTP |
| POST | `/api/auth/reset-password` | public | Set new password (bcrypt) |
| POST | `/api/products` | user | Create product + Cloudinary upload |
| GET | `/api/products` | public | List with `search` / `category` / `condition` / `sort` |
| GET | `/api/products/:id` | public | Single product details |
| GET | `/api/products/my` | user | Current user's products (My Products) |
| PUT/PATCH | `/api/products/:id` | owner | Update own product |
| DELETE | `/api/products/:id` | owner | Delete own product |

> Route paths are a recommendation; keep them RESTful and consistent.

> **Response format:** every response carries a `status` boolean alongside the HTTP
> status code — `status: true` for 2xx/3xx success, `status: false` for 4xx/5xx
> errors (e.g. `{ "status": true, ... }` and `{ "status": false, "message": "..." }`).

---

## ✅ 13. Backend Development Rules (from requirements)

- Passwords never stored in plain text (**bcrypt**).
- JWT authentication properly implemented.
- Protected APIs secured via middleware.
- Authorization checked **on the backend** (ownership).
- Sensitive credentials never hard-coded — use `.env`.
- `.env` is **not** pushed to GitHub.
- Proper HTTP status codes.
- Proper error handling in all APIs.
- Duplicate email handled.
- Invalid MongoDB IDs must not crash the app.
- Frontend ↔ backend properly connected.
- Code readable and well-structured.

---

## 🧪 14. Testing Scenarios (backend)

Minimum scenarios to verify before submission:

```text
Authentication:  Signup → Login → JWT → Protected Route
Forgot Password: Email → OTP → Verify OTP → Reset Password → Login
Product:         Login → Create Product → Cloudinary Upload → View Product
Ownership:       User A create → User B login → B updates/deletes A's product → REJECTED
Marketplace:     Products → Search → Filter → Sort → Product Details
```

---

## 📊 15. Evaluation Weighting (backend-relevant)

| Area | Marks |
| --- | --- |
| Authentication System (signup, login, bcrypt, validation, forgot password, OTP, reset) | 15 |
| JWT & Protected APIs | 10 |
| Product CRUD | 15 |
| Authorization / Ownership security | 15 |
| Cloudinary image upload | 15 |
| Search / Filter / Sorting | 10 |
| Frontend + Backend Integration | 10 |
| Code Quality & Project Structure | 5 |

Ownership security (15) and Cloudinary (15) are called out as the **most important**
evaluation points after core auth — plan the backend around them.

---

## ✅ 16. Remaining Work (TODO)

All scaffold gaps are closed and verified:

- [x] Create `models/User.js` and `models/Product.js` (per section 11).
- [x] Create auth middleware (`middlewares/`) for JWT verification.
- [x] Create Cloudinary upload helper (`utils/`).
- [x] Create email / OTP helper using Nodemailer (`utils/`).
- [x] Implement auth routes (signup, login, logout, forgot/verify/reset).
- [x] Implement product CRUD + ownership checks.
- [x] Implement search / filter / sort on the listing query.
- [x] Populate `.env.example` with placeholder values.
- [x] Wire `app.js` as the app builder (routes, 404, error handling).

> ⚠️ **Note on ports:** `config/config.js` defaults to `PORT=50001`, but the local
> `.env` currently sets `PORT=5000` — the frontend should point at whatever the
> running server logs on boot (`http://localhost:5000`).
