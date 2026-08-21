# Vendio — Frontend Documentation

> Everything about the **frontend** of Vendio, your local marketplace.
> This document is the frontend counterpart of `docs/requirements.md` — it collects
> all frontend-related requirements, the current codebase state, and the target
> integration plan.

---

## 📋 1. Overview

Vendio's frontend is a **pure HTML + CSS + Vanilla JavaScript** app (no frameworks —
per the challenge rules). It renders the marketplace, lets users sign up / log in,
manage their own products, and browse / search / filter / sort everything the
community is selling.

> ⚠️ **Current status: HTML + CSS complete, JS pending.** All pages and the design
> system exist; forms are styled and wired up to be powered by JS, but the
> `fetch()` API integration against the backend is **not implemented yet**.
> Sections marked **Target** describe what must be built.

---

## 🛠 2. Tech Stack & Constraints

Required by the challenge (`docs/requirements.md` → Technology Stack):

| Layer | Technology |
| --- | --- |
| Markup | HTML |
| Styling | CSS |
| Behavior | JavaScript (Vanilla) |
| API calls | `fetch()` API |
| Auth token | JWT (stored client-side) |

> **Important rule:** React, Next.js or any frontend framework is **not allowed**.
> The frontend must be HTML, CSS and Vanilla JavaScript.

---

## 📁 3. Project Structure (current)

```text
frontend/
│
├── index.html              # Home / Marketplace listing
├── product.html            # Product detail
├── signup.html             # Create account
├── login.html              # Login
├── forgot-password.html    # Enter email to receive OTP
├── otp-verification.html   # Enter received OTP
├── reset-password.html     # Set a new password
├── add-product.html        # (protected) Create a product
├── my-products.html        # (protected) My products — view/edit/delete
├── edit-product.html       # (protected) Edit an existing product
│
├── css/
│   ├── style.css           # Vendio design system + all component styles
│   ├── fonts.css           # @font-face rules (local)
│   └── fonts/              # Rubik + Nunito Sans (.woff2, self-hosted)
│
└── images/
    ├── logo.svg
    └── products/           # 12 local product placeholder SVGs
```

> A `js/` folder does not exist yet — create it (e.g. `js/api.js`, per-page scripts)
> when wiring the API integration.

---

## 🖥 4. Required Pages

### Public pages

| # | Page | File | Purpose |
| --- | --- | --- | --- |
| 1 | Home / Marketplace | `index.html` | Browse all products, search / filter / sort |
| 2 | Product Detail | `product.html` | Full details of a single product |
| 3 | Signup | `signup.html` | Create an account |
| 4 | Login | `login.html` | Log in |
| 5 | Forgot Password | `forgot-password.html` | Request OTP via email |
| 6 | OTP Verification | `otp-verification.html` | Verify the received OTP |
| 7 | Reset Password | `reset-password.html` | Set a new password |

### Protected pages (require login)

| # | Page | File |
| --- | --- | --- |
| 8 | Add Product | `add-product.html` |
| 9 | My Products | `my-products.html` |
| 10 | Edit Product | `edit-product.html` |

---

## 🎨 5. UI / UX & Design System

Current state (already built):

- **Brand** — vibrant blue brand color, emerald price accents, soft gradients & shadows.
- **Fully local assets** — self-hosted Rubik + Nunito Sans (woff2), inline SVG icons,
  local product imagery. **No CDNs.**
- **Responsive** — mobile-first at 375 / 768 / 1024 / 1440px, CSS-only mobile menu
  (animated into a close X on mobile).
- **Accessible** — visible focus rings, keyboard-friendly, `prefers-reduced-motion`,
  contrast-safe colors.
- **Form-ready** — every form has labels, hints, inline error slots and validation
  styling, ready to be powered by JS.

---

## 🔌 6. API Integration (Target)

All API calls must use Vanilla JavaScript `fetch()`:

```javascript
fetch("/api/products")
```

### Public endpoints the frontend consumes

| Feature | Request | Notes |
| --- | --- | --- |
| Marketplace listing | `GET /api/products` | All products |
| Search (title) | `GET /api/products?search=iphone` | Case-insensitive |
| Category filter | `GET /api/products?category=electronics` | Electronics, Fashion, Furniture, Vehicles, Books, Other |
| Condition filter | `GET /api/products?condition=used` | `new` / `used` |
| Price sort | `GET /api/products?sort=price_asc` | Low → High |
| Price sort | `GET /api/products?sort=price_desc` | High → Low |
| Combined | `GET /api/products?search=iphone&category=electronics&condition=used&sort=price_asc` | All combined |
| Single product | `GET /api/products/:id` | Product detail page |

The marketplace toolbar (already built in `index.html`) maps to the API params
`search`, `category`, `condition`, `sort=price_asc|price_desc`, and includes an
empty-data state for when no results match.

### Authed endpoints the frontend consumes

| Feature | Request | Notes |
| --- | --- | --- |
| Signup | `POST /api/auth/signup` | name, email, password, confirm password |
| Login | `POST /api/auth/login` | returns JWT; store it for subsequent calls |
| Logout | `POST /api/auth/logout` | clear session/token |
| Forgot password | `POST /api/auth/forgot-password` | send OTP email |
| Verify OTP | `POST /api/auth/verify-otp` | verify received OTP |
| Reset password | `POST /api/auth/reset-password` | set new password |
| Create product | `POST /api/products` | include Cloudinary image upload |
| My products | `GET /api/products/my` | only current user's products |
| Update product | `PUT/PATCH /api/products/:id` | owner only |
| Delete product | `DELETE /api/products/:id` | owner only |

### Required UI states (all API calls)

Handle every state on every request:

- **Loading** — indicator while the request is in flight.
- **Success** — render data / success message.
- **Error** — user-friendly, understandable message (never a silent failure).
- **Empty data** — a proper empty state when no results exist.

### Product card (home listing) — minimum per item

Image · Title · Price · Category · Condition · Location → clicking opens the detail page.

---

## 🧾 7. Form Requirements (Target)

| Form | Fields / Behavior |
| --- | --- |
| **Signup** | Full Name, Email, Password, Confirm Password; validate + show errors; confirm password must match |
| **Login** | Email, Password; invalid credentials → proper error message |
| **Forgot Password** | Registered email → triggers OTP email |
| **OTP Verification** | Enter received OTP |
| **Reset Password** | New password (+ confirm) |
| **Add / Edit Product** | Title, Description, Price, Category, Condition, Location, **Image (mandatory upload)** |
| **Edit/Delete visibility** | Show Edit/Delete only on your own products (note: real authorization is enforced by the backend) |

Product **Condition** options: `New` / `Used`.
Product **Category** options: Electronics, Fashion, Furniture, Vehicles, Books, Other.
The **seller** is identified by the backend from the JWT — the frontend does **not** select it.

---

## ♿ 8. Responsiveness & Accessibility

- Mobile-first breakpoints: **375 / 768 / 1024 / 1440px**.
- CSS-only mobile navigation.
- Visible focus rings & keyboard support.
- `prefers-reduced-motion` respected.
- Contrast-safe color choices.

---

## ✅ 9. Frontend Development Rules (from requirements)

- API calls via Vanilla JS `fetch()` — no frameworks.
- Handle loading / success / error / empty states on every call.
- API failures must **never silently fail** — always show a user-friendly message.
- Product image upload is mandatory on create.
- Edit/Delete buttons shown only for your own products, but ownership is enforced
  backend-side (frontend hiding is **not** counted as authorization).

---

## 🧪 10. Testing Scenarios (frontend-relevant)

```text
Authentication:  Signup → Login → JWT → Protected Route
Forgot Password: Email → OTP → Verify OTP → Reset Password → Login
Product:         Login → Create Product → Cloudinary Upload → View Product
Ownership:       User A create → User B login → B tries to edit/delete A's product → blocked
Marketplace:     Products → Search → Filter → Sort → Product Details
```

---

## 📊 11. Evaluation Weighting (frontend-relevant)

| Area | Marks |
| --- | --- |
| Frontend + Backend Integration | 10 |
| UI / UX & Responsiveness | 5 |
| (Backend marks for auth/CRUD/authorization/Cloudinary/search are unaffected by UI) | — |

---

## 🚧 12. Remaining Work (TODO)

- [ ] Add a `frontend/js/` folder and connect every page to the API with `fetch()`.
- [ ] Wire signup/login → store JWT (e.g. `localStorage`) → redirect.
- [ ] Protect pages (redirect to login if no valid token).
- [ ] Load marketplace products into `index.html` with loading / success / error / empty states.
- [ ] Implement search / filter / sort toolbar wiring to `?search&category&condition&sort`.
- [ ] Product detail page loads data from `GET /api/products/:id`.
- [ ] Forgot-password → OTP → reset flow across the three pages.
- [ ] Add/Edit product forms → submit with mandatory image upload (Cloudinary).
- [ ] My Products → list, edit, delete only the current user's products.
- [ ] Logout button clears the session (logged-in header control already built).
