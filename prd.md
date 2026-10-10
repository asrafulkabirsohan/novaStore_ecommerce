# Product Requirement Document (PRD)

## Project: Modern E-Commerce Platform with Admin & User Dashboard

---

### 1. Document Control & Overview

| Attribute | Details |
| :--- | :--- |
| **Project Title** | E-Commerce Web Application |
| **Document Version** | 1.0.0 |
| **Status** | Approved / Initial Draft |
| **Author** | Engineering & Product Team |
| **Target Audience** | Developers, Designers, QA, Project Stakeholders |
| **Frontend Stack** | React, Next.js, Tailwind CSS, Lucide Icons |
| **Backend Stack** | Node.js / Next.js API Routes (Server Actions / Route Handlers) |
| **Database** | MongoDB Atlas (via Mongoose ODM) |
| **Authentication** | NextAuth.js / JWT with Role-Based Access Control (RBAC) |
| **Media Storage** | Cloudinary / AWS S3 / Uploadthing (for product images) |

---

### 2. Executive Summary & Objectives

The goal is to build a responsive, modern, full-stack E-Commerce platform that provides a frictionless shopping experience for end-users and a comprehensive management console for store administrators.

#### Core Goals:
1. **Seamless Shopping**: Allow customers to browse products, filter by categories, manage a shopping cart, place orders, and track shipments in real-time.
2. **Robust Admin Management**: Provide store managers with a protected dashboard to create/manage products, view real-time orders, confirm orders, and update delivery tracking status.
3. **High Performance & Security**: Leverage Next.js for server-rendered storefront performance and MongoDB Atlas for flexible, scalable catalog and order data.

---

### 3. User Personas & Role-Based Access Control (RBAC)

| Role | Access Level | Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **Guest** | Public Storefront | View products, search, filter, view details, add to cart. Must register/login to checkout. |
| **Customer (User)** | Storefront + User Dashboard | Place orders, view order history, track order status in real-time, manage profile and shipping addresses. |
| **Admin** | Admin Dashboard + Storefront | Add, edit, archive products, inspect incoming orders, confirm orders, update shipping tracking milestones, view platform metrics. |

---

### 4. Technical Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Client Layer (Browser / Mobile)             │
│   React + Tailwind CSS + Lucide Icons + Responsive UI    │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTPS / JSON
┌────────────────────────────▼─────────────────────────────┐
│                 Fullstack Next.js Layer                  │
│  - App Router Pages (Storefront, User & Admin Portals)   │
│  - Route Handlers / API Endpoints (Node.js runtime)      │
│  - Authentication & Middleware (RBAC Protection)         │
└──────────────┬─────────────────────────────┬─────────────┘
               │                             │
    Cloudinary / S3 Image CDN         Mongoose ODM
               │                             │
               ▼                             ▼
   ┌──────────────────────┐      ┌─────────────────────────┐
   │ Media Asset Storage  │      │   MongoDB Atlas Cluster │
   │   (Product Images)   │      │ (Users, Products, Orders)│
   └──────────────────────┘      └─────────────────────────┘
```

---

### 5. Functional Requirements

#### 5.1 Storefront & Customer Experience

1. **Homepage & Catalog**:
   - Hero banner with promotions/featured collections.
   - Product grid with thumbnail, title, pricing, discount badges, and rating.
   - Search bar with live debounced filtering.
   - Category filtering and sorting (Price: Low to High, High to Low, Newest).
2. **Product Details Page (PDP)**:
   - High-resolution image gallery.
   - Product title, category, description, price, discount price, stock status (In Stock / Out of Stock).
   - Quantity selector and "Add to Cart" / "Buy Now" buttons.
3. **Cart & Checkout**:
   - Slide-over or dedicated page cart showing items, subtotal, quantity adjustment, and removal.
   - Checkout form: Shipping address, phone number, notes.
   - Payment Methods: Cash on Delivery (COD) and extensible for Online Gateways (bKash/Nagad/SSLCommerz/Stripe).
   - Order confirmation summary and unique Order ID generation.

#### 5.2 Customer Dashboard & Order Tracking

1. **User Profile**:
   - Manage personal information, phone number, and saved shipping addresses.
2. **Order History**:
   - List of all past and current orders with dates, total amounts, and quick status indicators.
3. **Interactive Order Tracking**:
   - Visual step-by-step progress stepper:
     1. `Placed` / `Pending` (Order received)
     2. `Confirmed` (Admin confirmed the order)
     3. `Processing` / `Packaging`
     4. `Shipped` / `In Transit`
     5. `Out for Delivery`
     6. `Delivered`
   - Detailed milestone history with timestamps and optional notes (e.g., Courier tracking code).

#### 5.3 Admin Dashboard

1. **Overview & Analytics**:
   - Metric cards: Total Revenue, Total Orders, Pending Orders, Total Products in stock.
   - Recent orders table with immediate action buttons.
2. **Product Management (CRUD)**:
   - **Create Product**: Title, description, category, price, discount price, stock quantity, image URL/upload.
   - **Update Product**: Edit details, change stock levels, upload new images.
   - **Delete/Archive Product**: Soft delete or remove obsolete products.
   - **Stock Alerts**: Visual badge when inventory falls below 5 items.
3. **Order Management**:
   - Paginated list of all orders filterable by status (`Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`).
   - Order details modal/page: Customer name, contact number, shipping destination, line items, payment status.
   - **Order Confirmation**: One-click action to move an order from `Pending` to `Confirmed`.
   - **Status Dispatcher**: Select and advance order tracking stages with automatic customer timeline update.

---

### 6. Database Schema Design (MongoDB Atlas)

#### 6.1 Users Collection (`users`)
```typescript
interface IUser {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### 6.2 Products Collection (`products`)
```typescript
interface IProduct {
  _id: ObjectId;
  title: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  isFeatured: boolean;
  status: 'active' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}
```

#### 6.3 Orders Collection (`orders`)
```typescript
interface IOrderItem {
  productId: ObjectId;
  title: string;
  image: string;
  price: number;
  quantity: number;
}

interface ITrackingEvent {
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  note?: string;
  updatedAt: Date;
}

interface IOrder {
  _id: ObjectId;
  orderNumber: string; // e.g. "ORD-202610-1001"
  user: ObjectId;      // Reference to users collection
  items: IOrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  paymentMethod: 'COD' | 'Online';
  paymentStatus: 'pending' | 'paid' | 'failed';
  totalAmount: number;
  currentStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  trackingTimeline: ITrackingEvent[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 7. API Architecture & Route Handlers

#### Public / Customer Endpoints
- `POST /api/auth/register` — Create new customer account.
- `POST /api/auth/login` — Authenticate and receive JWT/session token.
- `GET /api/products` — Retrieve product listing (supports `?search=`, `?category=`, `?page=`).
- `GET /api/products/[id]` — Retrieve single product details.
- `POST /api/orders` — Create new order (Protected: Customer).
- `GET /api/orders/my-orders` — List logged-in user's orders (Protected: Customer).
- `GET /api/orders/[id]/track` — Retrieve order tracking status & timeline (Protected: Customer/Admin).

#### Admin Endpoints (Protected: `role === 'admin'`)
- `GET /api/admin/metrics` — Dashboard stats (total sales, count of pending orders).
- `POST /api/admin/products` — Add new product.
- `PUT /api/admin/products/[id]` — Update existing product.
- `DELETE /api/admin/products/[id]` — Delete product.
- `GET /api/admin/orders` — Retrieve all orders with filter query params.
- `PATCH /api/admin/orders/[id]/status` — Update order status (Confirm, Ship, Deliver, Cancel) & push tracking event.

---

### 8. UI/UX Design System & Theme

- **Design Philosophy**: Minimalist, high contrast, clean typography, soft card shadows, modern e-commerce feel.
- **Color Palette**:
  - Primary / Brand: Indigo / Emerald (`#4F46E5` or `#059669`)
  - Neutral Background: Slate / Gray (`#F8FAFC`, `#0F172A` for dark mode)
  - Accent / Status Badges:
    - Pending: Amber / Yellow (`#F59E0B`)
    - Confirmed / Processing: Blue (`#3B82F6`)
    - Shipped: Purple (`#8B5CF6`)
    - Delivered: Emerald (`#10B981`)
    - Cancelled: Rose / Red (`#EF4444`)
- **Typography**: Inter or Plus Jakarta Sans.
- **Responsiveness**: Mobile-first design for storefront navigation, drawer menus, and sticky cart summary.

---

### 9. Non-Functional Requirements (NFR)

1. **Security**:
   - Password hashing using `bcryptjs` (salt rounds >= 10).
   - Middleware-based route protection for `/admin/*` and `/dashboard/*`.
   - Sanitized inputs and request validation using Zod.
2. **Performance**:
   - Next.js Server Components and Image Optimization (`next/image`).
   - MongoDB indexing on frequently queried fields (`slug`, `category`, `user`, `orderNumber`, `createdAt`).
3. **Reliability & Scalability**:
   - Graceful fallback UI states (skeletons, error boundaries, empty state illustrations).
   - MongoDB Atlas connection pooling in serverless environments.

---

### 10. Implementation Roadmap & Milestones

| Phase | Milestone | Deliverables |
| :---: | :--- | :--- |
| **Phase 1** | Project Setup & Database Connection | Next.js app initialization, Tailwind CSS setup, MongoDB Atlas connection via Mongoose. |
| **Phase 2** | Authentication & RBAC | Customer & Admin registration/login, JWT/NextAuth session, role-based route middleware. |
| **Phase 3** | Product Catalog & Storefront | Product listings, search/filters, product details page, responsive navbar & footer. |
| **Phase 4** | Cart & Checkout Flow | Client cart state (Zustand/Context), checkout form, order creation API, Cash on Delivery support. |
| **Phase 5** | Admin Dashboard & Inventory | Admin navigation, product CRUD with image upload, inventory management. |
| **Phase 6** | Order Management & Confirmation | Admin order list, order confirmation button, stage progression handler. |
| **Phase 7** | User Dashboard & Real-Time Tracking | Customer order history page, visual tracking stepper with milestone dates. |
| **Phase 8** | Testing, Optimization & Deployment | Responsive QA, error boundary testing, Vercel deployment & MongoDB Atlas whitelist configuration. |
