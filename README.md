# Kite Backend

Backend API for Kite ecommerce/admin flows (products, promotion packages, orders, admin auth), built with Express + MongoDB (Mongoose).

This README is written to help you (or Cursor at project root) quickly understand how the backend works and how to integrate a frontend app with it.

## Tech Stack

- Node.js (ESM)
- Express
- MongoDB + Mongoose
- JWT auth for admin routes
- bcryptjs for admin password hash verification
- Nodemailer for order notification emails
- Jest + Supertest (basic API test)

## Project Structure

```txt
backend/
  src/
    index.js                  # app bootstrap, middleware, route mounting, DB connect
    models/
      Product.js              # product schema
      PromotionPackage.js     # promotion schema
      Order.js                # order schema
    routes/
      products.js             # public product read APIs
      promotions.js           # public promotion read APIs
      orders.js               # public order create API
      adminAuth.js            # admin login -> JWT
      adminProducts.js        # admin product CRUD
      adminPromotions.js      # admin promotion CRUD
      adminOrders.js          # admin order list/detail/status update
    utils/
      adminAuthMiddleware.js  # Bearer token verification
      email.js                # SMTP/json transport + order email sender
    __tests__/
      health.test.js          # health endpoint test
```

## How the Backend Works

- `src/index.js` configures CORS + JSON parser, exposes `/api/health`, and mounts all routers under `/api/...`.
- MongoDB connection is required at startup; server only begins listening after successful `mongoose.connect`.
- Public APIs:
  - list/get products
  - list/get promotions
  - create orders
- Admin APIs:
  - login with configured admin email/password hash
  - manage products/promotions
  - view orders and update order status
- Order email notifications are fire-and-forget (order creation succeeds even if email sending fails).

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/kite
FRONTEND_ORIGIN=http://localhost:5173

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2a$10$replace_with_real_bcrypt_hash
ADMIN_JWT_SECRET=replace-with-strong-secret

CLIENT_ORDER_EMAIL=orders@example.com
ADMIN_ORDER_EMAIL=orders@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-user
SMTP_PASS=your-pass
SMTP_FROM=noreply@example.com
```

### Important Notes

- If `SMTP_HOST` is not set, backend uses Nodemailer's `jsonTransport` (safe local/dev behavior).
- Use `ADMIN_ORDER_EMAIL` as the primary recipient for new order emails (`CLIENT_ORDER_EMAIL` is fallback for backward compatibility).
- If neither `ADMIN_ORDER_EMAIL` nor `CLIENT_ORDER_EMAIL` is set, order emails are skipped with a warning.
- `SMTP_SECURE=true` is recommended for port `465`; for port `587` use `SMTP_SECURE=false`.
- If `ADMIN_EMAIL` or `ADMIN_PASSWORD_HASH` is missing, `/api/admin/login` returns server config error.
- If `ADMIN_JWT_SECRET` is missing, code falls back to `change-me` (set your own in real envs).

## Local Run

From `backend/`:

```bash
npm install
npm run dev
```

Production-style:

```bash
npm start
```

Run tests:

```bash
npm test
```

## Deploy on Vercel

This backend is configured for Vercel serverless deployment using `api/[...all].js`.

### Required Vercel Environment Variables

- `MONGODB_URI`
- `FRONTEND_ORIGIN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_JWT_SECRET`
- Email variables you use (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `ADMIN_ORDER_EMAIL`)

### Deploy Steps

1. Import this `backend` folder as a Vercel project.
2. Set all required environment variables in Vercel Project Settings.
3. Deploy.

After deployment, API endpoints remain under `/api/*`.

### Upload Storage Note (Important)

- On Vercel, uploaded files are stored in serverless temp storage (`/tmp/uploads`) and are not durable across deployments/instances.
- For production image persistence, switch to object storage (for example Cloudinary, S3, or Vercel Blob) and save public URLs in MongoDB.

## API Base URL

- Local default: `http://localhost:5000`
- All endpoints are under `/api`

## Health Endpoint

### `GET /api/health`

Response:

```json
{ "status": "ok" }
```

## Public API (Frontend Facing)

### Products

- `GET /api/products`
  - Returns all product documents
- `GET /api/products/:id`
  - Looks up by custom product `id` field (not Mongo `_id`)
  - `404` if not found

Product model shape:

```json
{
  "id": "string (unique, required)",
  "category": "string (required)",
  "title": "string (required)",
  "iconType": "fire | layer | dish-wash | null",
  "description": "string",
  "image": "string",
  "color": "string",
  "tagline": "string",
  "features": ["string"],
  "brands": [{ "name": "string", "category": "string" }],
  "sizes": [{ "size": "string", "avgSticks": 0, "matchesPerCotton": 0 }],
  "skus": [{ "size": "string", "gramage": "string", "packing": 0, "price": 0 }],
  "facilities": [{ "name": "string", "location": "string", "note": "string" }],
  "services": "string"
}
```

### Promotions

- `GET /api/promotions`
  - Returns all promotion package documents
- `GET /api/promotions/:id`
  - Looks up by custom promotion `id` field (not Mongo `_id`)
  - `404` if not found

Promotion model shape:

```json
{
  "id": "string (unique, required)",
  "title": "string (required)",
  "category": "string (required)",
  "image": "string",
  "items": [{ "product": "string", "quantity": 0, "price": 0 }],
  "totalQuantity": 0,
  "totalPrice": 0
}
```

### Orders

#### `POST /api/orders`

Create either a product order or promotion order.

Required common fields:

- `type`: `product` or `promotion`
- `customerName`
- `phone`
- `address`
- `city`
- `paymentMethod`: `COD` | `Easypaisa` | `JazzCash`

Conditional required fields:

- if `type=product` -> `productId` required
- if `type=promotion` -> `promotionId` required

Optional fields:

- `selectedSkuOrSize`
- `email`
- `note`

Example payload (product order):

```json
{
  "type": "product",
  "productId": "charcoal-001",
  "selectedSkuOrSize": "10kg",
  "customerName": "Ali Khan",
  "phone": "+923001112233",
  "email": "ali@example.com",
  "address": "House 1, Street 2",
  "city": "Lahore",
  "note": "Call before delivery",
  "paymentMethod": "COD"
}
```

Behavior:

- validates required fields + payment method
- validates referenced product/promotion exists
- writes order with default status `pending`
- sends notification email asynchronously (does not block response)

## Admin Authentication

### `POST /api/admin/login`

Request:

```json
{
  "email": "admin@example.com",
  "password": "plain-password"
}
```

Success response:

```json
{
  "token": "jwt-token"
}
```

- Token expiry: 8 hours
- Use token in header for all admin routes:

```txt
Authorization: Bearer <token>
```

## Admin APIs

All admin routes require valid JWT Bearer token.

### Admin Products (`/api/admin/products`)

- `GET /` -> list all (newest first)
- `POST /` -> create product
  - requires `id`, `title`, `category`
  - `409` if same `id` exists
- `PUT /:id` -> update by custom `id`
- `DELETE /:id` -> delete by custom `id`

### Admin Promotions (`/api/admin/promotions`)

- `GET /` -> list all (newest first)
- `POST /` -> create promotion
  - requires `id`, `title`, `category`
  - `409` if same `id` exists
- `PUT /:id` -> update by custom `id`
- `DELETE /:id` -> delete by custom `id`

### Admin Orders (`/api/admin/orders`)

- `GET /` -> list orders (newest first)
- `GET /:id` -> get order by Mongo `_id`
- `PATCH /:id/status` -> update status
  - body: `{ "status": "pending|confirmed|shipped|cancelled" }`

## Frontend Integration Guide (Root-Level Monorepo)

Assume structure:

```txt
kite/
  frontend/
  backend/
```

### 1) Start backend + frontend

- backend runs on `http://localhost:5000`
- frontend runs on `http://localhost:5173` (or update `FRONTEND_ORIGIN`)

### 2) Set frontend API base

- In frontend env/config, set:
  - `VITE_API_BASE_URL=http://localhost:5000/api`

### 3) Public data fetching

- products list page -> `GET /products`
- product detail page -> `GET /products/:id`
- promotions list/detail -> `GET /promotions`, `GET /promotions/:id`

### 4) Place order flow

- Submit checkout form to `POST /orders`
- Match payload shape exactly (see Orders section)
- Show validation errors using backend error messages

### 5) Admin flow

- Login page posts to `POST /admin/login`
- Save JWT in memory or secure storage
- Include `Authorization: Bearer <token>` in admin requests
- Handle `401` by redirecting to admin login

### 6) ID usage caveat

- Product/Promotion detail and admin update/delete routes use custom `id`.
- Admin order detail/status routes use Mongo `_id`.
- Make sure frontend keeps both when needed.

## Example Frontend Request Snippets

```js
const API = import.meta.env.VITE_API_BASE_URL;

export async function getProducts() {
  const res = await fetch(`${API}/products`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function adminLogin(email, password) {
  const res = await fetch(`${API}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid admin credentials");
  return res.json(); // { token }
}
```

## Generating Admin Password Hash

Create bcrypt hash for `ADMIN_PASSWORD_HASH`:

```bash
node -e "import('bcryptjs').then(async (b)=>{console.log(await b.default.hash('your-password',10));})"
```

Copy output hash into `.env`.

## Error Handling Conventions

- Validation errors: `400`
- Unauthorized: `401`
- Not found: `404`
- Duplicate custom id: `409`
- Server/database issues: `500`

Typical error payload:

```json
{ "message": "Failed to fetch products" }
```

## Current Test Coverage

- Includes only health endpoint test (`GET /api/health`).
- Recommended: add route-level tests for orders/admin auth/admin CRUD before production.

## Quick Cursor Context Notes

If Cursor is opened at project root (`kite/`), this backend lives in `backend/` and exposes:

- public commerce read/create APIs under `/api/products`, `/api/promotions`, `/api/orders`
- JWT-protected admin APIs under `/api/admin/...`
- Mongo-backed schemas in `backend/src/models/`

This README is intended to be the single backend integration reference for frontend implementation.
