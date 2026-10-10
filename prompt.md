# Master Implementation Prompts & Step-by-Step Execution Plan

## Project: Modern Full-Stack Responsive E-Commerce Platform

> **Based On**: `architecture.md` (v1.0.0) & `prd-analysis.md`
> **Target Tech Stack**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, MongoDB Atlas (Mongoose), NextAuth.js v5, Cloudinary, Resend, Upstash Redis
> **Total Prompts**: 13 (Sequential — do NOT skip or reorder)
> **Execution Rule**: Complete each prompt's Acceptance Criteria FULLY before moving to the next.

---

## 📋 Instructions for AI Developer

- Execute prompts **sequentially from Prompt 1 to Prompt 13**.
- Each prompt references `architecture.md` Section numbers for full schema/type details.
- Each prompt includes **exact terminal commands**, **file paths**, **code patterns**, and **acceptance criteria**.
- Where `[ISSUE-XX]` is noted, that prompt resolves the corresponding issue from `prd-analysis.md`.

---

### 🚀 Prompt 1: Project Initialization & Environment Setup

```text
PROMPT 1: PROJECT SETUP & CORE INFRASTRUCTURE
Resolves: [ISSUE-01] [ISSUE-09]

You are initializing a production-grade Next.js 14+ App Router project.

STEP 1 — Bootstrap the project with this exact command:
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

STEP 2 — Install all required dependencies in one command:
  npm install mongoose next-auth@beta bcryptjs zustand zod lucide-react framer-motion clsx tailwind-merge
  npm install cloudinary resend @upstash/ratelimit @upstash/redis
  npm install --save-dev @types/bcryptjs

STEP 3 — Create `.env.example` (committed to git) with these keys — leave values blank:
  MONGODB_URI=
  NEXTAUTH_SECRET=
  NEXTAUTH_URL=
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  RESEND_API_KEY=
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  NEXT_PUBLIC_APP_URL=

STEP 4 — Create `src/lib/db.ts` with Mongoose singleton connection for Next.js/serverless:
  - Use a `global.mongoose` cached promise pattern to prevent connection flooding during HMR.
  - Throw an error if MONGODB_URI is missing.
  - Export a single `connectDB()` async function.

STEP 5 — Create `src/lib/utils.ts` with:
  - `cn(...inputs)` utility using `clsx` and `tailwind-merge` for className merging.
  - `formatPrice(amount: number): string` — formats to Bangladeshi Taka, e.g. `৳1,200`.
  - `generateSlug(title: string): string` — converts "Red T-Shirt" → "red-t-shirt".
  - `generateOrderNumber(): string` — generates unique ID like "ORD-202610-1001" using date + random suffix.

STEP 6 — Update `next.config.ts`:
  - Enable `images.domains` for `res.cloudinary.com`.
  - Add security headers via `headers()` function:
    X-Frame-Options: DENY
    X-Content-Type-Options: nosniff
    Referrer-Policy: strict-origin-when-cross-origin

Acceptance Criteria:
- `npm run dev` starts cleanly with no TypeScript errors.
- `connectDB()` connects to MongoDB Atlas without throwing and without duplicate connections on HMR.
- `formatPrice(1200)` returns "৳1,200".
- Security headers visible in browser Network tab.
```

---

### 🗄️ Prompt 2: Database Models & TypeScript Interfaces

```text
PROMPT 2: DATABASE MODELS & MONGOOSE SCHEMAS
Resolves: [ISSUE-02] [ISSUE-04] [ISSUE-05] [ISSUE-06] [ISSUE-07] [ISSUE-10]
Reference: architecture.md Section 4

Create all Mongoose models in `src/models/` and shared TypeScript interfaces in `src/types/index.ts`.
Every model must use the `models.ModelName || model(...)` pattern to prevent model re-registration in Next.js.

--- Model 1: `src/models/User.ts` ---
Export interface IAddress with ALL these fields:
  _id?: Types.ObjectId
  label: string          // e.g. "Home", "Office"
  fullName: string       // recipient name
  phone: string          // contact number
  street: string
  city: string
  postalCode: string
  country: string
  isDefault: boolean

Export interface IUser with:
  name, email, passwordHash (optional for OAuth), role: 'user'|'admin',
  phone, addresses: IAddress[]    // plural — supports multiple saved addresses
  createdAt, updatedAt

Index: { email: 1, unique: true }, { role: 1 }

--- Model 2: `src/models/Category.ts` ---
Export interface ICategory: name, slug, description?, icon?
Index: { slug: 1, unique: true }

--- Model 3: `src/models/Product.ts` ---
Export interface IProduct:
  title, slug, description, category (ObjectId ref → Category),
  price (Number, min:0), discountPrice (optional),
  stock (Number, min:0, default:0),
  lowStockThreshold (Number, default:5),   // configurable per product
  images (string[]),
  avgRating (Number, default:0, min:0, max:5),
  reviewCount (Number, default:0),
  isFeatured (Boolean, default:false),
  status: 'active'|'draft'|'archived'
  createdAt, updatedAt

Indexes:
  { slug: 1, unique: true }
  { category: 1 }
  { isFeatured: 1 }
  { status: 1 }
  { title: 'text', description: 'text' }   // MongoDB Text Search Index

--- Model 4: `src/models/Review.ts` ---
Export interface IReview:
  product (ObjectId ref → Product), user (ObjectId ref → User),
  userName (string — snapshot at review time), rating (Number 1–5),
  comment (string)
  createdAt, updatedAt

Index: { product: 1 }, unique compound: { product: 1, user: 1 } (one review per user per product)

--- Model 5: `src/models/Order.ts` ---
Export interfaces: IOrderItem, ITrackingEvent, IOrder

IOrderItem: product (ObjectId ref), title, image, price (snapshot), quantity

ITrackingEvent: status (enum), note?, updatedAt

IOrder:
  orderNumber (string, unique),
  user (ObjectId ref, OPTIONAL — null for guest),  // [ISSUE-02] guest checkout
  guestEmail (string, optional),
  items: IOrderItem[],
  shippingAddress: { fullName, phone, street, city, postalCode, country },
  paymentMethod: 'COD'|'bKash'|'Nagad'|'SSLCommerz'|'Stripe',
  paymentStatus: 'pending'|'paid'|'failed',
  paymentGatewayRef (string, optional),
  paymentWebhookVerified (Boolean, default:false),
  subtotal, shippingFee, totalAmount,
  currentStatus: 'pending'|'confirmed'|'processing'|'shipped'|'out_for_delivery'|'delivered'|'cancelled',
  cancellationReason (string, optional),   // [ISSUE-05]
  cancelledBy: 'customer'|'admin' (optional),
  cancelledAt (Date, optional),
  trackingTimeline: ITrackingEvent[]
  createdAt, updatedAt

Indexes: { orderNumber: 1, unique }, { user: 1 }, { currentStatus: 1 }, { paymentStatus: 1 }

Acceptance Criteria:
- All 5 models export correctly without TypeScript errors.
- Running `node -e "require('./src/models/Product')"` does not throw.
- `IAddress` contains ALL 8 fields including label, fullName, and phone.
```

---

### 🌱 Prompt 3: Database Seeding Script

```text
PROMPT 3: SEED SCRIPT FOR INITIAL DEV DATA

Create `src/scripts/seed.ts` — a standalone script to populate the database with initial data.
Run with: `npx ts-node --project tsconfig.json src/scripts/seed.ts`

SEED DATA TO CREATE:

1. Admin User:
   name: "Admin", email: "admin@store.com",
   passwordHash: bcryptjs.hashSync("admin123", 12),
   role: "admin"

2. Customer User:
   name: "Test User", email: "user@store.com",
   passwordHash: bcryptjs.hashSync("user123", 12),
   role: "user"

3. Categories (minimum 4):
   - Electronics (slug: "electronics", icon: "Cpu")
   - Clothing (slug: "clothing", icon: "Shirt")
   - Home & Kitchen (slug: "home-kitchen", icon: "Home")
   - Books (slug: "books", icon: "BookOpen")

4. Products (minimum 8 — 2 per category):
   - Mix of isFeatured: true and false.
   - At least 1 product with stock <= lowStockThreshold (to test stock badge).
   - Use real Cloudinary image URLs or valid placeholder URLs.

The script must:
  - Call connectDB() before any DB operations.
  - Use deleteMany({}) before inserting to allow idempotent reruns.
  - Log success/failure for each collection.
  - Close connection after seeding.

Acceptance Criteria:
- Seed script runs without errors.
- MongoDB Atlas shows all 5 collections populated after running seed.
- Admin login works at `/login` after seeding.
```

---

### 🔐 Prompt 4: NextAuth.js v5 Authentication & RBAC Middleware

```text
PROMPT 4: NEXTAUTH v5 AUTH ENGINE & EDGE RBAC MIDDLEWARE
Resolves: [ISSUE-NFR-1 partial]

IMPORTANT: This uses NextAuth.js v5 (beta) which has a DIFFERENT API than v4.
Follow the v5 two-file split pattern exactly.

--- FILE 1: `src/auth.config.ts` (Edge-compatible, no Mongoose imports) ---
Export `authConfig` object with:
  - pages: { signIn: '/login' }
  - callbacks.authorized({ auth, request }):
      if path starts with '/admin' → require auth AND auth.user.role === 'admin'
      if path starts with '/dashboard' → require auth
      return true for all other paths
  - providers: [] (empty array — providers defined in auth.ts)

--- FILE 2: `src/auth.ts` (Node.js runtime, can import Mongoose) ---
Import authConfig from './auth.config'
Export { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        - Connect DB
        - Find user by email
        - If not found → return null
        - Compare password with bcryptjs.compare()
        - If mismatch → return null
        - Return { id, name, email, role }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) { if (user) { token.id = user.id; token.role = user.role } return token },
    session({ session, token }) { session.user.id = token.id; session.user.role = token.role; return session }
  }
})

--- FILE 3: `src/middleware.ts` ---
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
export const { auth: middleware } = NextAuth(authConfig)
export const config = { matcher: ['/admin/:path*', '/dashboard/:path*', '/api/admin/:path*'] }

--- FILE 4: `src/app/api/auth/[...nextauth]/route.ts` ---
import { handlers } from '@/auth'
export const { GET, POST } = handlers

--- FILE 5: `src/types/next-auth.d.ts` ---
Extend NextAuth types to add `role` and `id` to Session.user and JWT token.

--- FILES 6 & 7: Auth Pages ---
`src/app/(auth)/login/page.tsx`:
  - Email + Password inputs with Zod validation (min 6 chars password).
  - Call signIn('credentials', { email, password, redirectTo: '/' }).
  - Show error toast for invalid credentials.
  - Link to /register.
  - Fully responsive — single column centered card on all viewports.

`src/app/(auth)/register/page.tsx`:
  - Name + Email + Password + Confirm Password fields.
  - POST /api/auth/register to create user (hash password with bcryptjs, salt 12).
  - After success → redirect to /login.

Create `src/app/api/auth/register/route.ts`:
  - Validate with Zod. Check email uniqueness. Hash password. Create User. Return 201.

Acceptance Criteria:
- Admin user (seeded) can access /admin.
- Normal user is redirected away from /admin to /.
- Unauthenticated user is redirected from /dashboard to /login.
- /api/admin/* returns 401/403 without valid admin session.
- No infinite redirect loops.
- TypeScript: session.user.role and session.user.id compile without 'any'.
```

---

### ☁️ Prompt 5: Cloudinary Media Upload Pipeline

```text
PROMPT 5: CLOUDINARY IMAGE UPLOAD ENDPOINT
Resolves: [ISSUE-09]

Build the image upload system used by the Admin product forms.

--- FILE 1: `src/lib/cloudinary.ts` ---
  import { v2 as cloudinary } from 'cloudinary'
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  export default cloudinary

--- FILE 2: `src/app/api/upload/route.ts` ---
  - Auth check: require admin session. Return 401 if not admin.
  - Accept multipart/form-data with a `file` field.
  - Convert file to Buffer → upload to Cloudinary:
      folder: 'ecommerce/products'
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
      transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto' }]
  - Return: { success: true, url: result.secure_url, publicId: result.public_id }
  - On error: return 500 with error message.

Acceptance Criteria:
- Uploading a JPG via Postman/Thunder Client to /api/upload returns a valid Cloudinary CDN URL.
- Non-admin requests to /api/upload return 401.
- Uploaded images appear in Cloudinary dashboard under ecommerce/products folder.
```

---

### 🧱 Prompt 6: Core UI Component Library

```text
PROMPT 6: REUSABLE UI COMPONENT PRIMITIVES

Build all reusable UI components in `src/components/ui/`.
These will be used across Storefront, Customer Dashboard, and Admin panels.
All components must be fully responsive and meet the 44px minimum touch target rule.

Components to build:

1. `Button.tsx` — variants: primary, secondary, outline, ghost, destructive. Sizes: sm, md, lg.
   min-h-[44px] min-w-[44px] on all sizes. Full-width option.

2. `Input.tsx` — label, error message, required indicator. min-h-[44px].

3. `Select.tsx` — custom styled select with label and error.

4. `Badge.tsx` — variants: pending (amber), confirmed (blue), shipped (purple),
   delivered (emerald), cancelled (rose), low-stock (orange), active (green), draft (gray), archived (slate).

5. `Modal.tsx` — accessible dialog using `dialog` HTML element or headlessui.
   Backdrop click closes. ESC key closes. Trap focus inside.

6. `Drawer.tsx` — slide-over panel from right (or left). Used for Cart and mobile filter.
   Animated with framer-motion `x` transform. Overlay backdrop.

7. `Skeleton.tsx` — shimmer loading placeholders for ProductCard, Table rows, Metric cards.

8. `Stepper.tsx` — 6-stage visual progress tracker.
   Props: stages: string[], currentStage: number.
   Mobile: vertical layout with connecting line.
   Desktop (md:): horizontal layout with connecting line.
   Completed stages: filled circle (emerald). Current: pulsing ring. Pending: empty circle (gray).

9. `Pagination.tsx` — Previous/Next buttons + page number pills. Disabled state at boundaries.

10. `ImageUploader.tsx` — Admin-only component.
    Drag-and-drop area + click-to-browse. Preview uploaded image.
    Calls POST /api/upload. Shows progress bar. Returns secure_url to parent.

Acceptance Criteria:
- All components render without errors in Storybook or a test page.
- Badge correctly shows correct color for all 9 variants.
- Drawer opens/closes with smooth slide animation.
- Stepper shows correct states for a given currentStage.
```

---

### 🏗️ Prompt 7: Layout Shell — Navbar, Footer & Providers

```text
PROMPT 7: RESPONSIVE LAYOUT SHELL & GLOBAL PROVIDERS

Build the global layout components that wrap all storefront pages.

--- FILE 1: `src/components/shared/Navbar.tsx` ---
DESKTOP (lg: and above):
  - Left: Logo text/image linking to /.
  - Center: Navigation links — Home, Products, Categories (dropdown).
  - Right: Search icon (opens SearchModal), Cart icon with item count badge,
    User avatar dropdown (if logged in) OR Login/Register buttons.

MOBILE (below lg:):
  - Left: Hamburger icon button (min 44px) → opens slide-over Drawer.
  - Center: Logo.
  - Right: Cart icon with badge.
  - The Drawer contains: nav links, login/logout, user name if logged in.

Cart badge: shows total item count from Zustand useCartStore.
User dropdown: shows Dashboard link and Logout button if logged in.

--- FILE 2: `src/components/shared/Footer.tsx` ---
  4-column grid on desktop, 2-column on tablet, 1-column on mobile.
  Columns: Brand & tagline | Shop links | Customer links | Contact & social.
  Bottom bar: Copyright + accepted payment method badges (COD, bKash, Card icons).

--- FILE 3: `src/components/shared/Providers.tsx` ---
  Wrap with SessionProvider (NextAuth) and any other global providers.

--- FILE 4: `src/app/(storefront)/layout.tsx` ---
  Import Navbar + Footer + Providers. Apply `min-h-dvh` on root div.

--- FILE 5: `src/app/layout.tsx` ---
  Import Google Fonts (Inter) with `next/font/google`.
  Apply font className to `<html>` tag.
  Include `<Providers>`.

Acceptance Criteria:
- Navbar shows Desktop layout at 1024px+ and Mobile Drawer layout below 1024px.
- Hamburger Drawer opens and closes with slide animation.
- Cart icon badge updates when Zustand store changes.
- Footer renders 4 columns on desktop, 1 column on mobile 375px.
- `min-h-dvh` prevents iOS Safari URL-bar layout shift.
```

---

### 🛍️ Prompt 8: Product Catalog, Search & Product Details Page

```text
PROMPT 8: STOREFRONT CATALOG, SERVER-SIDE SEARCH & PDP
Resolves: [ISSUE-07] [ISSUE-08] [ISSUE-10]

Build all product browsing pages and their API routes.

--- API ROUTES ---

`GET /api/categories/route.ts`:
  Connect DB → Category.find({}).lean() → return JSON array.

`GET /api/products/route.ts`:
  Query params: page (default 1), limit (default 20, max 100), search, category (slug), sort.
  Sort options: 'price_asc' | 'price_desc' | 'createdAt_desc' | 'title_asc'.
  If search param present → use $text: { $search: searchTerm } (MongoDB Text Index).
  If category param present → resolve slug to ObjectId first, then filter.
  Only return status: 'active' products for public endpoint.
  Return: { products, totalPages, currentPage, totalCount }.

`GET /api/products/[slug]/route.ts`:   ← USE SLUG, NOT ID
  Find product by slug (not _id). Populate category name.
  Return full product including avgRating and reviewCount.

`GET /api/products/[slug]/reviews/route.ts`:
  Paginated list of reviews for a product.

`POST /api/products/[slug]/reviews/route.ts`:
  Auth required (customer). One review per user per product (409 if duplicate).
  After saving review → recalculate and update Product.avgRating and Product.reviewCount.

--- PAGES ---

`src/app/(storefront)/page.tsx` (Homepage):
  - Server Component — fetch featured products and categories from DB directly.
  - Hero: Full-width banner with CTA button. Responsive image.
  - Category Cards: `grid-cols-2 sm:grid-cols-4` with icon and category name.
  - Featured Products Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
  - Each ProductCard: image (next/image), title, price, discountPrice, avgRating stars, stock badge.

`src/app/(storefront)/products/page.tsx` (Catalog):
  - Read filters from URL searchParams (not state).
  - Desktop: Fixed left sidebar (w-64) with Category checkboxes, Price range, Sort select.
  - Mobile: "Filters" button → opens Drawer with same filter controls.
  - Debounced search input (300ms) → updates URL param `?search=` using router.push.
  - Product grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4`.
  - Pagination component at bottom.

`src/app/(storefront)/products/[slug]/page.tsx` (PDP):
  - Mobile: Swipe image carousel with dot pagination (framer-motion).
  - Desktop: Main image + thumbnail strip column on left.
  - Product info: title, category badge, price, discountPrice (crossed out), discount % badge.
  - Stock status badge: "In Stock" (emerald) / "Out of Stock" (rose).
  - Quantity selector: decrement/increment with stock cap. Min-h-[44px] buttons.
  - "Add to Cart" button → adds to Zustand store, shows toast notification.
  - "Buy Now" button → adds to cart → redirects to /checkout.
  - Review section: Star rating summary breakdown + list of reviews with username and date.

Acceptance Criteria:
- Searching "shirt" returns products matching title OR description.
- Category filter correctly resolves slug to ObjectId and filters.
- PDP fetches by slug, not by ID.
- Submitting a review updates avgRating on the product document.
- Product grid is responsive at all breakpoints (320px → 1536px).
```

---

### 🛒 Prompt 9: Zustand Cart, Checkout & Atomic Order Creation

```text
PROMPT 9: SHOPPING CART STATE & ATOMIC CHECKOUT FLOW
Resolves: [ISSUE-02] [ISSUE-03]

--- FILE 1: `src/store/useCartStore.ts` ---
Zustand store persisted to localStorage (persist middleware).
State shape: { items: CartItem[] }
CartItem: { productId, slug, title, image, price, quantity, stock }

Actions:
  addItem(item: CartItem): if productId already exists → increment qty (capped at stock). Else add.
  removeItem(productId: string): filter out.
  updateQuantity(productId, qty): replace. If qty <= 0 → remove.
  clearCart(): items = [].
  getSubtotal(): items.reduce((sum, i) => sum + i.price * i.quantity, 0).
  getTotalItems(): items.reduce((sum, i) => sum + i.quantity, 0).

--- FILE 2: `src/app/(storefront)/cart/page.tsx` ---
  Read items from useCartStore.
  Cart item rows: thumbnail (next/image), title, price, quantity controls (+/-), remove button, line total.
  Order summary sticky sidebar (desktop) / sticky bottom bar (mobile).
  Mobile sticky bar pattern (lg:hidden):
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 shadow-lg lg:hidden">
  Empty cart state: illustration + "Continue Shopping" button.

--- FILE 3: `src/app/(storefront)/checkout/page.tsx` ---
  If cart is empty → redirect to /cart.

  GUEST CHECKOUT (not logged in):
    Show email field at top: "We'll send your order confirmation here".

  LOGGED-IN CUSTOMER:
    Show saved addresses as selectable radio cards (from session user's addresses).
    Or "Use a new address" option to show the address form.

  Address Form: fullName, phone, street, city, postalCode, country (default BD).
  Payment Method radio: COD (Cash on Delivery) | Online (Stripe).
  Order Summary: items list, subtotal, shipping fee (flat or conditional), total.

  On Submit → POST /api/orders with { items, shippingAddress, paymentMethod, guestEmail? }.

--- FILE 4: `src/app/api/orders/route.ts` (POST handler) ---
CRITICAL: Use MongoDB Session Transaction for atomic stock guard.

Pattern:
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, session }   ← pass session to lock in transaction
      );
      if (!product) {
        await session.abortTransaction();
        return Response.json({ error: `"${item.title}" is out of stock` }, { status: 400 });
      }
    }
    const order = await Order.create([{
      orderNumber: generateOrderNumber(),
      user: session?.user?.id || null,
      guestEmail: guestEmail || null,
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingFee,
      totalAmount,
      currentStatus: 'pending',
      trackingTimeline: [{ status: 'pending', updatedAt: new Date() }]
    }], { session });
    await session.commitTransaction();
    // Send confirmation email async (do not await)
    sendOrderConfirmationEmail(order[0]).catch(console.error);
    return Response.json({ orderId: order[0]._id, orderNumber: order[0].orderNumber }, { status: 201 });
  } catch (err) {
    await session.abortTransaction();
    return Response.json({ error: 'Order failed. Please try again.' }, { status: 500 });
  } finally {
    session.endSession();
  }

NOTE: MongoDB Atlas free tier (M0) does NOT support transactions.
Use at least M2 cluster, OR as a fallback for free tier:
  - Do the stock check BEFORE decrementing with findOne({ stock: { $gte: qty } }).
  - Then do atomic findOneAndUpdate with $inc.
  - Accept that this is NOT 100% race-safe on M0 — document this limitation.

`POST /api/orders/[id]/cancel/route.ts`:
  - Auth required (customer or admin).
  - Customer can cancel ONLY if currentStatus is 'pending' or 'confirmed'.
  - Admin can cancel at any non-delivered stage.
  - Require cancellationReason in request body.
  - Set cancelledBy to 'customer' or 'admin' based on role.
  - Push { status: 'cancelled', note: cancellationReason } to trackingTimeline.

Acceptance Criteria:
- Placing two simultaneous orders for last 1 item → only 1 succeeds, other gets 400.
- Guest user can checkout without logging in.
- Cart persists across browser refresh (localStorage).
- Order cancellation sets cancellationReason and cancelledBy correctly.
```

---

### 💳 Prompt 10: Payment Webhooks & Transactional Emails

```text
PROMPT 10: PAYMENT LIFECYCLE & EMAIL NOTIFICATIONS
Resolves: [ISSUE-01-PAY] [ISSUE-NFR-4]

--- FILE 1: `src/lib/email.ts` ---
  import { Resend } from 'resend'
  const resend = new Resend(process.env.RESEND_API_KEY)

  Export async functions (all fire-and-forget from callers):

  sendOrderConfirmationEmail(order: IOrder):
    To: order.guestEmail OR fetch user email by order.user.
    Subject: `Order Confirmed — ${order.orderNumber}`
    HTML body: order summary table (items, qty, price), total, shipping address.

  sendOrderShippedEmail(order: IOrder, trackingNote: string):
    Subject: `Your order ${order.orderNumber} has shipped!`
    HTML body: tracking note (e.g. courier code), delivery address.

  sendOrderDeliveredEmail(order: IOrder):
    Subject: `Order ${order.orderNumber} Delivered 🎉`
    HTML body: thank you message + link to leave review.

--- FILE 2: `src/app/api/webhooks/stripe/route.ts` ---
  export const config = { api: { bodyParser: false } }  // raw body required for signature

  - Read raw body with request.text()
  - Get stripe-signature from headers
  - stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
  - On 'payment_intent.succeeded':
      Find order by paymentGatewayRef (paymentIntent.id)
      Update: paymentStatus = 'paid', paymentWebhookVerified = true
      Push tracking event: { status: 'confirmed' }
      Call sendOrderConfirmationEmail() async
  - Return 200 immediately even if email fails.
  - Return 400 if signature verification fails.

COD Payment Rule (documented, no webhook needed):
  paymentStatus remains 'pending' until Admin marks order 'delivered'.
  On PATCH /api/admin/orders/[id]/status when status → 'delivered' AND paymentMethod === 'COD':
    Also set paymentStatus = 'paid'.

Acceptance Criteria:
- Stripe test webhook (stripe listen --forward-to localhost:3000/api/webhooks/stripe) updates order paymentStatus.
- Order confirmation email received at test address after order placement.
- Shipped email received after admin advances status to 'shipped'.
- COD order paymentStatus automatically becomes 'paid' on delivery confirmation.
```

---

### 📦 Prompt 11: Customer Dashboard & Order Tracking Stepper

```text
PROMPT 11: CUSTOMER PORTAL, ADDRESS BOOK & VISUAL TRACKING
Resolves: [ISSUE-06] [ISSUE-05 partial]

--- LAYOUT: `src/app/dashboard/layout.tsx` ---
  Sidebar navigation (fixed on desktop, bottom tab bar on mobile):
  Links: Dashboard Overview, My Orders, Address Book, Account Profile.

--- PAGE 1: `src/app/dashboard/page.tsx` ---
  Welcome message with user name.
  Quick stat cards: Total Orders, Pending Orders, Delivered Orders.

--- PAGE 2: `src/app/dashboard/addresses/page.tsx` ---
  List all saved addresses (user.addresses[]) as cards.
  Each card: label, fullName, phone, full address text. "Default" badge if isDefault.
  Actions per card: Set as Default | Edit | Delete.
  "Add New Address" button → inline form or Modal.
  API endpoints needed:
    POST /api/user/addresses — add address to array.
    PATCH /api/user/addresses/[addressId] — update specific address.
    DELETE /api/user/addresses/[addressId] — remove from array.
    PATCH /api/user/addresses/[addressId]/default — set isDefault, unset others.

--- PAGE 3: `src/app/dashboard/orders/page.tsx` ---
  Fetch GET /api/orders/my-orders.
  Table (desktop) / Card stack (mobile) with:
    Order Number, Date, Items count, Total Amount, Payment Status badge, Order Status badge.
  Click row → navigate to /dashboard/orders/[id].

--- PAGE 4: `src/app/dashboard/orders/[id]/page.tsx` ---
  Fetch GET /api/orders/[id]/route.ts (auth check — user can only see own orders).

  Visual 6-stage Stepper:
    stages: ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']
    Map currentStatus to stage index. Pass to <Stepper> component.
    Desktop: horizontal. Mobile: vertical.

  Timeline List: trackingTimeline reversed (newest first).
    Each event: status badge, note (if any), formatted timestamp.

  Cancellation Section (show ONLY if currentStatus is 'pending' or 'confirmed'):
    Textarea for cancellationReason (required).
    "Cancel Order" button → POST /api/orders/[id]/cancel.
    Confirm with a Modal before submitting.

  Order Summary: items with images, subtotal, shipping fee, total.
  Shipping Address card.

`GET /api/orders/[id]/route.ts`:
  Auth check: must be logged in AND (order.user === session.user.id OR role === 'admin').
  Guest orders: match by guestEmail if no session.

`GET /api/orders/my-orders/route.ts`:
  Auth required. Find orders where user === session.user.id.
  Paginated. Sort by createdAt desc.

Acceptance Criteria:
- Customer can add, edit, delete, and set default shipping addresses.
- Order stepper shows correct stage highlighted for all 6 statuses.
- Customer CANNOT see another user's order (403 returned).
- Cancel button only appears for pending/confirmed orders.
```

---

### ⚙️ Prompt 12: Admin Dashboard & Order Status Dispatcher

```text
PROMPT 12: ADMIN CONSOLE, INVENTORY MANAGEMENT & STATUS DISPATCHER

Build the complete admin management portal.

--- PAGE 1: `src/app/admin/page.tsx` (Metrics Overview) ---
  4 Metric Cards (responsive 1→2→4 column grid):
    Total Revenue (sum of all paid orders), Total Orders count,
    Pending Orders count, Low Stock Products count (stock <= lowStockThreshold).
  GET /api/admin/metrics — aggregate these 4 values from DB.
  Recent 10 orders quick table with status badges and action link.

--- PAGE 2: `src/app/admin/products/page.tsx` (Product Table) ---
  Filterable by status: All | Active | Draft | Archived.
  Table columns: Image, Title, Category, Price, Stock, Status, Actions.
  Stock Badge: if stock <= lowStockThreshold → show orange badge "Low Stock: X left".
  If stock === 0 → show red badge "Out of Stock".
  Actions per row: Edit | Archive | Delete (with confirm Modal).

`src/app/admin/products/create/page.tsx` and `[id]/edit/page.tsx`:
  Product form with:
    Title (auto-generates slug on blur using generateSlug()),
    Description (textarea),
    Category (select from /api/categories),
    Price, Discount Price (optional),
    Stock quantity, Low Stock Threshold (number input, default 5),
    <ImageUploader> component (multiple images, returns URLs array),
    isFeatured toggle, Status select.

Admin Product API routes:
  POST /api/admin/products — create.
  PUT /api/admin/products/[id] — update.
  DELETE /api/admin/products/[id] — soft delete (set status: 'archived').

--- PAGE 3: `src/app/admin/categories/page.tsx` ---
  CRUD table for categories.
  Add/Edit Modal: name (auto-generates slug), description, icon (select from Lucide icon list).
  Admin Category API:
    GET /api/admin/categories
    POST /api/admin/categories
    PUT /api/admin/categories/[id]
    DELETE /api/admin/categories/[id] — only if no products reference this category.

--- PAGE 4: `src/app/admin/orders/page.tsx` ---
  Filter tabs: All | Pending | Confirmed | Processing | Shipped | Out for Delivery | Delivered | Cancelled.
  Paginated table: Order#, Customer (name+email), Date, Total, Payment Status, Order Status, Action.

`src/app/admin/orders/[id]/page.tsx`:
  Full order details: customer info, items table with images, shipping address card.
  Payment info: method, status, gatewayRef.

  Status Dispatcher:
    Current status displayed with badge.
    Dropdown to select next valid status (enforce one-way flow — cannot go backward).
    Optional note input (e.g. "Shipped via Pathao, tracking: BD123456").
    "Update Status" button → PATCH /api/admin/orders/[id]/status.
    On status === 'shipped' → send Shipped email async.
    On status === 'delivered' AND paymentMethod === 'COD' → also set paymentStatus = 'paid'.
    On status update → push new ITrackingEvent to trackingTimeline.

Acceptance Criteria:
- Admin metrics reflect actual DB data.
- Low stock badge appears correctly based on lowStockThreshold (not hardcoded 5).
- Order status can only advance forward (no reversal allowed in dispatcher).
- Category cannot be deleted if products reference it.
- Shipped email sent after admin advances to 'shipped'.
```

---

### 🛡️ Prompt 13: Rate Limiting, SWR Polling, Security Headers & Production Audit

```text
PROMPT 13: SECURITY HARDENING, REAL-TIME POLLING & PRODUCTION BUILD
Resolves: [ISSUE-NFR-1] [ISSUE-NFR-2] [ISSUE-NFR-3]

STEP 1 — Rate Limiting (`src/lib/ratelimit.ts`):
  import { Ratelimit } from '@upstash/ratelimit'
  import { Redis } from '@upstash/redis'

  export const loginRatelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'rl:login',
  });

  export const orderRatelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'rl:order',
  });

  Apply loginRatelimit inside `POST /api/auth/register` and the Credentials authorize function.
  Apply orderRatelimit inside `POST /api/orders`.
  On rate limit exceeded → return Response.json({ error: 'Too many requests' }, { status: 429 }).

STEP 2 — Real-Time Order Status Updates (SWR Polling):
  In `src/app/dashboard/orders/[id]/page.tsx`:
  Replace static server fetch with SWR client hook:
    const { data: order } = useSWR(`/api/orders/${id}`, fetcher, { refreshInterval: 10000 })
  This polls every 10 seconds — customer sees stepper update without page refresh.
  Show a "Live" pulsing green dot indicator near the stepper header.

STEP 3 — Data Privacy (Account Deletion):
  `DELETE /api/user/account/route.ts`:
    Auth required. Delete user document.
    Anonymize linked orders: set user = null, preserve financial data.
    Return 200 on success.
  Add "Delete Account" button in /dashboard/profile page with confirm Modal.

STEP 4 — SEO & Meta Tags:
  In each storefront page, export a `generateMetadata()` function:
    Homepage: title "E-Store | Shop Online", description with keywords.
    PDP: title = product.title, description = product.description[:160], og:image = product.images[0].
    Catalog: title "All Products | E-Store".
  Create `src/app/sitemap.ts` → export a dynamic sitemap including all active product slugs.
  Create `src/app/robots.ts` → allow crawlers on storefront, disallow /admin and /dashboard.

STEP 5 — Error Boundaries & Loading States:
  Create `src/app/error.tsx` — global error boundary with friendly UI and reload button.
  Create `src/app/not-found.tsx` — custom 404 page with back-to-home button.
  Add `loading.tsx` files in catalog, dashboard/orders, and admin/orders for Skeleton UI.

STEP 6 — Production Build Verification:
  Run: npm run build
  Fix ALL TypeScript errors and ESLint warnings until build succeeds with exit code 0.
  Run: npm run start
  Verify Core Web Vitals using Chrome DevTools Lighthouse:
    LCP < 2.5s, CLS < 0.1, FID < 100ms.

Acceptance Criteria:
- Login endpoint returns 429 after 10 rapid attempts.
- Order tracking stepper updates automatically within 10s of admin status change.
- `npm run build` exits with code 0 — zero TypeScript errors.
- Lighthouse performance score ≥ 85 on homepage.
- /sitemap.xml returns valid XML with all active product URLs.
- Account deletion removes user credentials but retains anonymized orders.
```

---

## 📊 Prompt-to-Issue Resolution Traceability

| Prompt | Resolves Issues | Key Deliverables |
| :---: | :--- | :--- |
| Prompt 1 | ISSUE-01, ISSUE-09 | Project scaffold, env config, security headers |
| Prompt 2 | ISSUE-02, 04, 05, 06, 07, 10 | All 5 Mongoose models with correct schemas |
| Prompt 3 | — | Database seeding for dev environment |
| Prompt 4 | — | NextAuth v5 with correct auth.config.ts split |
| Prompt 5 | ISSUE-09 | Cloudinary upload pipeline |
| Prompt 6 | — | 10 reusable UI component primitives |
| Prompt 7 | — | Responsive Navbar + Footer layout shell |
| Prompt 8 | ISSUE-07, 08, 10 | Catalog, search, PDP (slug-based) |
| Prompt 9 | ISSUE-02, 03 | Cart state + MongoDB Transaction checkout |
| Prompt 10 | ISSUE-01-PAY, NFR-4 | Stripe webhook + Resend emails |
| Prompt 11 | ISSUE-05, 06 | Customer dashboard + tracking stepper |
| Prompt 12 | — | Admin console + status dispatcher |
| Prompt 13 | ISSUE-NFR-1, 2, 3 | Rate limiting, polling, SEO, production build |

---

*This prompt guide is complete and executable. Follow sequentially. Each prompt builds on the previous one.*
