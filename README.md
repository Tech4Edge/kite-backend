# 🪁 Kite Backend — REST API & Admin Engine

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-FB015B?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Images-Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

**The complete REST API backend for the Kite FMCG platform — handling products, promotions, orders, admin authentication, image management, email notifications, and real-time events.**

</div>

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [Repository Structure](#repository-structure)
5. [Data Models](#data-models)
6. [API Reference](#api-reference)
7. [Authentication](#authentication)
8. [Environment Variables](#environment-variables)
9. [Getting Started (Local)](#getting-started-local)
10. [Scripts & Utilities](#scripts--utilities)
11. [Testing](#testing)
12. [Deployment (Vercel)](#deployment-vercel)
13. [Frontend Integration](#frontend-integration)
14. [Real-Time Notifications (Pusher)](#real-time-notifications-pusher)
15. [Email System (EmailJS)](#email-system-emailjs)
16. [Image Management (Cloudinary)](#image-management-cloudinary)
17. [Security Model](#security-model)
18. [Architecture Decisions](#architecture-decisions)

---

## Project Overview

The Kite backend is an **Express.js REST API** connected to **MongoDB Atlas** (via Mongoose). It serves as the single source of truth for all product catalog data, promotional packages, customer orders, and admin operations.

### What it powers

- **Public storefront** (frontend React SPA) — product listings, promotions, order placement
- **Admin panel** — full CRUD on products & promotions, order status management, site settings
- **Email automation** — order confirmation to customers + admin notification via EmailJS
- **Real-time admin alerts** — Pusher events fired on new orders
- **Image hosting pipeline** — Cloudinary upload from multipart form data

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│              CLIENT (React SPA)             │
│         https://kite-frontend.vercel.app    │
└────────────────────┬────────────────────────┘
                     │ HTTPS REST calls
                     ▼
┌─────────────────────────────────────────────┐
│       VERCEL SERVERLESS (kite-backend)      │
│   api/[...all].js  →  Express App Router   │
│                                             │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │  Public API │  │  Admin API (JWT auth) │ │
│  │  /products  │  │  /admin/products      │ │
│  │  /promotions│  │  /admin/promotions    │ │
│  │  /orders    │  │  /admin/orders        │ │
│  │  /settings  │  │  /admin/login         │ │
│  └──────┬──────┘  └──────────┬───────────┘ │
│         └─────────┬──────────┘             │
│                   ▼                        │
│         ┌──────────────────┐               │
│         │    Mongoose ODM   │               │
│         └────────┬─────────┘               │
└──────────────────│──────────────────────────┘
                   │ MongoDB Wire Protocol
                   ▼
        ┌────────────────────┐
        │   MongoDB Atlas     │
        │   kite database     │
        │  ┌──────────────┐  │
        │  │  products    │  │
        │  │  orders      │  │
        │  │  promotions  │  │
        │  │  settings    │  │
        │  └──────────────┘  │
        └────────────────────┘

Side Integrations:
  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐
  │  Cloudinary  │  │   EmailJS     │  │     Pusher        │
  │  Image CDN   │  │  Email Send   │  │  Real-time Events │
  └──────────────┘  └───────────────┘  └──────────────────┘
```

---

## Tech Stack

| Dependency | Version | Role |
|---|---|---|
| **express** | 4.x | HTTP server & routing |
| **mongoose** | 8.4 | MongoDB ODM |
| **jsonwebtoken** | 9 | Admin JWT auth |
| **bcryptjs** | 2.4 | Password hash comparison |
| **multer** | 2 | Multipart form parsing for image uploads |
| **cloudinary** | 2.9 | Cloud image upload & URL generation |
| **sharp** | 0.34 | Server-side image compression/conversion |
| **@emailjs/nodejs** | 5 | Transactional email (order confirmations) |
| **pusher** | 5.3 | Real-time WebSocket events to admin panel |
| **helmet** | 8 | HTTP security headers |
| **cors** | 2.8 | Cross-origin request policy |
| **compression** | 1.8 | Gzip response compression |
| **dotenv** | 16 | `.env` file loading |
| **nodemon** | 3 | Dev hot-reload |
| **jest** | 29 | Test runner |
| **supertest** | 7 | HTTP integration testing |

---

## Repository Structure

```
kite-backend/
├── api/
│   └── [...all].js          # Vercel serverless entry — wraps Express app
├── src/
│   ├── index.js             # Local dev entry point (starts Express server)
│   ├── app.js               # Express app factory (middleware, routes, CORS)
│   ├── config/
│   │   └── loadEnv.js       # Loads .env before anything else
│   ├── models/
│   │   ├── Product.js       # Mongoose schema: product catalog
│   │   ├── Order.js         # Mongoose schema: customer orders
│   │   ├── PromotionPackage.js  # Mongoose schema: promotional bundles
│   │   └── Settings.js      # Mongoose schema: site-wide settings
│   ├── routes/
│   │   ├── products.js      # GET /api/products (public)
│   │   ├── promotions.js    # GET /api/promotions (public)
│   │   ├── orders.js        # POST /api/orders (public — order placement)
│   │   ├── settings.js      # GET+PUT /api/settings
│   │   ├── adminAuth.js     # POST /api/admin/login
│   │   ├── adminProducts.js # CRUD /api/admin/products (protected)
│   │   ├── adminPromotions.js # CRUD /api/admin/promotions (protected)
│   │   └── adminOrders.js   # GET+PATCH /api/admin/orders (protected)
│   ├── utils/
│   │   ├── db.js            # MongoDB connection (singleton with caching)
│   │   ├── adminAuthMiddleware.js  # JWT verify middleware
│   │   ├── cloudinary.js    # Cloudinary SDK init + uploadImageBuffer()
│   │   ├── email.js         # EmailJS send functions (order + status update)
│   │   └── pusher.js        # Pusher SDK init (conditional on env vars)
│   └── __tests__/
│       └── health.test.js   # Basic health endpoint test
├── scripts/
│   ├── seedProductsCloudinary.js  # Seed products from JSON + upload images
│   ├── generateSitemap.js         # Generate XML sitemap from product list
│   ├── convertFolderToWebp.js     # Convert local images to .webp
│   └── seedMatches.js             # Seed match products
├── jest.config.cjs          # Jest config (ESM support)
├── package.json
└── vercel.json              # Vercel function routing config
```

---

## Data Models

### `Product`

The core product entity. Supports a rich schema for FMCG products with multiple variants, brands, sizes/SKUs, and facilities.

```javascript
{
  id: String,           // Unique slug-like identifier (e.g. "kite-matches")
  category: String,     // Product category
  title: String,        // Display name
  productType: String,  // e.g. "matches", "detergents", "dish-wash", "general"
  navGroup: String,     // Navigation grouping label
  iconType: Enum,       // "fire" | "layer" | "dish-wash" | null
  description: String,
  image: String,        // Primary Cloudinary URL
  images: [String],     // Gallery images (Cloudinary URLs)
  color: String,        // Brand accent color
  tagline: String,
  features: [String],   // Bullet point features list
  variants: [{          // Product variants (e.g. box sizes)
    name, detail, packing, price
  }],
  variantImages: [{     // Images per variant
    name, image
  }],
  brands: [{            // Sub-brand entries
    name, category, description, image, tagline, features, variants
  }],
  sizes: [{             // Physical size options
    size, avgSticks, matchesPerCotton
  }],
  skus: [{              // SKU-level pricing/packing
    size, gramage, packing, price
  }],
  facilities: [{        // Manufacturing facilities
    name, location, note
  }],
  services: String,
  shippingCost: Number,     // Override for product-specific shipping
  displayOrder: Number,     // Sort order on products page
  carouselOrder: Number,    // Sort order on homepage carousel
  isActive: Boolean,        // Soft-disable without deleting
  showOnLanding: Boolean,   // Show on homepage
  showInProductsPage: Boolean,
  showInNavbar: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### `Order`

Captures full order data from the checkout form. Supports three order types: single product, single promotion, or a mixed cart.

```javascript
{
  type: Enum,           // "product" | "promotion" | "cart"
  productId: String,    // For type="product"
  promotionId: String,  // For type="promotion"
  selectedSkuOrSize: String,
  quantity: Number,     // For single-item orders
  items: [{             // For type="cart"
    itemType,           // "product" | "promotion"
    productId, promotionId,
    brandName, selectedVariant,
    quantity, price
  }],
  totalAmount: Number,
  shippingCost: Number,
  customerName: String,
  phone: String,        // Validated: Pakistani format (03xx, +923xx, 923xx)
  email: String,
  address: String,
  city: String,
  note: String,
  paymentMethod: Enum,  // "COD" | "Easypaisa" | "JazzCash"
  status: Enum,         // "pending" | "confirmed" | "shipped" | "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

### `PromotionPackage`

Bundled promotional deals containing multiple products at a combined price.

```javascript
{
  id: String,
  title: String,
  category: String,
  description: String,
  image: String,        // Primary Cloudinary URL
  images: [String],     // Gallery images
  items: [{             // Constituent products
    product, quantity, price
  }],
  totalQuantity: Number,  // Auto-computed from items
  totalPrice: Number,     // Auto-computed from items
  shippingCost: Number,
  displayOrder: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### `Settings`

Singleton document for site-wide configuration.

```javascript
{
  defaultShippingCost: Number,  // Default: 150 (Rs)
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Reference

### Base URL

| Environment | Base URL |
|---|---|
| Local dev | `http://localhost:5000/api` |
| Production | `https://your-backend.vercel.app/api` |

---

### 🔓 Public Endpoints

#### Health Check

```
GET /api/health
```
Returns `{ "status": "ok" }`. Used by Vercel as the root redirect target.

---

#### Products

```
GET /api/products
```
Returns all active products.

```
GET /api/products/:id
```
Returns a single product by its `id` field.

**Response shape (array item):**
```json
{
  "_id": "...",
  "id": "kite-matches",
  "category": "Safety Matches",
  "title": "Kite Matches",
  "image": "https://res.cloudinary.com/...",
  "images": ["..."],
  "variants": [{ "name": "Standard", "detail": "...", "packing": 100, "price": 450 }],
  "isActive": true,
  "showOnLanding": true,
  ...
}
```

---

#### Promotions

```
GET /api/promotions
```
Returns all active promotional packages sorted by `displayOrder`.

---

#### Orders (Place Order)

```
POST /api/orders
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "product",           // "product" | "promotion" | "cart"
  "productId": "kite-matches", // required for type="product"
  "promotionId": "...",        // required for type="promotion"
  "selectedSkuOrSize": "100g",
  "quantity": 2,               // required for non-cart orders
  "items": [...],              // required for type="cart"
  "customerName": "Ahmed Ali",
  "phone": "03001234567",
  "email": "ahmed@example.com",
  "address": "123 Main Street",
  "city": "Lahore",
  "note": "Please call before delivery",
  "paymentMethod": "COD",      // "COD" | "Easypaisa" | "JazzCash"
  "totalAmount": 950,
  "shippingCost": 150
}
```

**Validations:**
- `phone` must match Pakistani number format: `/^(?:\+92|92|0)3\d{9}$/`
- `quantity` must be integer between 1–1000 (for non-cart orders)
- `paymentMethod` must be one of the allowed enum values
- For `type="cart"`, `items` array must have at least one entry

**Success:** `201 Created` with the created order object.

On success, the backend **asynchronously** (fire-and-forget):
1. Sends order confirmation email to admin (`ADMIN_ORDER_EMAIL`)
2. Sends order confirmation email to customer (if `EMAILJS_TEMPLATE_ID_CUSTOMER` set)
3. Triggers Pusher event on `admin-notifications` channel

---

#### Settings

```
GET /api/settings
```
Returns `{ "defaultShippingCost": 150, ... }`. Auto-creates the singleton if it doesn't exist.

---

### 🔒 Admin Endpoints (JWT Required)

All admin routes require the `Authorization: Bearer <token>` header.

#### Authentication

```
POST /api/admin/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "your-password" }
```

**Response:** `{ "token": "<jwt>" }`

The token is valid for **8 hours**. Admin email and bcrypt-hashed password are stored exclusively in environment variables — **not in the database**.

---

#### Admin — Products

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/products` | List all products (incl. inactive) |
| `POST` | `/api/admin/products` | Create a product (multipart/form-data) |
| `PUT` | `/api/admin/products/:id` | Update a product (multipart/form-data) |
| `DELETE` | `/api/admin/products/:id` | Hard delete a product |

**Image Upload Fields (multipart):**
- `productImages` — array of files (first = primary, rest = gallery)
- `image` — single primary image file (alternative to `productImages`)
- `images` — gallery image files
- `variantImageFile_0`, `variantImageFile_1`, ... — per-variant images
- `brandImageFile_0`, `brandImageFile_1`, ... — per-brand images

Files are uploaded to Cloudinary synchronously before the DB write.

**JSON fields** (sent as stringified JSON within the multipart body):
- `features`, `variants`, `variantImages`, `brands`, `sizes`, `skus`, `facilities`, `images`

---

#### Admin — Promotions

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/promotions` | List all promotions |
| `POST` | `/api/admin/promotions` | Create a promotion (multipart/form-data) |
| `PUT` | `/api/admin/promotions/:id` | Update a promotion |
| `DELETE` | `/api/admin/promotions/:id` | Delete a promotion |

`totalQuantity` and `totalPrice` are **auto-computed** from the `items` array on create/update.

---

#### Admin — Orders

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/orders` | List all orders (newest first) |
| `GET` | `/api/admin/orders/:id` | Get a single order by MongoDB `_id` |
| `PATCH` | `/api/admin/orders/:id/status` | Update order status |

**Status Update Body:**
```json
{ "status": "confirmed" }  // "pending" | "confirmed" | "shipped" | "cancelled"
```

On status update, a **status update email** is sent to the customer (fire-and-forget).

---

#### Admin — Settings

| Method | Path | Description |
|---|---|---|
| `PUT` | `/api/settings` | Update default shipping cost (admin auth required) |

---

## Authentication

### JWT Flow

```
1. Admin POSTs to /api/admin/login with email + password
2. Backend compares email against ADMIN_EMAIL env var
3. Backend compares password against ADMIN_PASSWORD_HASH (bcrypt)
4. On success: signs a JWT with { email } payload, 8h expiry
5. Client stores token in localStorage["adminToken"]
6. All subsequent admin requests include: Authorization: Bearer <token>
7. requireAdminAuth middleware verifies the token on each request
```

### Generating a Password Hash

To generate the bcrypt hash for `ADMIN_PASSWORD_HASH`:

```bash
node -e "const b=require('bcryptjs'); b.hash('your-password', 10).then(h => console.log(h))"
```

Set the output as `ADMIN_PASSWORD_HASH` in your `.env`.

---

## Environment Variables

Create a `.env` file in the project root. **Never commit this file.**

```env
# ── MongoDB ──────────────────────────────────────────
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kite

# ── Admin Auth ───────────────────────────────────────
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD_HASH=$2a$10$...  # bcrypt hash of the admin password
ADMIN_JWT_SECRET=a-very-long-random-secret-string

# ── Cloudinary ───────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── EmailJS ──────────────────────────────────────────
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
EMAILJS_TEMPLATE_ID_ADMIN=template_xxxxxxx    # Admin notification template
EMAILJS_TEMPLATE_ID_CUSTOMER=template_yyyyyyy # Customer confirmation template
ADMIN_ORDER_EMAIL=orders@yourdomain.com        # Email that receives new orders

# ── Pusher ───────────────────────────────────────────
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=ap2

# ── CORS & URLs ──────────────────────────────────────
FRONTEND_ORIGIN=https://your-frontend.vercel.app
FRONTEND_ORIGINS=https://your-custom-domain.com,https://preview-branch.vercel.app
ADMIN_PANEL_URL=https://your-frontend.vercel.app/admin

# ── Server ───────────────────────────────────────────
PORT=5000
NODE_ENV=development
```

### Variable Reference Table

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `ADMIN_EMAIL` | ✅ | Admin login email |
| `ADMIN_PASSWORD_HASH` | ✅ | bcrypt hash of admin password |
| `ADMIN_JWT_SECRET` | ✅ | JWT signing secret (use a long random string) |
| `CLOUDINARY_CLOUD_NAME` | ✅ (for uploads) | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ (for uploads) | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ (for uploads) | Cloudinary API secret |
| `EMAILJS_SERVICE_ID` | ⚠️ Optional | Skip emails if not set |
| `EMAILJS_PUBLIC_KEY` | ⚠️ Optional | EmailJS public key |
| `EMAILJS_PRIVATE_KEY` | ⚠️ Optional | EmailJS private key |
| `EMAILJS_TEMPLATE_ID_ADMIN` | ⚠️ Optional | Template for admin notifications |
| `EMAILJS_TEMPLATE_ID_CUSTOMER` | ⚠️ Optional | Template for customer confirmation |
| `ADMIN_ORDER_EMAIL` | ⚠️ Optional | Fallback to `CLIENT_ORDER_EMAIL` |
| `PUSHER_APP_ID` | ⚠️ Optional | All 4 Pusher vars required together |
| `PUSHER_KEY` | ⚠️ Optional | |
| `PUSHER_SECRET` | ⚠️ Optional | |
| `PUSHER_CLUSTER` | ⚠️ Optional | |
| `FRONTEND_ORIGIN` | ⚠️ Optional | Primary frontend domain for CORS |
| `FRONTEND_ORIGINS` | ⚠️ Optional | Comma-separated additional origins |
| `PORT` | ⚠️ Optional | Defaults to `5000` |
| `NODE_ENV` | ⚠️ Optional | `development` or `production` |

> **Note:** If `FRONTEND_ORIGIN` is absent and `NODE_ENV !== "production"`, CORS defaults to `localhost:5173`. In production with no CORS env vars, it fails open (all origins allowed) to prevent deployment lockout.

---

## Getting Started (Local)

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB** running locally or an Atlas connection string

### 1. Clone & Install

```bash
git clone <repository-url>
cd kite-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Run Development Server

```bash
npm run dev
```

Uses **nodemon** for hot-reload. Server starts at `http://localhost:5000`.

### 4. Verify the API is Running

```bash
curl http://localhost:5000/api/health
# → { "status": "ok" }
```

---

## Scripts & Utilities

All scripts are in the `scripts/` directory and run with `node scripts/<file>`.

| Script | npm command | Description |
|---|---|---|
| `seedProductsCloudinary.js` | `npm run seed:products:cloudinary` | Seeds the DB with products and uploads local images to Cloudinary. Reads from a JSON source file. |
| `generateSitemap.js` | `npm run seo:generate-sitemap` | Queries the API for all active products and generates an XML sitemap file. |
| `convertFolderToWebp.js` | `npm run images:to-webp` | Converts all images in a given folder to `.webp` format using `sharp`. |
| `seedMatches.js` | `node scripts/seedMatches.js` | Seeds match-specific products. |

---

## Testing

The project uses **Jest** with **Supertest** for HTTP integration tests. Jest is configured for ESM modules via `jest.config.cjs`.

```bash
npm test
```

**Current test coverage:**

```
src/__tests__/health.test.js  →  GET /api/health
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Deployment (Vercel)

The backend is deployed as a **Vercel Serverless Function**.

### How It Works

```
api/[...all].js   ←  Vercel entry point
      ↓
  Express App (src/app.js)
      ↓
  MongoDB Atlas (serverless-safe connection caching)
```

The `api/[...all].js` wildcard handler imports and delegates all requests to the Express app. The `connectToDatabase()` utility caches the Mongoose connection across invocations to avoid reconnecting on every serverless call.

### Vercel Config (`vercel.json`)

```json
{
  "redirects": [
    { "source": "/", "destination": "/api/health", "permanent": false }
  ],
  "functions": {
    "api/[...all].js": { "maxDuration": 30 }
  }
}
```

Function timeout is set to **30 seconds** (Vercel Pro/Hobby limit).

### Deployment Steps

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Set **all required environment variables** in the Vercel project settings.
4. Deploy.

> **CORS tip:** After deploying the frontend, add its Vercel URL to `FRONTEND_ORIGIN` in the backend's Vercel environment variables and redeploy.

---

## Frontend Integration

The frontend (`kite-frontend`) communicates exclusively through the REST API defined above.

### Frontend Tech Stack
- **React 19** + **Vite 7** — fast SPA with lazy-loaded routes
- **React Router DOM 7** — client-side routing (`vercel.json` rewrites all to `index.html`)
- **Tailwind CSS v4** — utility-first styling
- **Framer Motion** — animations
- **Swiper.js** — carousels
- **Pusher JS** — real-time admin notifications (subscribes to `admin-notifications` channel)

### Frontend Routes

| Route | Component | Description |
|---|---|---|
| `/` | `HomePage` | Hero carousel, products, brands |
| `/products` | `ProductsPage` | Full product catalog |
| `/products/:id` | `ProductDetailPage` | Single product (variants, SKUs, cart/order) |
| `/promotions-packages` | `PromotionsPackagesPage` | Bundle deals |
| `/checkout` | `CheckoutPage` | Multi-step checkout |
| `/order-success/:id` | `OrderSummaryPage` | Post-order confirmation |
| `/export` | `ExportPage` | Export overview |
| `/export/safety-matches` | `SafetyMatchesPage` | Export safety matches |
| `/export/wooden-splints` | `WoodenSplintsPage` | Export wooden splints |
| `/about` | `AboutUsPage` | Company info |
| `/contact` | `ContactPage` | Contact form |
| `/admin/login` | `AdminLoginPage` | JWT login |
| `/admin/products` | `AdminProductsPage` | Product CRUD |
| `/admin/promotions` | `AdminPromotionsPage` | Promotion CRUD |
| `/admin/orders` | `AdminOrdersPage` | Order management |
| `/admin/settings` | `AdminSettingsPage` | Site settings |

### Cart State

The frontend manages cart state via `CartContext` (React Context + `localStorage`). Cart data persists under `kite_cart` key.

Supported cart actions:
- `addToCart(product, brandName, variant, quantity)` — adds a product variant
- `addPromotionToCart(promotion, price, quantity)` — adds a promotion package
- `removeFromCart(index)` — removes item by index
- `updateQuantity(index, delta)` — increment/decrement
- `clearCart()` — empties the cart

---

## Real-Time Notifications (Pusher)

When a new order is placed via `POST /api/orders`, the backend fires a Pusher event:

```javascript
pusher.trigger('admin-notifications', 'new-order', {
  orderId: order._id,
  customerName: order.customerName,
  totalAmount: order.totalAmount,
  type: order.type
});
```

The **frontend admin panel** subscribes to the `admin-notifications` channel via Pusher JS and displays a notification toast in the `NotificationCenter` component.

> Pusher is **conditional** — if any of the 4 credentials are missing, the SDK is not initialized and a warning is logged. Order creation still succeeds.

---

## Email System (EmailJS)

Email is sent via the **EmailJS Node.js SDK** (`@emailjs/nodejs`). Two templates are used:

| Template | Trigger | Recipient |
|---|---|---|
| `EMAILJS_TEMPLATE_ID_ADMIN` | New order placed | Admin (`ADMIN_ORDER_EMAIL`) |
| `EMAILJS_TEMPLATE_ID_CUSTOMER` | New order placed | Customer email from order |
| `EMAILJS_TEMPLATE_ID_CUSTOMER` | Order status updated | Customer email from order |

Both emails contain inline HTML with:
- Order type (product / promotion / cart)
- Order ID, status, payment method, date
- Order summary (items, quantities, SKU, amounts)
- Customer details (name, phone, email, city, address, note)
- Admin email also includes a "View in Admin Panel" CTA button

Email sending is **fire-and-forget** — errors are logged but do not block the API response.

---

## Image Management (Cloudinary)

All product and promotion images are hosted on **Cloudinary**.

### Upload Folder Structure

```
kite/
├── products/           # Primary product images
│   ├── gallery/        # Product gallery images
│   ├── variants/       # Per-variant images
│   └── brands/         # Per-brand images within a product
└── promotions/
    ├── (root)          # Primary promotion images
    └── gallery/        # Promotion gallery images
```

### Upload Flow (Admin)

1. Admin submits the product form with image files (multipart/form-data).
2. `multer` parses the files into memory buffers (`multer.memoryStorage()`).
3. `applyCloudinaryUploads()` identifies files by field name and uploads them to Cloudinary.
4. Cloudinary returns secure URLs.
5. URLs are saved to the MongoDB document.

### Image Conversion (Local Script)

Use the `convertFolderToWebp.js` script to convert local image assets to `.webp` before seeding:

```bash
npm run images:to-webp
```

Uses **sharp** for lossy WebP conversion with configurable quality.

---

## Security Model

| Layer | Mechanism |
|---|---|
| **Authentication** | JWT (8h expiry), validated on every admin request |
| **Password storage** | bcrypt hash stored **only in env var**, never in DB |
| **CORS** | Allowlist of known origins; Vercel preview auto-allowed via regex |
| **HTTP headers** | `helmet` sets HSTS, X-Frame-Options, CSP, etc. |
| **Input validation** | Phone regex, quantity range, enum enforcement |
| **File upload limits** | `multer` limits: 8MB per file, max 10 files per request |
| **Compression** | Gzip via `compression` middleware |
| **Proxy trust** | `app.set("trust proxy", true)` for Vercel reverse proxy |
| **No sensitive DB data** | Admin credentials live only in env variables |

---

## Architecture Decisions

### Why Vercel Serverless?
Vercel provides zero-config deployment with global CDN, automatic HTTPS, preview deployments, and generous free tier. The Express app wraps seamlessly in a Vercel serverless function via the `api/[...all].js` catch-all.

### Why EmailJS (not Nodemailer + SMTP)?
EmailJS handles transactional email without requiring a dedicated SMTP server. The Node.js SDK works in serverless environments where persistent connections aren't possible.

### Why Pusher for real-time?
Pusher provides managed WebSocket infrastructure with a generous free tier. In serverless environments, long-polling or native WebSockets aren't reliable — Pusher's hosted channels solve this cleanly.

### Why Cloudinary?
Cloudinary offers a robust free tier, CDN delivery, automatic format negotiation (WebP/AVIF), and a powerful Node.js SDK. Images are referenced by URL in MongoDB, keeping the DB lean.

### MongoDB connection caching
Since Vercel serverless functions can be cold-started per request, the `connectToDatabase()` utility caches the Mongoose connection at module level. Subsequent invocations on warm containers reuse the existing connection, reducing latency.

---

## Development Notes

- All source files use **ES Modules** (`"type": "module"` in `package.json`).
- The `loadEnv.js` config file is the **first import** in both `index.js` and `app.js` to ensure env vars are populated before any other module reads `process.env`.
- The `requireAdminAuth` middleware reads `Authorization: Bearer <token>` and calls `jwt.verify()`. Invalid/expired tokens return `401`.
- Admin routes are **all** mounted behind `router.use(requireAdminAuth)` at the router level, not per-route — no chance of accidentally exposing a protected endpoint.

---

## License

This project is proprietary software developed for Kite FMCG by **Tech4Edges**.
All rights reserved © 2025.
