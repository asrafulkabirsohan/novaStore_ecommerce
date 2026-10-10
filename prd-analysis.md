# PRD Analysis Report

## Project: Modern E-Commerce Platform with Admin & User Dashboard

> **Reviewed By**: Antigravity Code Assistant  
> **Review Date**: 2026-10-10  
> **PRD Version Reviewed**: 1.0.0  
> **Overall Score**: 🟡 **6.0 / 10** — Needs revision before development starts

---

## 📋 Executive Summary

The PRD provides a solid high-level foundation with good schema design choices (event-sourced tracking timeline), clear RBAC definitions, and a logical phase-based roadmap. However, it contains **6 critical blockers**, **5 important gaps**, and **5 minor issues** that must be addressed before implementation begins. The most severe problems are the undefined payment verification flow, inventory concurrency risk, and internal contradictions between the PRD text and the database schema.

---

## 📊 Quality Score Breakdown

| Category | Score | Verdict |
| :--- | :---: | :--- |
| Business Requirements | 6/10 | Guest checkout and notification system missing |
| Technical Architecture | 7/10 | Solid structure but storage/search undecided |
| Database Schema | 6/10 | Rating, addresses, cancellation fields missing |
| API Design | 7/10 | Good coverage, pagination params incomplete |
| Security & NFR | 5/10 | No rate limiting, no perf SLA, no GDPR |
| Completeness | 5/10 | Multiple internal contradictions |
| **Overall** | **6.0/10** | Needs revision before development starts |

---

## 🔴 Critical Issues — Must Fix Before Development

### ISSUE-01 · Document Status Contradiction
- **Section**: §1 Document Control
- **Problem**: The `Status` field simultaneously reads `"Approved / Initial Draft"` — these are mutually exclusive states.
- **Impact**: Creates confusion about the document's authority. Developers won't know if this is authoritative or still subject to change.
- **Resolution**: Pick exactly one. Recommend: `"In Review"` → `"Approved"` once all issues below are resolved.

---

### ISSUE-01-PAY · Payment Flow Completely Undefined
- **Section**: §5.1 Cart & Checkout, §6.3 Orders Schema
- **Problem**:
  - Online payment gateways (bKash, Nagad, SSLCommerz, Stripe) are listed as "extensible" but no flow is defined.
  - No webhook/callback URL strategy documented.
  - `IOrder.paymentMethod: 'COD' | 'Online'` — `'Online'` is too vague.
  - No `transactionId` or `paymentGatewayRef` field in `IOrder` schema.
  - **COD confirmation logic undefined**: when and how does `paymentStatus` transition from `'pending'` → `'paid'`? Is it manual (Admin clicks confirm)? Automatic on delivery?
- **Impact**: This is the most dangerous gap. Without a payment flow, the checkout feature cannot be built correctly.
- **Resolution**:
  ```typescript
  // Add to IOrder:
  paymentMethod: 'COD' | 'bKash' | 'Nagad' | 'SSLCommerz' | 'Stripe';
  paymentGatewayRef?: string;       // Transaction ID from gateway
  paymentWebhookVerified?: boolean; // Flag set by webhook handler
  ```
  Define lifecycle: COD → `paymentStatus: 'pending'` until Admin marks delivered → `'paid'`. Online → `'paid'` only after webhook verification.

---

### ISSUE-02 · Forced Login — No Guest Checkout
- **Section**: §3 RBAC Table (Guest row)
- **Problem**: Guest users must register/login before checkout. No justification provided.
- **Impact**: Industry data shows that **forced account creation reduces checkout conversion by 20–35%**. This is a significant business risk that requires an explicit decision, not a default assumption.
- **Resolution Options**:
  1. **Add Guest Checkout**: Make `IOrder.user` optional (`ObjectId | null`), capture email at checkout for order tracking.
  2. **Keep Forced Login**: Document the explicit business reason (e.g., "all orders must be tied to accounts for loyalty program").
  Either way, the decision must be documented.

---

### ISSUE-03 · Inventory Concurrency / Overselling Risk
- **Section**: §6.3 Orders Schema, §7 API
- **Problem**: When two users simultaneously place orders for the last item in stock, both `POST /api/orders` calls will read `stock = 1`, both pass validation, and both decrement — resulting in `stock = -1`. The product is sold twice.
- **Impact**: **Overselling** — a production-breaking bug that causes fulfillment failures and customer disputes.
- **Resolution**: Use MongoDB atomic operations in the order creation endpoint:
  ```typescript
  // In POST /api/orders handler:
  const product = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } }, // Guard condition
    { $inc: { stock: -quantity } },                 // Atomic decrement
    { new: true }
  );
  if (!product) throw new Error('Item out of stock');
  ```
  Document this pattern in §9 NFR under Reliability.

---

### ISSUE-04 · Hardcoded Stock Alert Threshold
- **Section**: §5.3 Admin Dashboard — Product Management
- **Problem**: `"Stock Alerts: Visual badge when inventory falls below 5 items"` — the value `5` is hardcoded and inappropriate for most real products. A fast-moving product may need a threshold of 100; a specialty item may never need it.
- **Impact**: Alert system becomes useless or noisy depending on product volume.
- **Resolution**:
  ```typescript
  // Add to IProduct schema:
  lowStockThreshold: number; // default: 5, Admin-configurable per product
  ```
  Admin product form should include a "Low Stock Alert Threshold" input field.

---

### ISSUE-05 · Order Cancellation Policy Undefined
- **Section**: §5.3 Admin Dashboard — Order Management, §6.3 IOrder
- **Problem**:
  - `'cancelled'` exists as an order status but no policy governs it.
  - Who can cancel? (Admin only? Customer too?)
  - Until which stage can cancellation occur? (Before `Shipped`? Before `Confirmed`?)
  - No `cancellationReason` field in `IOrder` schema.
- **Impact**: Ambiguous requirements will lead to inconsistent implementation and customer disputes.
- **Resolution**:
  ```typescript
  // Add to IOrder:
  cancellationReason?: string;
  cancelledBy?: 'customer' | 'admin';
  cancelledAt?: Date;
  ```
  Define policy: Customer can cancel until `Confirmed`; Admin can cancel at any stage. Add `POST /api/orders/[id]/cancel` customer endpoint and include in Admin Status Dispatcher.

---

## 🟡 Important Gaps — Fix Before Feature Freeze

### ISSUE-06 · Single Address vs Multiple Addresses Contradiction
- **Section**: §5.2 User Profile vs §6.1 IUser Schema
- **Problem**: §5.2 states "manage **saved shipping addresses**" (plural), but `IUser.address` is defined as a single object.
- **Impact**: Direct PRD-to-schema contradiction. Developer must guess the intended behavior.
- **Resolution**:
  ```typescript
  interface IAddress {
    _id: ObjectId;
    label: string;        // e.g., "Home", "Office"
    fullName: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }

  // In IUser:
  addresses: IAddress[];  // Replace single address object
  ```

---

### ISSUE-07 · Product Rating Displayed but Never Defined
- **Section**: §5.1 Homepage & Catalog vs §6.2 IProduct Schema
- **Problem**: Product grid shows `rating` but:
  - `IProduct` has no `rating` or `reviewCount` fields.
  - No Reviews/Ratings collection exists in §6.
  - No review submission feature exists in §5.
- **Impact**: Rating display will have no data source. Either hardcoded (misleading) or broken.
- **Resolution — Option A** (Add Reviews):
  ```typescript
  // New Reviews Collection
  interface IReview {
    _id: ObjectId;
    product: ObjectId;
    user: ObjectId;
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
    createdAt: Date;
  }
  // Add to IProduct:
  avgRating: number;   // Aggregated and cached
  reviewCount: number;
  ```
  Add `GET /api/products/[id]/reviews` and `POST /api/products/[id]/reviews` endpoints.
- **Resolution — Option B** (Remove Rating): Remove rating display from §5.1 until a review system is in scope.

---

### ISSUE-08 · Search Implementation Strategy Undefined
- **Section**: §5.1 Homepage & Catalog
- **Problem**: "Live debounced filtering" is a UX pattern, not a technical specification. No decision made on:
  - Client-side (tiny catalog only) vs Server-side (scalable)
  - MongoDB `$text` index vs `$regex` (slow, no ranking) vs external search (Algolia, MeiliSearch, Typesense)
- **Impact**: Search is a core feature. An ambiguous specification will lead to a poor implementation that's hard to change later.
- **Resolution (MVP)**:
  - Use **MongoDB Text Index** on `title` and `description` fields.
  - `GET /api/products?search=<term>` uses `$text: { $search: term }` with text score sorting.
  - Debounce on client at 300ms before API call.
  - Document for future: migrate to Algolia/MeiliSearch at scale.

---

### ISSUE-09 · Media Storage Provider Unconfirmed
- **Section**: §1 Document Control, §4 Architecture
- **Problem**: Three storage providers listed with none selected: `Cloudinary / AWS S3 / Uploadthing`. Each has different SDKs, pricing, APIs, and integration complexity.
- **Impact**: Developers cannot set up the media pipeline without a decision.
- **Resolution**: **Select Cloudinary** for MVP:
  - Free tier (25 credits/month)
  - Built-in image transformation API (resize, format conversion)
  - Next.js plugin available (`next-cloudinary`)
  - No manual CDN configuration needed

---

### ISSUE-10 · Category as Uncontrolled Plain String
- **Section**: §5.3 Admin Dashboard, §6.2 IProduct
- **Problem**: `IProduct.category` is `string` with no validation, no enum, and no Category management UI in Admin Dashboard. Admins can type anything → data inconsistency (`"Electronics"` vs `"electronics"` vs `"Elec"`).
- **Impact**: Category filtering breaks. Data becomes unmaintainable.
- **Resolution**:
  ```typescript
  // New Categories Collection
  interface ICategory {
    _id: ObjectId;
    name: string;
    slug: string;
    icon?: string;
    createdAt: Date;
  }
  // In IProduct:
  category: ObjectId; // Reference to categories collection
  ```
  Add Category CRUD to Admin Dashboard (Phase 5) and `GET /api/categories` public endpoint.

---

## 🟠 Minor Issues — Address Before Production

### ISSUE-NFR-1 · No Rate Limiting
- **Section**: §9 NFR — Security
- **Problem**: Auth endpoints (`/api/auth/login`, `/api/auth/register`) and order creation (`POST /api/orders`) have no rate limiting defined.
- **Risk**: Brute-force attacks on login, spam order creation.
- **Resolution**: Add `upstash/ratelimit` (serverless-compatible) or configure Vercel's Edge Middleware rate limiting. Document limits: login max 10 req/min/IP.

---

### ISSUE-NFR-2 · No GDPR / Data Privacy Policy
- **Section**: §9 NFR — Security
- **Problem**: The platform collects PII (name, email, phone, address). No data retention, deletion rights, or privacy policy requirements documented.
- **Resolution**: Add `DELETE /api/user/account` endpoint. Define data retention (orders kept 7 years for accounting; user PII deleted on request). Add privacy policy page to storefront.

---

### ISSUE-NFR-3 · No Measurable Performance Targets
- **Section**: §9 NFR — Performance
- **Problem**: "High Performance & Security" is a goal statement, not a requirement. Nothing is measurable or testable.
- **Resolution**: Define concrete targets:

  | Metric | Target |
  | :--- | :--- |
  | Largest Contentful Paint (LCP) | < 2.5s |
  | First Input Delay (FID) | < 100ms |
  | Cumulative Layout Shift (CLS) | < 0.1 |
  | API p95 Response Time | < 300ms |
  | Uptime SLA | ≥ 99.5% |

---

### ISSUE-NFR-4 · No Notification System
- **Section**: §9 NFR / §10 Roadmap
- **Problem**: No email or SMS notification system defined. Customers have no way to know their order was placed, confirmed, or shipped outside of logging in to check.
- **Resolution**: Add to Phase 7 or new Phase 8.5:
  - **Email**: Resend (simplest for Next.js) or Nodemailer + SMTP
  - **Triggers**: Order Placed, Order Confirmed, Order Shipped (with tracking code), Order Delivered
  - Add `email` to `IOrder.shippingAddress` for guest order support

---

### ISSUE-13 · Incomplete API Pagination Spec
- **Section**: §7 API — `GET /api/products`
- **Problem**: `?page=` is defined but `?limit=` and `?sort=` are absent. No page size cap means a client could request `?limit=999999`.
- **Resolution**:
  ```
  GET /api/products?page=1&limit=20&sort=createdAt_desc&search=&category=
  ```
  - Default: `limit=20`
  - Maximum: `limit=100`
  - Sort options: `createdAt_desc`, `price_asc`, `price_desc`, `title_asc`

---

## ✅ What's Already Good

| Strength | Notes |
| :--- | :--- |
| **Tracking Timeline Design** | `trackingTimeline: ITrackingEvent[]` is an excellent event-sourcing pattern — immutable audit trail. |
| **RBAC Definition** | Guest / Customer / Admin roles clearly separated with scoped access. |
| **Order Schema** | `orderNumber` human-readable format (`ORD-202610-1001`) is a good UX touch. |
| **Soft Delete** | `status: 'active' \| 'draft' \| 'archived'` for products avoids data loss. |
| **Phase Roadmap** | 8-phase breakdown is logical and incremental. |
| **Security Basics** | bcryptjs, Zod validation, and middleware-based protection documented. |
| **MongoDB Indexing** | Relevant fields (`slug`, `category`, `user`, etc.) pre-identified. |

---

## 🎯 Recommended Resolution Priority

```
Week 1 (Before any code):
  📌 ISSUE-01     — Fix document status
  📌 ISSUE-09     — Select Cloudinary as media storage
  📌 ISSUE-06     — Fix addresses schema
  📌 ISSUE-07     — Decide: add Reviews or remove rating display
  📌 ISSUE-10     — Define Category collection

Week 2 (Before backend sprint):
  📌 ISSUE-01-PAY — Define full payment lifecycle
  📌 ISSUE-02     — Make guest checkout decision
  📌 ISSUE-03     — Document atomic stock decrement pattern
  📌 ISSUE-04     — Add lowStockThreshold to IProduct
  📌 ISSUE-05     — Define cancellation policy + schema fields

Week 3 (Before QA):
  📌 ISSUE-08     — Document search implementation strategy
  📌 ISSUE-13     — Add ?limit= and ?sort= to products API spec
  📌 ISSUE-NFR-1  — Add rate limiting spec
  📌 ISSUE-NFR-3  — Add measurable performance targets
  📌 ISSUE-NFR-4  — Add notification system to roadmap
```

---

*This analysis was generated from PRD version 1.0.0. Re-review required after resolution of Critical Issues.*
