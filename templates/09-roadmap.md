# Food Village POS — 2-Phase Development Roadmap

> **Active scope:** Phase 1 + Phase 2 (2-day sprint, solo dev)
> **Stack:** Next.js App Router · NestJS · PostgreSQL / Supabase · Prisma · Zustand
> **Payment model:** Cash-only (95-98%). No Stripe. After order → token number + Lottie animation.
> **Methodology:** API contract doc → NestJS backend → Frontend component doc → Next.js frontend

---

## Phase Overview

```
Phase 1: Foundation & Core Ordering       (Day 1 AM–PM)   ← Customer orders from 1 vendor, KDS receives
Phase 2: Multi-Vendor & Kitchen System    (Day 2 AM–PM)   ← Multi-vendor cart, full KDS, display board
Phase 3: Admin, Analytics & Promotions   (Future)         ← Deferred
Phase 4: Polish, Offline & Production    (Future)         ← Deferred
```

---

## Phase 1: Foundation & Core Ordering (Day 1)

**Goal:** Customer browses one vendor's menu on the web, adds items with modifiers to cart, places order. Vendor sees order on KDS. No payment — after order placement, show token number + animated confirmation. 

**Milestone:** End-to-end ordering demo with 1 vendor, KDS receiving orders live.

### Infrastructure & Setup

- [ ] **1.1** Initialize Next.js project (App Router, TypeScript, Tailwind CSS, ESLint/Prettier)
- [ ] **1.2** Initialize NestJS backend (modular structure: Auth, Menu, Order, KDS, Vendor, Sessions modules)
- [ ] **1.3** Set up Supabase project: PostgreSQL, Auth, Realtime, Storage. Configure `.env` with keys
- [ ] **1.4** Set up Prisma ORM: schema definition, client generation, seed script with 10 sample vendors + menus
- [ ] **1.5** Configure Docker Compose for local PostgreSQL (fallback), environment variable management
- [ ] **1.6** Set up CI/CD: GitHub Actions for lint + build on every PR

### Authentication & User Management

- [ ] **1.7** Integrate Supabase Auth: email/password registration + JWT issuance
- [ ] **1.8** Implement NestJS JWT validation guard: verify Supabase tokens, extract user claims (role, vendorId)
- [ ] **1.9** Create roles enum + RBAC guard: `super_admin`, `admin`, `vendor_owner`, `vendor_kitchen`, `vendor_cashier`, `waiter`
- [ ] **1.10** Build vendor login page with PIN-based quick login for kitchen staff (email + 4-digit PIN)
- [ ] **1.11** Implement ordering session: create session tied to table + waiter, session expiry logic

### Database Schema (Core)

- [ ] **1.12** Create core tables: `food_village`, `vendors`, `users`, `tables`, `sessions` with constraints, indexes, RLS
- [ ] **1.13** Create menu tables: `menu_categories`, `menu_items`, `modifier_groups`, `modifiers` with vendor_id isolation
- [ ] **1.14** Create order tables: `orders`, `order_items`, `order_item_modifiers`, `order_status_history` with state machine enum
- [ ] **1.15** Implement DB functions: `updated_at` auto-trigger, `next_token_number()` daily sequence generator
- [ ] **1.16** Write seed script: 10 vendors with categories, menu items, modifier groups, 5 tables each

### Customer Ordering (Browser)

- [ ] **1.17** Build Customer Layout: dark-theme branded header, persistent cart summary bottom bar (glassmorphism)
- [ ] **1.18** Build Welcome screen: food village name, "Start Ordering" CTA, table assignment from URL params
- [ ] **1.19** Build Vendor Menu screen: category tabs (sticky), item grid with images, prices, dietary badges, sold-out overlay
- [ ] **1.20** Build Item Detail / Modifier Modal: large image, modifier groups (radio/checkbox), quantity stepper, live price, "Add to Cart"
- [ ] **1.21** Implement Zustand cart store: addItem, updateQuantity, removeItem, clearCart, subtotal/tax/total, itemsByVendor grouping
- [ ] **1.22** Build Cart screen: items grouped by vendor, quantity controls, remove, subtotal/tax/total, "Place Order" CTA
- [ ] **1.23** Build Order Confirmation: large token number (Bebas Neue 120px), Lottie "cooking" animation, catchy message, per-vendor status

### Menu API Endpoints

- [ ] **1.24** `GET /api/vendors` — list active vendors (public, cached)
- [ ] **1.25** `GET /api/vendors/:id/menu` — full menu with categories, items, modifiers (public)
- [ ] **1.26** `GET /api/menu-items/:id` — item detail with modifier groups (public)
- [ ] **1.27** `POST /api/sessions` — create ordering session (table + waiter)
- [ ] **1.28** `POST /api/orders` — create order from cart, generate token number, route items per vendor

### Basic KDS (Vendor)

- [ ] **1.29** Build basic KDS: 3-column Kanban (New | Preparing | Ready), order cards with token, table, item, modifiers
- [ ] **1.30** KDS API: `GET /api/kds/orders`, `PATCH /api/kds/items/:id/accept`, `PATCH /api/kds/items/:id/preparing`, `PATCH /api/kds/items/:id/ready`, `PATCH /api/kds/items/:id/reject`

---

## Phase 2: Multi-Vendor & Kitchen System (Day 2)

**Goal:** Customer orders from multiple vendors in one cart. Orders route to correct KDS screens in real-time via Supabase Realtime. Vendors manage menus. Display board shows token status on TV.

**Milestone:** Full multi-vendor loop with real-time KDS, display board, and vendor management.

### Real-Time System

- [ ] **2.1** Configure Supabase Realtime channels: `orders:vendor:{vendorId}` (KDS), `orders:customer:{orderId}` (tracking), `orders:display` (TV board)
- [ ] **2.2** KDS real-time subscription: new orders appear instantly with audio chime (Web Audio API) + pulse animation
- [ ] **2.3** Customer order status real-time tracking: per-vendor item status on confirmation screen
- [ ] **2.4** Reconnection/fallback: detect WebSocket disconnect, show warning banner, fall back to 10s polling, auto-recover

### Multi-Vendor Cart

- [ ] **2.5** Update cart for multi-vendor: group by vendor with booth color headers, validate availability at checkout
- [ ] **2.6** Real-time menu availability sync: item sold-out by vendor → customer app updates instantly
- [ ] **2.7** Sold-out edge case: show badge on affected cart items, block checkout until removed
- [ ] **2.8** Vendor browsing screen: horizontal card grid with vendor logo, name, cuisine, open/offline badge, avg prep time

### Kitchen Display System (Full)

- [ ] **2.9** Full KDS: 3-column Kanban (New=amber, Preparing=purple, Ready=green) with smooth transition animations
- [ ] **2.10** KDS order card: vendor-color left border, 64px token, table, item name, modifiers (ADD=green, REMOVE=red), special instructions (yellow banner), live prep timer
- [ ] **2.11** KDS actions: Accept → Preparing → Ready → Complete with optimistic UI + server confirmation
- [ ] **2.12** Reject flow: reason selector ("Out of stock", "Equipment issue", "Custom reason"), order item status change
- [ ] **2.13** KDS timer urgency: neutral < estimate, yellow at 1.5×, red at 2× with border color change
- [ ] **2.14** KDS audio: configurable new-order chime, volume control, mute toggle, visual fallback
- [ ] **2.15** KDS fullscreen mode: hide sidebar, maximize kitchen view, persist preference

### Order State Machine

- [ ] **2.16** Full order state machine in NestJS: validate transitions (pending → accepted → preparing → ready → completed), reject invalid
- [ ] **2.17** Aggregate order status: when all order_items change status → update parent order status
- [ ] **2.18** Order status history logging: every transition in `order_status_history` with actor + timestamp + reason

### Vendor Menu Management

- [ ] **2.19** Vendor menu management page: list items by category, availability toggle (instant sold-out), manual sort
- [ ] **2.20** Create/edit menu item form: name, description, price, category, prep time, image upload, dietary tags, allergens
- [ ] **2.21** Modifier group management: create groups, add options with price adjustments, min/max, required flag
- [ ] **2.22** Image upload pipeline: client-side resize to max 1200px, upload to Supabase Storage, generate variants

### Display Board (TV Screen)

- [ ] **2.23** Display board layout: dark bg, fullscreen, vendor sections with booth color headers + logos
- [ ] **2.24** Display board data: Supabase Realtime on order_items with status `preparing` or `ready`, grouped by vendor
- [ ] **2.25** Token display: "Preparing" tokens white, "Ready" tokens green + pulse, auto-remove completed tokens after 30s
- [ ] **2.26** Display board resilience: auto-reconnect, "Updates paused" overlay, auto-reload every 6 hours

### Vendor Dashboard (Basic)

- [ ] **2.27** Vendor dashboard home: today's order count, revenue, active queue, avg prep time widget
- [ ] **2.28** Vendor orders history: filterable (date range, status), searchable by token, sortable, paginated
- [ ] **2.29** Vendor API endpoints: `GET /vendor/dashboard`, `GET /vendor/orders`, `GET/POST/PUT/DELETE /vendor/menu-items`
- [ ] **2.30** Vendor settings page: booth profile (name, logo, cuisine), operating hours, default prep time, notification prefs

---

## Deferred Phases

### Phase 3: Admin Dashboard & Analytics (Future)
- Admin overview, order management, vendor management, finance dashboard (cash tracking), analytics, promotion engine, audit log

### Phase 4: Polish, Offline & Production (Future)
- PWA/offline mode, performance optimization, accessibility (WCAG AA), security hardening, load testing, monitoring, documentation

### Phase 5: Payment (Future — if needed)
- If cash is no longer sufficient: Stripe Connect, terminal, payment splitting, ledger system
- Currently: cash collected by waiter, not tracked in system

---

## Task Status Legend

```
- [ ] Not started
- [x] Completed
- [~] In progress
- [!] Blocked (add reason)
```

## Design Reference

- **Colors:** #0d0d0d bg, #1a1a1a cards, #ff5c00 orange accent, #ffd000 yellow highlight, #f5f5f0 text
- **Fonts:** Bebas Neue (headings/tokens), DM Mono (labels/tags), DM Sans (body)
- **Style:** Dark theme, glassmorphism modals, geometric decorative elements, high contrast
- **Animations:** Lottie for order confirmation, CSS transitions for KDS state changes, pulse for ready tokens
- **Touch:** Min 48px touch targets, no hover-dependent interactions

## Sprint Notes

- API contract doc first → NestJS backend → Frontend component doc → Next.js frontend
- Each API endpoint needs: component | method | endpoint | DTO name | request | response | description
- Supabase Realtime handles all live updates (no custom WebSocket server needed)
- No payment processing in any phase of current scope
