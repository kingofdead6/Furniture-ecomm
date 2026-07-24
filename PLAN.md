# Build Plan — Editorial Fashion Storefront

> Stack detected: **MERN** — MongoDB + Mongoose, Express 5 (ESM), React 19 + Vite 6,
> Tailwind v4 (CSS-first `@theme`), React Router 7. Framer Motion, GSAP, lucide-react
> already installed. No TypeScript. Client deploys to Vercel, server to Render.
>
> This document is the Phase 0 deliverable. **No application code is touched until it's approved.**

---

## 1. Current architecture (what actually exists)

### Backend — `server/` (Express 5, ESM, Mongoose)
- **Entry** `index.js`: CORS-open, JSON body, Mongo connect, 6 route groups mounted under `/api/*`, single `errorHandler`. No optional-auth, no request logging, no rate limiting.
- **Models**
  - `Product` — name, slug, description, price, `images[{url,public_id}]`, `category` (ref), `stock`, `featured`, timestamps. **No variants, no colors/sizes, no compareAtPrice, no collection, no rating.**
  - `Categories` — name (unique), description, image. No slug.
  - `Order` — Algerian COD shape: customerName/phone/email, **wilaya**, address/desk, `deliveryType` (home/desk), `deliveryPrice`, embedded `items[]`, subtotal, totalPrice, `status` enum `pending→confirmed→in_delivery→reached→canceled`. **No coupon, no order number, no per-item variant, no status history, no customer ref.**
  - `User` — name, email, password (bcrypt pre-save hook), `usertype` enum `user|admin|superadmin`. **No addresses, no wishlist. `user` type exists but is never issued or used.**
  - `DeliveryArea` — wilaya, priceHome, priceDesk, `desks[]`. Powers checkout shipping cost.
  - `Contact` — support messages with status.
- **Controllers** — thin, `express-async-handler`. Product/Category/Order/Contact/DeliveryArea/Auth. Product list supports only `category` + `featured` query filters — **no pagination, sort, search, price/size/color filter, or related-products.**
- **Auth** — JWT (30d) in header `Bearer`, `protect`/`admin`/`superadmin` middleware. Login only; customer registration route is **superadmin-gated** (no public signup). `usertype` embedded in the token.
- **Uploads** — Cloudinary via `multer` memory storage (`upload.array('images',8)` for products, single for categories). `public_id` is always stored `null` (deletes can't clean Cloudinary — a latent bug).
- **Email** — Nodemailer (Gmail) fires on order-status change if `customerEmail` present.
- **Seed** — `seed/seed.js`: 1 superadmin, 3 generic categories, 6 placeholder products via `via.placeholder.com`. Idempotent upserts.

### Frontend — `client/src/` (React 19, Router 7, Tailwind v4)
- **Config as source of truth** — `store.config.js` holds brand/theme/contact/locale; `applyStoreConfig.js` writes 3 theme hexes → CSS vars at runtime and syncs `<title>`/favicon. **Excellent pattern — keep and extend it.**
- **`App.jsx`** — `BrowserRouter`, a fixed aurora background, Navbar/Footer shell, routes: `/`, `/products`, `/products/:id`, `/contact`, `/cart`, `/checkout`, `/login`, admin group behind `ProtectedRoute`, `*` 404.
- **State** — **no global store.** Cart lives in `localStorage["cart"]` (`[{productId,name,price,image,quantity}]`) synced via a custom `cartUpdated` window event. Auth = `localStorage["token"]` decoded with `jwt-decode`, synced via `authChanged` event. Duplicated cart logic in `NavBar.jsx` and `Cart.jsx`.
- **Design language (to be replaced)** — dark `#050816`, purple/cyan gradients, glassmorphism (`backdrop-blur`), neon box-shadows, 3D tilt cards, emoji icons (🛒📦), `Space Grotesk`/`Manrope`/`JetBrains Mono`. Mix of inline styles and Tailwind classes. **This is a SaaS-landing aesthetic — the antithesis of the brief.**
- **Pages/Components** — HomePage (Hero, Categories, BestSellers, Services, WhyUs, CTA), ProductsPage (search + category chips, client-side filter only), ProductDetails, FinalizeOrder (checkout — single step, wilaya + delivery-type + COD), Cart, NavBar, Footer, Login, NotFound, ContactPage, full Admin set (Dashboard, Products, Orders, Categories, DeliveryAreas, Users, ContactMessages).

### Build/verify
- Client: `npm run build` (vite), `npm run lint` (eslint flat config, `no-unused-vars` error). Server: no test/lint script.

---

## 2. What's reusable (extend, don't rewrite)

| Keep & extend | Why |
|---|---|
| `store.config.js` + `applyStoreConfig.js` pattern | Clean single-source-of-truth for brand/theme. We re-skin by editing tokens here. |
| Mongoose model + async-handler + `errorHandler` structure | Solid REST spine. We add models/fields and richer controllers alongside. |
| JWT `protect`/`admin`/`superadmin` middleware | Reuse as-is; add `optionalAuth` + `customer` guard beside it. |
| Cloudinary upload util | Reuse; fix `public_id` capture so deletes work. |
| DeliveryArea + wilaya checkout flow | The store's real COD logistics — **preserve**, restyle only. |
| Cart localStorage contract | Keep the shape, wrap it in a `CartContext` so Navbar/Cart/Checkout stop duplicating. |
| Admin CRUD screens | Rebuild visually + wire new fields (variants, coupons, collections). Logic patterns reused. |
| Framer Motion / GSAP deps | Already present — power the scroll reveals + page transitions the brief demands. |

---

## 3. What's missing (the gap to the brief)

**Data model:** Variant (size/color/SKU/stock), Collection/Lookbook, Coupon, Review, customer Addresses, Wishlist, order number + per-item variant + status history + customer ref + applied coupon/discount.

**API:** pagination, sorting, full-text search, price/size/color/collection filtering, related products, server-authoritative cart re-pricing + stock decrement on variants, coupon validation rules, public customer signup + `/me` + profile/address/wishlist endpoints, reviews CRUD, collections endpoints.

**Storefront pages:** Shop with real filters/sort/pagination, redesigned Product detail (multi-image gallery, variant picker, size guide, stock states, related, reviews), multi-step Checkout, Order confirmation, Collections/Lookbook, About, FAQ, Shipping & Returns, customer Account (profile/orders/addresses), Search results, Wishlist. (Home, Cart, Contact, 404 exist but get redesigned.)

**Admin:** variant management + real image upload UI, order detail with lifecycle, customers view, coupons, collections, basic stats.

**Design:** the entire editorial art-direction system (below). This is the largest single piece of work.

**Cross-cutting:** loading skeletons / empty / error states per async view, accessibility pass (semantic HTML, focus states, alt text, contrast), mobile-first responsiveness at 375px.

---

## 4. Art-direction system (the non-negotiable core)

Editorial-fashion bar (SSENSE / Jacquemus / Aimé Leon Dore / Studio Nicholson). Defined once in `store.config.js` + `index.css`, consumed everywhere.

- **Type** — Display: **Fraunces** (high-contrast variable serif, optical sizing, tight tracking, used at 64–120px). UI/body: **Archivo** (clean grotesque, 13–16px, wide-tracked small-caps for labels). Two families only — no Inter-for-everything. Real hierarchy jumps (14px body next to 90px headline).
- **Palette** — Base **bone `#F3EFE6`**, ink **near-black `#17130E`**, secondary paper `#E9E3D6`, muted `#8A8272`, hairline `rgba(23,19,14,.12)`. **ONE accent: clay/terracotta `#B4471F`**, used sparingly (links, one CTA, sold-out marker). Banned: purple→blue gradients, glassmorphism, neon, rainbow. (All swappable in config.)
- **Layout** — asymmetry + generous negative space; deliberate grid breaks: offset images, full-bleed sections, editorial 2-up with intentional imbalance. Not uniform rounded drop-shadow cards.
- **Motion** — subtle, physical: staggered scroll reveals, image scale-on-hover, page transitions via Framer `AnimatePresence`. Slow custom easing `cubic-bezier(.22,1,.36,1)`, 600–900ms. Never bouncy.
- **Photography-first** — big, quiet, uncropped. Consistent real placeholder imagery (curated Unsplash fashion set, one fixed pool reused across seed + pages so it reads as one brand).
- **Per-page memorable moment** — Home: oversized type + running marquee; Shop: hover-reveal second image on cards; Product: sticky split-scroll gallery; Collections: full-bleed lookbook; About: large pull-quote. No moment reused twice.
- **Banned defaults** enforced in review: no emoji icons (swap to lucide line icons), no centered hero+subtitle+two-buttons, no "Lorem ipsum" / "Elevate your style" filler — real, specific brand copy throughout.

---

## 5. File-by-file plan

### Phase 1 — Backend

**Models**
- `Models/Product.js` — add `variants[{ size, color, colorHex, sku, stock, priceOverride? }]`, `compareAtPrice`, `gender`, `colors[]`/`sizes[]` (derived facets for filtering), `collections[ref]`, `ratingAvg`/`ratingCount`, `status` (active/draft), keep top-level `stock` as sum-of-variants (virtual or maintained). Text index on name/description.
- `Models/Collection.js` *(new)* — name, slug, description, heroImage, `products[ref]`, season, `featured`, `order`.
- `Models/Coupon.js` *(new)* — code (unique upper), type (percent/fixed/free_shipping), value, minSubtotal, startsAt/expiresAt, usageLimit/usedCount, perCustomerLimit, active. Validation method.
- `Models/Review.js` *(new)* — product ref, customer ref + name, rating 1–5, title, body, verified, status. Post-save recomputes `Product.ratingAvg/Count`.
- `Models/User.js` — add `phone`, `addresses[{ label,line1,line2,wilaya,desk,deliveryType,isDefault }]`, `wishlist[ref Product]`. Fix pre-save hook (currently missing `next()` on the non-modified path).
- `Models/Order.js` — add `orderNumber` (human, e.g. `AT-000123`), `customer` ref (nullable for guest), per-item `variant{size,color,sku}` + `slug`, `couponCode`/`discount`, `statusHistory[{status,at}]`. Keep wilaya/deliveryType/COD shape.
- `Models/Categories.js` — add `slug`, optional `parent`, `heroImage`, `order`.

**Controllers / routes**
- `productController` — rewrite `getProducts` for pagination (`page`,`limit`), `sort` (new/price asc-desc/name), `search` (text), filters (`category`,`collection`,`gender`,`size`,`color`,`minPrice`,`maxPrice`,`featured`). Add `getRelated`. Fix `public_id` capture on upload; delete cleans Cloudinary. Validate + guard admin writes.
- `collectionController` + `Routes/collectionRoutes.js` *(new)* — list/get-by-slug (public), CRUD (admin).
- `couponController` + `Routes/couponRoutes.js` *(new)* — `POST /validate` (public, server-authoritative), CRUD (admin).
- `reviewController` + `Routes/reviewRoutes.js` *(new)* — list by product + create (customer/guest), moderate/delete (admin).
- `orderController` — **re-price server-side** from DB (never trust client `price`), validate + **decrement variant stock atomically**, apply/re-validate coupon, generate `orderNumber`, push status history, attach `customer` when logged in, keep guest COD. Add `GET /orders/mine` (customer), keep admin list + status update.
- `auth.js` / `authRoutes.js` — add **public `POST /register`** (issues `user`), `GET /me`, `PUT /me`, address CRUD (`/me/addresses`), wishlist (`GET/POST/DELETE /me/wishlist`). Keep superadmin user management.
- `Middleware/auth.js` — add `optionalAuth` (attach `req.user` if token present, never 401) for guest-or-customer checkout, and `customer` guard.
- `utils/` — `paginate.js`, `pricing.js` (single shared re-price + coupon + shipping calc used by order + coupon-validate so numbers can't diverge).

**Seed** — `seed/seed.js` rewrite: ~24 realistic clothing products across **Outerwear, Knitwear, Shirting, Trousers, Tees, Dresses, Footwear, Accessories**, each with variants (S–XL / real colorways), curated Unsplash imagery pool, 3–4 Collections, 2–3 Coupons, admin + demo customer, sample reviews, Algerian DeliveryAreas. Idempotent.

**Verify:** boot server against a scratch Mongo (or dry `node --check`), exercise routes; then commit.

### Phase 2 — Storefront + design system

**Design system**
- `index.css` — replace wholesale: import Fraunces + Archivo, define editorial tokens/vars, editorial utilities (marquee, reveal, hairline, split-scroll), motion keyframes with slow easing. Remove aurora/blob/neon.
- `store.config.js` — new brand identity + editorial palette + fonts; `applyStoreConfig.js` extend to set font vars.
- `index.html` — Fraunces/Archivo preconnect + links, base title.
- `App.jsx` — drop aurora; bone background; `AnimatePresence` page transitions; register all new routes.

**Shared / infra**
- `context/CartContext.jsx`, `context/AuthContext.jsx`, `context/WishlistContext.jsx` *(new)* — wrap the existing localStorage contracts; components consume hooks instead of duplicating logic.
- `Components/Shared/` — redesign `NavBar` (editorial, transparent-over-hero → solid on scroll, cart/wishlist/account), `Footer`, `Cart` drawer; new `ProductCard` (hover-reveal 2nd image), `Skeletons`, `EmptyState`, `ErrorState`, `SizeGuide` modal, `Marquee`, `Reveal` (scroll), `Price`, `Pagination`, `FilterSidebar`, `Breadcrumbs`.

**Pages** (`Pages/`)
- `HomePage` — editorial redesign (oversized type + marquee moment, featured collection full-bleed, new-arrivals 2-up).
- `Shop` (replaces ProductsPage) — server-driven filters (category/size/color/price)/sort/pagination, URL-synced, skeleton + empty + error states.
- `ProductDetail` — gallery (sticky split-scroll), variant picker (size/color w/ stock state + sold-out), size guide, add-to-cart/wishlist, related, reviews.
- `Cart`, `Checkout` (multi-step: contact → delivery(wilaya/desk/home) → review+coupon → place COD order), `OrderConfirmation`.
- `Collections`/`Lookbook`, `About`, `Contact` (restyle existing), `FAQ`, `ShippingReturns`, `Search`, `Wishlist`.
- `Account` (profile / order history / addresses), `Login` + `Register` (customer + admin), `NotFound` (restyle).

**Verify:** `npm run build` + `npm run lint` clean; mental 375px pass on every layout; commit.

### Phase 3 — Admin dashboard
Same editorial language, **denser** layout, sidebar shell. `AdminDashboard` (stats: revenue, orders by status, low-stock, top products), `AdminProducts` (variants editor + multi-image upload w/ previews + drafts), `AdminOrders` (list + detail + lifecycle + status history), `AdminCustomers` *(new)*, `AdminCoupons` *(new)*, `AdminCollections` *(new)*, restyle `AdminCategories`/`AdminDeliveryAreas`/`AdminUsers`/`AdminContactMessages`. Loading/empty/error states throughout.

**Verify:** build + lint clean; commit.

---

## 6. Rules I'm committing to
Mobile-first, tested mentally at 375px · semantic HTML + keyboard nav + focus states + alt text + contrast · skeletons/empty/error for every async view (not just spinners) · no TODOs, stubs, or dead links · after each phase run build/lint, fix all errors, commit, summarize, and **wait for your go-ahead**.

---

## 7. Decisions I need you to confirm before Phase 1
The `{{BRAND}}` / `{{STACK}}` placeholders weren't filled in, so I've chosen sensible defaults. Veto any of these:

1. **Brand** — I'll name the store **"ATELIER"** (editorial, works for apparel; fully swappable in one config file). Prefer a different name?
2. **Payment model** — the template is **cash-on-delivery, Algeria (wilaya-based)**. I'll keep COD as the payment method (fits the locale + delivery data) but make checkout multi-step and server-authoritative on price/stock/coupons. Want me to keep COD, or add a mock card step too?
3. **Customer accounts** — I'll enable **public customer signup** (guest checkout still allowed) so Account/Wishlist/Order-history work. OK?
4. **Palette accent** — single **clay/terracotta `#B4471F`** on a bone base. Happy with that, or name a different accent?

Everything above is config-swappable, so these don't block structure — but confirming avoids rework on copy and seed data.
