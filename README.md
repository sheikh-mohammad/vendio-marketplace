# Vendio — Your Local Marketplace

> **Buy & sell anything, right in your neighborhood.**

Vendio is a full-stack mini marketplace application where users can create accounts,
log in, list their own products and browse, search, filter and sort everything the
community is selling. This is the frontend — built with **pure HTML + CSS**
(no frameworks, per the challenge rules), designed to be light, professional and fun to use.

![Vendio](frontend/images/logo.svg)

---

## ✨ Features (Frontend)

### Public pages
| Page | File |
| --- | --- |
| Home / Marketplace | [`frontend/index.html`](frontend/index.html) |
| Product Detail | [`frontend/product.html`](frontend/product.html) |
| Signup | [`frontend/signup.html`](frontend/signup.html) |
| Login | [`frontend/login.html`](frontend/login.html) |
| Forgot Password | [`frontend/forgot-password.html`](frontend/forgot-password.html) |
| OTP Verification | [`frontend/otp-verification.html`](frontend/otp-verification.html) |
| Reset Password | [`frontend/reset-password.html`](frontend/reset-password.html) |

### Protected pages
| Page | File |
| --- | --- |
| Add Product | [`frontend/add-product.html`](frontend/add-product.html) |
| My Products | [`frontend/my-products.html`](frontend/my-products.html) |
| Edit Product | [`frontend/edit-product.html`](frontend/edit-product.html) |

### UI highlights
- **Light, professional & exciting** — vibrant blue brand, emerald price accents, soft gradients & shadows.
- **Fully local assets** — self-hosted Rubik + Nunito Sans (woff2), inline SVG icons, local product imagery. **No CDNs.**
- **Responsive** — mobile-first at 375 / 768 / 1024 / 1440px, with a CSS-only mobile menu.
- **Accessible** — visible focus rings, keyboard-friendly, `prefers-reduced-motion`, contrast-safe colors.
- **Form-ready** — every form includes labels, hints, inline error slots and validation styling, wired up to be powered by JS next.

---

## 🗂 Project Structure

```text
mini-hackathon/
│
├── backend/                 # Express + MongoDB API (in progress)
│   ├── app.js
│   └── server.js
│
├── frontend/
│   ├── css/
│   │   ├── style.css        # Vendio design system + all component styles
│   │   ├── fonts.css        # @font-face rules (local)
│   │   └── fonts/           # Rubik + Nunito Sans .woff2
│   ├── images/
│   │   ├── logo.svg
│   │   └── products/        # 12 product placeholder SVGs
│   ├── js/                  # (reserved — JS integration comes next)
│   ├── index.html
│   ├── product.html
│   ├── signup.html
│   ├── login.html
│   ├── forgot-password.html
│   ├── otp-verification.html
│   ├── reset-password.html
│   ├── add-product.html
│   ├── my-products.html
│   └── edit-product.html
│
├── docs/
│   └── requirements.md
│
└── design-system/
    └── vendio/MASTER.md     # design tokens & rationale
```

---

## 🎨 Design System

Tokens and reasoning live in [`design-system/vendio/MASTER.md`](design-system/vendio/MASTER.md)
(generated with the **ui-ux-pro-max** skill). Highlights:

- **Palette** — primary `#2563EB` (trust), accent `#059669` (prices/success), soft `#F6F9FF` background.
- **Typography** — Rubik (display) + Nunito Sans (body), self-hosted.
- **Motion** — 150–300ms transitions, `cubic-bezier(.2,.7,.3,1)`, respects reduced-motion.
- **Anti-patterns avoided** — no emoji-as-icons (all inline SVG), no flat-without-depth, no text-heavy pages.

---

## 🚀 Running the Frontend

No build step and no dependencies — just open the pages:

```bash
# Option A: open directly
start frontend/index.html

# Option B: serve locally (e.g. VS Code Live Server, or python)
cd frontend
python -m http.server 5500
# then visit http://localhost:5500
```

The UI is static for now. Vanilla-JS `fetch()` integration with the Express/MongoDB API is the next milestone.

---

## 🧭 Page Flow

```text
Home (browse) ──► Product Detail
      │
      ├──► Signup ──► Login
      │
      ├──► Forgot Password ──► OTP ──► Reset Password ──► Login
      │
      └──► Add Product / My Products / Edit Product   (logged in)
```

---

## 📝 License

Built for the Mini Marketplace Full Stack Development Challenge.
