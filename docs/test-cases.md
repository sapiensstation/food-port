# Food Village POS — Test Cases

> **Backend base URL:** `http://localhost:3001/api`
> **Frontend base URL:** `http://localhost:3000`
> **DB:** Docker Postgres `localhost:5432/foodvillage` · Prisma Studio: `http://localhost:5555`
>
> **Auth:** Pre-signed JWTs in `postman_environment.json` (1-year expiry, signed with `local-test-jwt-secret-food-village-2024`).
> `POST /api/auth/login` requires real Supabase credentials — all other endpoints use the pre-signed tokens.

---

## Phase 1 — Public Menu & Ordering

### TC-01 · Health Check
- **URL:** `GET http://localhost:3001/api/health`
- **Description:** Confirms backend is running and reachable.
- [x] Returns `{ status: "ok" }` with HTTP 200

### TC-02 · List All Vendors
- **URL:** `GET http://localhost:3001/api/vendors`
- **Description:** Public vendor listing with no auth required.
- [x] Returns array of 10 vendors each with `id, name, slug, cuisine_type, booth_number, booth_color, is_accepting_orders`

### TC-03 · Vendor Detail
- **URL:** `GET http://localhost:3001/api/vendors/:vendorId`
- **Description:** Fetch single vendor info (Burger Barn used as fixture).
- [x] Returns vendor object with `categories` array

### TC-04 · Vendor Menu — Categories Populated
- **URL:** `GET http://localhost:3001/api/vendors/:vendorId/menu`
- **Description:** Full menu with nested categories and items.
- [x] `categories` array contains at least 2 entries, each shaped `{ category: {...}, items: [...] }`

### TC-05 · Menu Item Has Required Fields
- **URL:** `GET http://localhost:3001/api/vendors/:vendorId/menu`
- **Description:** Validates menu item schema from the public endpoint.
- [x] Each item has `id, name, description, price, is_available, prep_time_minutes`

### TC-06 · Menu Item Price Is Positive
- **URL:** `GET http://localhost:3001/api/vendors/:vendorId/menu`
- **Description:** Data quality check — no $0 or negative prices.
- [x] All item `price` values are > 0

### TC-07 · Create Order — Happy Path
- **URL:** `POST http://localhost:3001/api/orders`
- **Description:** Customer submits a valid order with vendor_id and items array.
- [x] Returns `{ order: { id, token_number, status: "pending", total } }` with 201

### TC-08 · Order Token Number Assigned
- **URL:** `POST http://localhost:3001/api/orders`
- **Description:** Each order gets a human-readable pickup token like "B-001".
- [x] Created order has non-null `token_number`

### TC-09 · Order Total Includes Tax
- **URL:** `POST http://localhost:3001/api/orders`
- **Description:** Oklahoma 8.25% sales tax applied.
- [x] `total` = subtotal × 1.0825 rounded to 2 decimal places

### TC-10 · Order Status Polling
- **URL:** `GET http://localhost:3001/api/orders/:orderId/status`
- **Description:** Public polling endpoint for customer confirmation page.
- [x] Returns `{ status, token_number, updated_at }`

### TC-11 · Order Not Found Returns 404
- **URL:** `GET http://localhost:3001/api/orders/00000000-0000-0000-0000-000000000000/status`
- **Description:** Non-existent order ID handled gracefully.
- [x] Returns 404

### TC-12 · Order Requires Vendor ID
- **URL:** `POST http://localhost:3001/api/orders`
- **Description:** DTO validation rejects missing vendor_id.
- [x] Missing `vendor_id` returns 400 with validation error

### TC-13 · Order Requires At Least One Item
- **URL:** `POST http://localhost:3001/api/orders`
- **Description:** Empty items array not allowed.
- [x] `items: []` returns 400

### TC-14 · Order Item Quantity Minimum
- **URL:** `POST http://localhost:3001/api/orders`
- **Description:** Item quantity must be ≥ 1.
- [x] `quantity: 0` on item returns 400

### TC-15 · Multiple Vendors — Separate Orders
- **URL:** `POST http://localhost:3001/api/orders` (×2)
- **Description:** Each vendor gets its own order record.
- [x] Two calls with different `vendor_id`s produce two distinct orders in DB

---

## Phase 2 — Vendor Portal (Authenticated)

### TC-16 · Vendor Auth — GET /me
- **URL:** `GET http://localhost:3001/api/auth/me`
- **Description:** Vendor token validated; returns user profile with vendor binding.
- [x] `burger_vendor_token` → user with `role: "vendor_owner"`, `vendor_id` set

### TC-17 · Vendor Auth — Wrong Token Rejected
- **URL:** `GET http://localhost:3001/api/auth/me`
- **Description:** Invalid JWT rejected at auth guard.
- [x] Invalid token → 401 Unauthorized

### TC-18 · Vendor Dashboard Stats
- **URL:** `GET http://localhost:3001/api/vendor/dashboard`
- **Description:** Per-vendor daily summary for dashboard widgets.
- [x] Returns `{ orders_today, revenue_today, pending_count }`

### TC-19 · Vendor Own Menu
- **URL:** `GET http://localhost:3001/api/vendor/menu`
- **Description:** Vendor sees only their own menu items.
- [x] `burger_vendor_token` → Burger Barn menu only

### TC-20 · Vendor Cannot See Other Vendor Menu
- **URL:** `GET http://localhost:3001/api/vendor/menu`
- **Description:** Tenant isolation — vendor token scoped to their vendor_id.
- [x] `pizza_vendor_token` → Pizza Palace data, NOT Burger Barn

### TC-21 · Create Menu Category
- **URL:** `POST http://localhost:3001/api/vendor/categories`
- **Description:** Vendor adds a new menu category.
- [x] `{ name: "Specials" }` → 201, new category returned

### TC-22 · Create Menu Item
- **URL:** `POST http://localhost:3001/api/vendor/menu-items`
- **Description:** Vendor creates a new menu item with pricing.
- [x] Valid body → 201, item has `id, name, base_price`

### TC-23 · Update Menu Item
- **URL:** `PATCH http://localhost:3001/api/vendor/menu-items/:id`
- **Description:** Vendor edits item name and price.
- [x] `{ name: "New Name", base_price: 15.99 }` → 200, item updated

### TC-24 · Toggle Item Availability
- **URL:** `PATCH http://localhost:3001/api/vendor/menu-items/:id/availability`
- **Description:** Vendor marks item as sold out without deleting it.
- [x] `{ is_available: false }` → item marked unavailable

### TC-25 · Delete Menu Item
- **URL:** `DELETE http://localhost:3001/api/vendor/menu-items/:id`
- **Description:** Vendor permanently removes a menu item.
- [x] 200, item removed from `GET /vendor/menu` response

### TC-26 · Create Modifier Group
- **URL:** `POST http://localhost:3001/api/vendor/modifier-groups`
- **Description:** Vendor creates an option group (e.g. Size choices).
- [x] `{ name: "Size", selection_type: "single", required: true }` → 201

### TC-27 · Add Modifier to Group
- **URL:** `POST http://localhost:3001/api/vendor/modifier-groups/:groupId/modifiers`
- **Description:** Vendor adds an option with a price delta to an existing group.
- [x] `{ name: "Large", price_delta: 2.00 }` → 201

### TC-28 · Link Modifier Group to Item
- **URL:** `POST http://localhost:3001/api/vendor/menu-items/:itemId/modifier-groups/:groupId`
- **Description:** Attaches a modifier group to a menu item.
- [x] 200, group appears on item

### TC-29 · Vendor Orders List
- **URL:** `GET http://localhost:3001/api/vendor/orders`
- **Description:** Vendor sees only their own orders (tenant isolation).
- [x] Returns array of orders for the authenticated vendor only

### TC-30 · Vendor Order Status Update
- **URL:** `PATCH http://localhost:3001/api/vendor/orders/:orderId/status`
- **Description:** Vendor kitchen staff advances order through workflow.
- [x] `{ status: "preparing" }` → 200

### TC-31 · Vendor Cannot Update Other Vendor's Order
- **URL:** `PATCH http://localhost:3001/api/vendor/orders/:orderId/status`
- **Description:** Cross-vendor order modification blocked.
- [x] `pizza_vendor_token` on a Burger Barn order → 403

### TC-32 · Kitchen PIN Login
- **URL:** `POST http://localhost:3001/api/auth/pin-login`
- **Description:** Kitchen staff authenticate with vendor_id + 4-digit PIN.
- [x] `{ vendor_id: <burger_id>, pin: "1234" }` → 200, returns staff metadata

### TC-33 · Wrong PIN Rejected
- **URL:** `POST http://localhost:3001/api/auth/pin-login`
- **Description:** Incorrect PIN rejected with 401.
- [x] `{ pin: "0000" }` → 401

### TC-34 · KDS Live Orders
- **URL:** `GET http://localhost:3001/api/kds/orders`
- **Description:** Kitchen Display System shows only active orders.
- [x] Returns orders with status `pending` or `preparing`

### TC-35 · KDS Advance Order
- **URL:** `PATCH http://localhost:3001/api/kds/orders/:orderId/advance`
- **Description:** One-tap status advance for kitchen workflow.
- [x] Status moves: `pending` → `preparing` → `ready`

---

## Phase 3 — Admin Portal

### TC-36 · Admin Auth Check
- **URL:** `GET http://localhost:3001/api/auth/me`
- **Description:** Super admin token returns correct role.
- [x] `super_admin_token` → `role: "super_admin"`

### TC-37 · Vendor Role Blocked from Admin
- **URL:** `GET http://localhost:3001/api/admin/overview`
- **Description:** Admin routes require admin role — vendor tokens rejected.
- [x] `burger_vendor_token` → 403 Forbidden

### TC-38 · Admin Overview
- **URL:** `GET http://localhost:3001/api/admin/overview`
- **Description:** Top-level stats for admin dashboard.
- [x] Returns `{ total_vendors, orders_today, revenue_today, active_promotions }`

### TC-39 · Admin List All Vendors
- **URL:** `GET http://localhost:3001/api/admin/vendors`
- **Description:** Admin sees all vendors regardless of status.
- [x] Returns array of all 10 vendors

### TC-40 · Admin Create Vendor
- **URL:** `POST http://localhost:3001/api/admin/vendors`
- **Description:** Admin provisions a new vendor.
- [x] Full vendor body → 201, vendor appears in `GET /admin/vendors`

### TC-41 · Admin Update Vendor
- **URL:** `PUT http://localhost:3001/api/admin/vendors/:id`
- **Description:** Admin edits vendor details.
- [x] `{ name: "Updated Name" }` → 200, name changed in DB

### TC-42 · Admin Suspend Vendor
- **URL:** `PATCH http://localhost:3001/api/admin/vendors/:id/status`
- **Description:** Admin deactivates a vendor booth.
- [x] `{ is_active: false }` → 200, vendor suspended

### TC-43 · Suspended Vendor Hidden From Menu
- **URL:** `GET http://localhost:3001/api/vendors`
- **Description:** Suspended vendors not shown to customers.
- [x] Suspended vendor does NOT appear in public vendor list

### TC-44 · Admin List All Orders
- **URL:** `GET http://localhost:3001/api/admin/orders`
- **Description:** Paginated order history across all vendors.
- [x] Returns `{ orders, total, page, pages }`

### TC-45 · Admin Filter Orders by Status
- **URL:** `GET http://localhost:3001/api/admin/orders?status=pending`
- **Description:** Status filter scopes results correctly.
- [x] All returned orders have `status: "pending"`

### TC-46 · Admin Cancel Order
- **URL:** `POST http://localhost:3001/api/admin/orders/:orderId/cancel`
- **Description:** Admin forcibly cancels any order.
- [x] `{ reason: "test" }` → order status becomes `"cancelled"`

### TC-47 · Admin Export Orders CSV
- **URL:** `GET http://localhost:3001/api/admin/finance/export?from=2024-01-01&to=2026-12-31`
- **Description:** Orders exported as CSV for accounting.
- [x] 200 with `Content-Type: text/csv`

### TC-48 · Admin Daily Summary
- **URL:** `GET http://localhost:3001/api/admin/finance/daily-summary?date=<today>`
- **Description:** Per-day financial summary for finance page.
- [x] Returns `{ date, total_orders, total_revenue, tax_collected }`

### TC-49 · Admin Revenue by Vendor
- **URL:** `GET http://localhost:3001/api/admin/finance/by-vendor`
- **Description:** Revenue breakdown per vendor for leaderboard.
- [x] Returns array with `vendor_name, revenue, order_count`

### TC-50 · Create Promotion
- **URL:** `POST http://localhost:3001/api/admin/promotions`
- **Description:** Admin creates a discount promo code.
- [x] `{ code: "TEST10", type: "percentage", value: 10, valid_from, valid_to }` → 201

### TC-51 · Duplicate Promo Code Rejected
- **URL:** `POST http://localhost:3001/api/admin/promotions`
- **Description:** Promo codes must be unique.
- [x] Same code `"TEST10"` a second time → 409 Conflict

### TC-52 · Validate Promo Code — Public Endpoint
- **URL:** `POST http://localhost:3001/api/promotions/validate`
- **Description:** Customer-facing promo validation returns discount amount.
- [x] `{ code: "TEST10", order_amount: 50 }` → `{ valid: true, discount_amount: 5.00 }`

### TC-53 · Validate Expired Promo
- **URL:** `POST http://localhost:3001/api/promotions/validate`
- **Description:** Expired promos return `valid: false`.
- [x] `{ code: "EXPIRED", order_amount: 50 }` → `{ valid: false }`

### TC-54 · Toggle Promotion Active State
- **URL:** `PATCH http://localhost:3001/api/admin/promotions/:id/toggle`
- **Description:** Admin pauses/resumes a promo without deleting it.
- [x] Flips `is_active` and returns updated promo

### TC-55 · Create Cash Log Entry
- **URL:** `POST http://localhost:3001/api/admin/finance/cash-log`
- **Description:** Cashier records a cash collection.
- [x] `{ order_id, amount, collected_by: "Cashier 1" }` → 201

### TC-56 · Get Cash Log
- **URL:** `GET http://localhost:3001/api/admin/finance/cash-log`
- **Description:** Admin reviews cash collected.
- [x] Returns array of entries with `amount, collected_by, created_at`

### TC-57 · Audit Log Entry Created on Vendor Suspend
- **URL:** `GET http://localhost:3001/api/admin/audit`
- **Description:** Admin actions are logged for accountability.
- [x] After TC-42, audit log contains entry with `action: "vendor.suspend"`

### TC-58 · Audit Log Filterable by Action
- **URL:** `GET http://localhost:3001/api/admin/audit?action=vendor.suspend`
- **Description:** Audit log filter scopes by action type.
- [x] Only suspend entries returned

---

## Phase 3 — Analytics

### TC-59 · Revenue Analytics
- **URL:** `GET http://localhost:3001/api/admin/analytics/revenue?from=2024-01-01&to=2026-12-31`
- **Description:** Time-series revenue data for charts.
- [x] Returns array of `{ date, revenue }` points

### TC-60 · Peak Hours Heatmap
- **URL:** `GET http://localhost:3001/api/admin/analytics/peak-hours`
- **Description:** 7×24 order heatmap for staffing decisions.
- [x] Returns array with `{ day, hour, count }` entries

### TC-61 · Top Items Report
- **URL:** `GET http://localhost:3001/api/admin/analytics/top-items`
- **Description:** Best-selling menu items across all vendors.
- [x] Returns array of `{ item_name, vendor_name, order_count, revenue }`

### TC-62 · By Cuisine Report
- **URL:** `GET http://localhost:3001/api/admin/analytics/by-cuisine`
- **Description:** Revenue grouped by cuisine type.
- [x] Returns array grouped by `cuisine_type`

### TC-63 · Prep Time Report
- **URL:** `GET http://localhost:3001/api/admin/analytics/prep-times`
- **Description:** Average prep time per vendor for SLA monitoring.
- [x] Returns array with `vendor_name, avg_prep_minutes`

---

## Phase 4 — Security & Infrastructure

### TC-64 · Security Headers — X-Frame-Options
- **URL:** `GET http://localhost:3000/`
- **Description:** Prevents clickjacking via iframe embedding.
- [x] Response includes `X-Frame-Options: SAMEORIGIN`

### TC-65 · Security Headers — Content-Security-Policy
- **URL:** `GET http://localhost:3000/`
- **Description:** CSP restricts resource origins.
- [x] Response includes `Content-Security-Policy` with `default-src 'self'`

### TC-66 · Security Headers — HSTS
- **URL:** `GET http://localhost:3000/`
- **Description:** Forces HTTPS connections.
- [x] Response includes `Strict-Transport-Security` with `max-age=63072000`

### TC-67 · Security Headers — X-Content-Type-Options
- **URL:** `GET http://localhost:3000/`
- **Description:** Prevents MIME-type sniffing.
- [x] Response includes `X-Content-Type-Options: nosniff`

### TC-68 · Rate Limit — Auth Endpoint
- **URL:** `POST http://localhost:3001/api/auth/login`
- **Description:** Brute-force protection — 5 attempts/min limit on login.
- [x] 6 rapid requests within 1 minute → 6th returns 429 Too Many Requests

### TC-69 · Rate Limit — General (100/min)
- **URL:** `GET http://localhost:3001/api/health`
- **Description:** General endpoint rate limit set to 100 req/min.
- [ ] 101 rapid requests → 101st returns 429 _(manual only — impractical to automate; confirmed limit set in ThrottlerModule config)_

### TC-70 · PWA Manifest Accessible
- **URL:** `GET http://localhost:3000/manifest.json`
- **Description:** PWA manifest served as JSON with correct display mode.
- [x] 200 with `Content-Type: application/json`, contains `display: "standalone"`

### TC-71 · Service Worker Registered
- **URL:** `http://localhost:3000/`
- **Description:** Service worker active for offline support.
- [ ] Browser DevTools → Application → Service Workers shows `sw.js` registered _(browser/manual only)_

### TC-72 · 404 Page
- **URL:** `http://localhost:3000/nonexistent-route`
- **Description:** Unknown routes show branded 404 page, not blank screen.
- [ ] Browser renders branded "PAGE NOT FOUND" page _(browser/manual only)_

### TC-73 · Error Boundary
- **URL:** `http://localhost:3000/` (any route)
- **Description:** Runtime component errors caught by error boundary, not full crash.
- [ ] Triggering a runtime error shows `error.tsx` boundary UI _(browser/manual only)_

---

## Regression / Edge Cases

### TC-74 · Order With Modifiers
- **URL:** `POST http://localhost:3001/api/orders`
- **Description:** Modifiers stored on order items correctly.
- [x] Items with `modifiers: [{ modifier_id, quantity: 1 }]` → order created, modifiers stored

### TC-75 · Menu Unavailable Item Cannot Be Ordered
- **URL:** `POST http://localhost:3001/api/orders`
- **Description:** Sold-out items rejected at order time.
- [ ] After TC-24 (marking item unavailable), posting that item → 400 _(not automated — item deleted in TC-25 before scenario can run)_

---

## Frontend — Customer Ordering Flow

> Verification method: `[x]` = confirmed via HTTP/SSR · `[ ]` = browser/JS-runtime required (manual)

### FE-01 · Root Redirect
- **URL:** `GET http://localhost:3000/`
- **Description:** Root redirects customers to the ordering entry point.
- [x] Returns 307 redirect to `/order`, which returns 200

### FE-02 · Welcome Page Renders
- **URL:** `http://localhost:3000/order`
- **Description:** Welcome screen with food court branding and start button.
- [ ] Shows "FOOD VILLAGE" heading, animated logo, "START ORDERING" button _(browser/manual)_

### FE-03 · Session Created on Start
- **URL:** `http://localhost:3000/order` → `POST http://localhost:3001/api/sessions`
- **Description:** Tapping "START ORDERING" creates a backend session and navigates to vendors.
- [ ] `POST /api/sessions` called; `session_id` stored in Zustand cart store; navigates to `/order/vendors` _(browser/manual)_

### FE-04 · Vendor List Loads
- **URL:** `http://localhost:3000/order/vendors` → `GET http://localhost:3001/api/vendors?status=active`
- **Description:** Vendor grid renders all active booths with key info.
- [ ] Vendor cards show name, cuisine type, avg prep time, OPEN/CLOSED badge _(browser/manual)_

### FE-05 · Vendor Search Filter
- **URL:** `http://localhost:3000/order/vendors`
- **Description:** Client-side text filter, no extra API calls.
- [ ] Typing in search input filters cards by vendor name in real-time _(browser/manual)_

### FE-06 · Cuisine Filter Chips
- **URL:** `http://localhost:3000/order/vendors`
- **Description:** Cuisine chip filters vendor grid; "All" resets.
- [ ] Clicking "Asian" shows only Asian vendors; clicking "All" restores full list _(browser/manual)_

### FE-07 · Navigate to Vendor Menu
- **URL:** `http://localhost:3000/order/vendors/:vendorId/menu`
- **Description:** Vendor card click navigates to that vendor's menu page.
- [ ] Clicking a vendor card navigates to `/order/vendors/:vendorId/menu` _(browser/manual)_

### FE-08 · Vendor Menu Page — Hero + Tabs
- **URL:** `http://localhost:3000/order/vendors/:vendorId/menu` → `GET http://localhost:3001/api/vendors/:vendorId/menu`
- **Description:** Menu page fetches `{ vendor, categories: [{ category, items }] }` structure from API. Fixed 2026-06-02: was reading `cat.id/cat.name/cat.menu_items` (wrong); now reads `cat.category.id/cat.category.name/cat.items`.
- [ ] Hero shows vendor name and cuisine; sticky tab bar lists category names; clicking tab scrolls to section _(browser/manual)_

### FE-09 · Unavailable Items Show SOLD OUT
- **URL:** `http://localhost:3000/order/vendors/:vendorId/menu`
- **Description:** Items with `is_available: false` show SOLD OUT overlay and block interaction.
- [ ] SOLD OUT badge visible; `cursor-not-allowed`; clicking does nothing _(browser/manual)_

### FE-10 · Item Detail Modal Opens
- **URL:** `http://localhost:3000/order/vendors/:vendorId/menu` → `GET http://localhost:3001/api/menu-items/:itemId`
- **Description:** Clicking an item fetches its full detail (including modifier groups) then opens modal. Fixed 2026-06-02: was passing list item directly to modal; now calls `GET /api/menu-items/:id` and maps `price_adjustment` → `price_delta`.
- [ ] Modal shows item name, description, price; modifier groups render if present _(browser/manual)_

### FE-11 · Modal — Modifiers + Special Instructions
- **URL:** `http://localhost:3000/order/vendors/:vendorId/menu`
- **Description:** Modifier selection enforces min/max rules; textarea limited to 200 chars.
- [ ] Required badge on groups where `min_selections > 0`; single-select groups allow one choice; instructions capped at 200 chars _(browser/manual)_

### FE-12 · Add to Cart Toast
- **URL:** `http://localhost:3000/order/vendors/:vendorId/menu`
- **Description:** Confirms item added to Zustand store with visual feedback.
- [ ] "ADD TO CART" adds item, shows success toast with item name, closes modal _(browser/manual)_

### FE-13 · Cart Groups Items by Vendor
- **URL:** `http://localhost:3000/order/cart`
- **Description:** Multi-vendor orders shown with vendor color accent grouping.
- [ ] Items grouped by vendor with vendor color, item count per group _(browser/manual)_

### FE-14 · Cart — Tax and Total
- **URL:** `http://localhost:3000/order/cart`
- **Description:** Oklahoma 8.25% tax displayed in cart summary.
- [ ] Shows subtotal, tax line (8.25%), total = subtotal × 1.0825 _(browser/manual)_

### FE-15 · Cart — Quantity Controls
- **URL:** `http://localhost:3000/order/cart`
- **Description:** In-cart quantity adjustment updates line price in real-time.
- [ ] `+`/`−` buttons update quantity and recalculate line price and order total _(browser/manual)_

### FE-16 · Cart — Remove Item
- **URL:** `http://localhost:3000/order/cart`
- **Description:** Remove button deletes item with exit animation.
- [ ] "Remove" deletes item with animation; total recalculates _(browser/manual)_

### FE-17 · Empty Cart State
- **URL:** `http://localhost:3000/order/cart`
- **Description:** Empty cart shows a helpful redirect, not a broken layout.
- [ ] Empty cart shows empty-state illustration and "Browse Vendors" button _(browser/manual)_

### FE-18 · Place Order Flow
- **URL:** `http://localhost:3000/order/cart` → `POST http://localhost:3001/api/orders`
- **Description:** Checkout submits all cart items, clears store, navigates to confirmation.
- [ ] "PLACE ORDER" → 201; cart cleared; navigates to `/order/confirmation/:orderId` _(browser/manual)_

### FE-19 · Order Confirmation — Token + Status
- **URL:** `http://localhost:3000/order/confirmation/:orderId` → `GET http://localhost:3001/api/orders/:orderId/status`
- **Description:** Confirmation page polls for status updates every 5 seconds.
- [ ] Shows token number (e.g. "#001"), per-vendor status rows; polls every 5 s _(browser/manual)_

### FE-20 · Confirmation — Inactivity Redirect
- **URL:** `http://localhost:3000/order/confirmation/:orderId`
- **Description:** Kiosk self-reset after idle period.
- [ ] 60 s of no interaction → auto-redirect to `/order` _(browser/manual)_

---

## Frontend — Display Board

### FE-21 · Display Board Loads
- **URL:** `GET http://localhost:3000/display`
- **Description:** Display board page returns 200 (SSR).
- [x] Returns HTTP 200

### FE-22 · Display Board Layout
- **URL:** `http://localhost:3000/display`
- **Description:** Two-column status board with live clock and footer ticker.
- [ ] "FOOD VILLAGE" header, live clock, "PREPARING" and "READY TO COLLECT" columns, scrolling footer _(browser/manual)_

### FE-23 · Display Board — No Orders State
- **URL:** `http://localhost:3000/display` → `GET http://localhost:3001/api/display/board`
- **Description:** Empty queue handled gracefully.
- [ ] Empty data → "NO ORDERS IN PROGRESS" placeholder _(browser/manual)_

### FE-24 · Display Board — Offline Banner
- **URL:** `http://localhost:3000/display`
- **Description:** Network failure shows a reconnecting banner rather than silent staleness.
- [ ] API failure → red "Updates paused — reconnecting…" banner; disappears on recovery _(browser/manual)_

### FE-25 · Display Board — Token Cards
- **URL:** `http://localhost:3000/display`
- **Description:** Tokens animate into correct column based on order status.
- [ ] Preparing → amber column; ready → green column; animate in/out with scale motion _(browser/manual)_

---

## Frontend — Vendor Portal

### FE-26 · Vendor Login Page
- **URL:** `GET http://localhost:3000/vendor/login`
- **Description:** Vendor login page returns 200 (SSR).
- [x] Returns HTTP 200

### FE-27 · Vendor Login — Two Tabs
- **URL:** `http://localhost:3000/vendor/login`
- **Description:** Email login and PIN login tabs for different staff types.
- [ ] "Email Login" and "PIN Login" tabs present; switching toggles the form _(browser/manual)_

### FE-28 · Vendor Login — Wrong Credentials Toast
- **URL:** `http://localhost:3000/vendor/login` → `POST http://localhost:3001/api/auth/login`
- **Description:** Failed login shows error feedback without crashing.
- [ ] Incorrect email/password shows error toast; stays on login page _(browser/manual)_

### FE-29 · Vendor Login — PIN Pad
- **URL:** `http://localhost:3000/vendor/login`
- **Description:** Touch-friendly PIN pad for kitchen staff.
- [ ] PIN tab shows vendor ID input, 4-dot indicator, 12-key pad; ⌫ removes last digit; ↵ submits _(browser/manual)_

### FE-30 · Vendor Auth Guard
- **URL:** `http://localhost:3000/vendor/dashboard`
- **Description:** Unauthenticated access to vendor routes redirects to login.
- [ ] Direct navigation without token → redirect to `/vendor/login` _(browser/manual — client-side JS guard)_

### FE-31 · Vendor Sidebar Navigation
- **URL:** `http://localhost:3000/vendor/*`
- **Description:** Sidebar links present after login with active state.
- [ ] Sidebar shows Kitchen, Dashboard, Menu, Orders, Settings; active link highlighted _(browser/manual)_

### FE-32 · Vendor Dashboard Stats
- **URL:** `http://localhost:3000/vendor/dashboard` → `GET http://localhost:3001/api/vendor/dashboard`
- **Description:** Four stat cards show real-time vendor metrics.
- [ ] Orders Today, Revenue Today, Active Queue, Avg Prep Time cards visible _(browser/manual)_

### FE-33 · Vendor Dashboard — Top Items + Recent Orders
- **URL:** `http://localhost:3000/vendor/dashboard`
- **Description:** Dashboard charts and recent order list.
- [ ] Animated bar chart for top items; recent orders list with token, amount, time, status badge _(browser/manual)_

### FE-34 · KDS — Three-Column Kanban
- **URL:** `http://localhost:3000/vendor/kitchen`
- **Description:** Kitchen Display System Kanban with NEW/PREPARING/READY columns.
- [ ] Three columns with count badges; order cards show token, table, prep timer _(browser/manual)_

### FE-35 · KDS — Prep Timer Color
- **URL:** `http://localhost:3000/vendor/kitchen`
- **Description:** Visual urgency indicator for kitchen staff.
- [ ] Timer: grey < 5 min, amber 5–10 min, red > 10 min _(browser/manual)_

### FE-36 · KDS — Advance Order Status
- **URL:** `http://localhost:3000/vendor/kitchen` → `PATCH http://localhost:3001/api/kds/orders/:id/advance`
- **Description:** One-button status advance in KDS.
- [ ] "ACCEPT" → accepted; "PREPARING" → preparing; "READY" → ready _(browser/manual)_

### FE-37 · KDS — Reject with Reason Modal
- **URL:** `http://localhost:3000/vendor/kitchen`
- **Description:** Rejection workflow with preset reasons.
- [ ] ✗ button opens reject modal with 4 preset reasons; confirm calls API and removes card _(browser/manual)_

### FE-38 · KDS — Mute/Unmute Chime
- **URL:** `http://localhost:3000/vendor/kitchen`
- **Description:** Audio chime toggle for kitchen environments.
- [ ] 🔔 mutes chime (switches to 🔇); state persists across re-renders _(browser/manual)_

### FE-39 · KDS — Fullscreen Toggle
- **URL:** `http://localhost:3000/vendor/kitchen`
- **Description:** Full-screen mode for dedicated kitchen display.
- [ ] ⛶ requests fullscreen; icon → ⊡; clicking again exits _(browser/manual)_

### FE-40 · Vendor Menu Page
- **URL:** `GET http://localhost:3000/vendor/menu`
- **Description:** Vendor menu management page returns 200 (SSR).
- [x] Returns HTTP 200

### FE-41 · Vendor Orders Page
- **URL:** `GET http://localhost:3000/vendor/orders`
- **Description:** Vendor orders history page returns 200 (SSR).
- [x] Returns HTTP 200

### FE-42 · Vendor Settings Page
- **URL:** `GET http://localhost:3000/vendor/settings`
- **Description:** Vendor settings page returns 200 (SSR).
- [x] Returns HTTP 200

---

## Frontend — Admin Portal

### FE-43 · Admin Login Page
- **URL:** `GET http://localhost:3000/admin/login`
- **Description:** Admin login page returns 200 (SSR).
- [x] Returns HTTP 200

### FE-44 · Admin Login — Non-Admin Role Blocked
- **URL:** `http://localhost:3000/admin/login` → `POST http://localhost:3001/api/auth/login`
- **Description:** Vendor credentials rejected from admin portal with inline error.
- [ ] Vendor-role login → "Access denied — admin account required" inline error _(browser/manual)_

### FE-45 · Admin Auth Guard
- **URL:** `http://localhost:3000/admin/dashboard`
- **Description:** Unauthenticated access to admin routes redirects to login.
- [ ] Direct navigation without token → redirect to `/admin/login` _(browser/manual — client-side JS guard)_

### FE-46 · Admin Dashboard
- **URL:** `GET http://localhost:3000/admin/dashboard`
- **Description:** Admin dashboard page returns 200 (SSR).
- [x] Returns HTTP 200

### FE-47 · Admin Dashboard — Stats + Charts
- **URL:** `http://localhost:3000/admin/dashboard` → `GET http://localhost:3001/api/admin/overview`
- **Description:** Dashboard renders stat widgets and revenue chart.
- [ ] 4 stat cards, revenue sparkline (last 30 days), vendor leaderboard, live orders table _(browser/manual)_

### FE-48 · Admin Orders Page
- **URL:** `GET http://localhost:3000/admin/orders`
- **Description:** Admin orders management page returns 200 (SSR).
- [x] Returns HTTP 200

### FE-49 · Admin Vendors Page
- **URL:** `GET http://localhost:3000/admin/vendors`
- **Description:** Admin vendors management page returns 200 (SSR).
- [x] Returns HTTP 200

### FE-50 · Admin Finance Page
- **URL:** `GET http://localhost:3000/admin/finance`
- **Description:** Admin finance page returns 200 (SSR).
- [x] Returns HTTP 200

### FE-51 · Admin Analytics Page
- **URL:** `GET http://localhost:3000/admin/analytics`
- **Description:** Admin analytics page returns 200 (SSR).
- [x] Returns HTTP 200

### FE-52 · Admin Promotions Page
- **URL:** `GET http://localhost:3000/admin/promotions`
- **Description:** Admin promotions management page returns 200 (SSR).
- [x] Returns HTTP 200

### FE-53 · Admin Audit Log Page
- **URL:** `GET http://localhost:3000/admin/audit`
- **Description:** Admin audit log page returns 200 (SSR).
- [x] Returns HTTP 200

---

## Frontend — Infrastructure & PWA

### FE-54 · 404 Page — Branded
- **URL:** `GET http://localhost:3000/nonexistent-route`
- **Description:** Unknown routes show branded 404 page in SSR output.
- [x] Returns HTTP 404 with "PAGE NOT FOUND" heading and "BACK TO ORDERING" link (confirmed in SSR HTML)

### FE-55 · 404 Page — Visual
- **URL:** `http://localhost:3000/nonexistent-route`
- **Description:** 404 page renders with brand styling.
- [ ] 120px "404" in orange tint, "PAGE NOT FOUND" subheading, orange CTA button _(browser/manual)_

### FE-56 · Error Boundary Component Exists
- **URL:** (file: `app/error.tsx`)
- **Description:** Next.js segment-level error boundary in place.
- [x] `app/error.tsx` present and registered in layout error boundary chain

### FE-57 · Global Error Boundary Exists
- **URL:** (file: `app/global-error.tsx`)
- **Description:** Root-level error fallback for catastrophic failures.
- [x] `app/global-error.tsx` present and registered as global error handler

### FE-58 · Service Worker Script in HTML
- **URL:** `GET http://localhost:3000/`
- **Description:** Root layout injects SW registration script.
- [x] SSR output includes `navigator.serviceWorker.register('/sw.js')`

### FE-59 · Service Worker File Served
- **URL:** `GET http://localhost:3000/sw.js`
- **Description:** Service worker JavaScript file is publicly accessible.
- [x] Returns HTTP 200

### FE-60 · PWA Manifest Fields
- **URL:** `GET http://localhost:3000/manifest.json`
- **Description:** Manifest has required fields for PWA install prompt.
- [x] Returns `name: "Food Village POS"`, `start_url: "/order"`, `display: "standalone"`

### FE-61 · Error Boundary — Visual Trigger
- **URL:** `http://localhost:3000/` (any route)
- **Description:** Error boundary renders retry UI rather than blank page.
- [ ] Runtime component error → `error.tsx` boundary UI with retry option, not blank page _(browser/manual)_

### FE-62 · Service Worker — Registration in DevTools
- **URL:** `http://localhost:3000/`
- **Description:** Service worker actively registered and running.
- [ ] DevTools → Application → Service Workers shows `sw.js` active for `localhost:3000` _(browser/manual)_

---

## Summary

| Phase | Tests | Status |
|---|---|---|
| Phase 1 — Public Menu & Ordering (API) | TC-01 to TC-15 (15 tests) | 15 / 15 passed |
| Phase 2 — Vendor Portal (API) | TC-16 to TC-35 (20 tests) | 20 / 20 passed |
| Phase 3 — Admin Portal (API) | TC-36 to TC-63 (28 tests) | 28 / 28 passed |
| Phase 4 — Security & Infrastructure (API) | TC-64 to TC-73 (10 tests) | 6 / 10 passed (TC-69, TC-71–73 manual/browser-only) |
| Regression (API) | TC-74 to TC-75 (2 tests) | 1 / 2 passed (TC-75 not automated) |
| **API Total** | **75 tests** | **70 / 75 passed · 118/118 Newman assertions ✓** |
| FE — Customer Ordering Flow | FE-01 to FE-20 (20 tests) | 1 / 20 passed (FE-01 via HTTP; FE-02–20 browser/manual) |
| FE — Display Board | FE-21 to FE-25 (5 tests) | 1 / 5 passed (FE-21 via HTTP; FE-22–25 browser/manual) |
| FE — Vendor Portal | FE-26 to FE-42 (17 tests) | 5 / 17 passed (FE-26, FE-40–42 via HTTP; rest browser/manual) |
| FE — Admin Portal | FE-43 to FE-53 (11 tests) | 9 / 11 passed (FE-43, FE-46–53 via HTTP; FE-44–45 browser/manual) |
| FE — Infrastructure & PWA | FE-54 to FE-62 (9 tests) | 7 / 9 passed (FE-54–60 via HTTP; FE-61–62 browser/manual) |
| **Frontend Total** | **62 tests** | **23 / 62 passed via HTTP · 39 browser/manual pending** |
| **Grand Total** | **137 tests** | **93 / 137 confirmed · 44 browser/manual pending** |
