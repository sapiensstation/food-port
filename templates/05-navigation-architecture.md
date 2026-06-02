# Food Village POS — Navigation Architecture

> **Router:** Next.js App Router (app directory)
> **Auth:** Supabase Auth + NestJS JWT validation
> **Strategy:** Role-based route groups with middleware-enforced access control
> **Key principle:** Three separate app experiences (customer, vendor, admin) served from one Next.js app via route groups

---

## Table of Contents

1. [Route Structure Overview](#1-route-structure-overview)
2. [App Directory Layout](#2-app-directory-layout)
3. [Middleware & Route Protection](#3-middleware--route-protection)
4. [Customer Navigation Flow](#4-customer-navigation-flow)
5. [Vendor Navigation Flow](#5-vendor-navigation-flow)
6. [Admin Navigation Flow](#6-admin-navigation-flow)
7. [Display Board Route](#7-display-board-route)
8. [Role-Based Access Matrix](#8-role-based-access-matrix)
9. [Deep Linking & QR Strategy](#9-deep-linking--qr-strategy)
10. [Navigation State Management](#10-navigation-state-management)
11. [Breadcrumb System](#11-breadcrumb-system)
12. [URL Design Principles](#12-url-design-principles)

---

## 1. Route Structure Overview

```
/                           → Marketing / landing page
/order                      → Customer: welcome + table assignment
/order/vendors              → Customer: browse all booths
/order/vendors/[vendorId]   → Customer: vendor menu
/order/cart                 → Customer: unified cart
/order/payment/[orderId]    → Customer: payment
/order/status/[orderId]     → Customer: order confirmation + tracking

/vendor                     → Vendor: login
/vendor/dashboard           → Vendor: home
/vendor/kitchen             → Vendor: KDS screen
/vendor/menu                → Vendor: menu management
/vendor/orders              → Vendor: order history
/vendor/reports             → Vendor: analytics
/vendor/earnings            → Vendor: wallet + payouts
/vendor/settings            → Vendor: booth settings
/vendor/staff               → Vendor: staff management

/admin                      → Admin: login
/admin/dashboard            → Admin: global overview
/admin/orders               → Admin: all orders
/admin/orders/[orderId]     → Admin: order detail
/admin/vendors              → Admin: vendor management
/admin/vendors/[vendorId]   → Admin: vendor detail
/admin/finance              → Admin: revenue + payouts
/admin/promotions           → Admin: promotion manager
/admin/menu-approvals       → Admin: pending menu changes
/admin/analytics            → Admin: advanced analytics
/admin/users                → Admin: user + role management
/admin/audit                → Admin: audit log
/admin/settings             → Admin: global config

/display                    → Display board: TV screen (public)
/display/[vendorId]         → Display board: single vendor view
```

---

## 2. App Directory Layout

```
app/
├── (marketing)/
│   ├── page.tsx                           # Landing page
│   └── layout.tsx                         # Marketing layout
│
├── (customer)/
│   ├── layout.tsx                         # CustomerLayout: branded header + cart bar
│   ├── order/
│   │   ├── page.tsx                       # Welcome / table assignment
│   │   ├── vendors/
│   │   │   ├── page.tsx                   # Vendor browsing grid
│   │   │   └── [vendorId]/
│   │   │       └── page.tsx               # Vendor menu
│   │   ├── cart/
│   │   │   └── page.tsx                   # Cart view
│   │   ├── payment/
│   │   │   └── [orderId]/
│   │   │       └── page.tsx               # Payment screen
│   │   └── status/
│   │       └── [orderId]/
│   │           └── page.tsx               # Confirmation + live tracking
│
├── (vendor)/
│   ├── layout.tsx                         # VendorLayout: sidebar + topbar
│   ├── vendor/
│   │   ├── page.tsx                       # Redirects to /vendor/dashboard
│   │   ├── login/
│   │   │   └── page.tsx                   # Vendor login
│   │   ├── dashboard/
│   │   │   └── page.tsx                   # Vendor home
│   │   ├── kitchen/
│   │   │   └── page.tsx                   # KDS (full-screen mode available)
│   │   ├── menu/
│   │   │   ├── page.tsx                   # Menu item list
│   │   │   ├── new/
│   │   │   │   └── page.tsx               # Create menu item
│   │   │   └── [itemId]/
│   │   │       └── page.tsx               # Edit menu item
│   │   ├── orders/
│   │   │   ├── page.tsx                   # Order history
│   │   │   └── [orderId]/
│   │   │       └── page.tsx               # Order detail
│   │   ├── reports/
│   │   │   └── page.tsx                   # Sales reports
│   │   ├── earnings/
│   │   │   └── page.tsx                   # Wallet + payouts
│   │   ├── staff/
│   │   │   └── page.tsx                   # Staff management
│   │   └── settings/
│   │       └── page.tsx                   # Vendor settings
│
├── (admin)/
│   ├── layout.tsx                         # AdminLayout: sidebar + topbar
│   ├── admin/
│   │   ├── page.tsx                       # Redirects to /admin/dashboard
│   │   ├── login/
│   │   │   └── page.tsx                   # Admin login
│   │   ├── dashboard/
│   │   │   └── page.tsx                   # Global overview
│   │   ├── orders/
│   │   │   ├── page.tsx                   # All orders
│   │   │   └── [orderId]/
│   │   │       └── page.tsx               # Order detail
│   │   ├── vendors/
│   │   │   ├── page.tsx                   # Vendor list
│   │   │   ├── new/
│   │   │   │   └── page.tsx               # Onboard vendor
│   │   │   └── [vendorId]/
│   │   │       ├── page.tsx               # Vendor overview
│   │   │       ├── menu/
│   │   │       │   └── page.tsx           # Vendor's menu (admin view)
│   │   │       ├── financials/
│   │   │       │   └── page.tsx           # Vendor financial detail
│   │   │       └── orders/
│   │   │           └── page.tsx           # Vendor's orders
│   │   ├── finance/
│   │   │   ├── page.tsx                   # Finance overview
│   │   │   ├── commissions/
│   │   │   │   └── page.tsx               # Commission report
│   │   │   ├── payouts/
│   │   │   │   └── page.tsx               # Payout history
│   │   │   └── reconciliation/
│   │   │       └── page.tsx               # Reconciliation
│   │   ├── promotions/
│   │   │   ├── page.tsx                   # Promotion list
│   │   │   ├── new/
│   │   │   │   └── page.tsx               # Create promotion
│   │   │   └── [promoId]/
│   │   │       └── page.tsx               # Edit promotion
│   │   ├── menu-approvals/
│   │   │   └── page.tsx                   # Approval queue
│   │   ├── analytics/
│   │   │   └── page.tsx                   # Advanced analytics
│   │   ├── users/
│   │   │   ├── page.tsx                   # User list
│   │   │   └── [userId]/
│   │   │       └── page.tsx               # User detail
│   │   ├── audit/
│   │   │   └── page.tsx                   # Audit log
│   │   └── settings/
│   │       └── page.tsx                   # Global settings
│
├── (display)/
│   ├── layout.tsx                         # DisplayBoardLayout: fullscreen, dark
│   ├── display/
│   │   ├── page.tsx                       # All-vendor display board
│   │   └── [vendorId]/
│   │       └── page.tsx                   # Single-vendor display
│
├── api/                                   # Next.js API routes (proxy to NestJS or lightweight endpoints)
│   └── health/
│       └── route.ts                       # Health check
│
├── layout.tsx                             # Root layout: providers, fonts, metadata
├── not-found.tsx                          # 404 page
├── error.tsx                              # Global error boundary
└── loading.tsx                            # Global loading state
```

---

## 3. Middleware & Route Protection

### `middleware.ts`

```typescript
// Middleware runs on every request. Handles:
// 1. Auth validation (JWT check)
// 2. Role-based routing enforcement
// 3. Vendor tenant resolution
// 4. Redirect logic for unauthenticated users

export const config = {
  matcher: ['/vendor/:path*', '/admin/:path*']
};

// Route protection matrix:
const protectedRoutes = {
  '/vendor/dashboard':  ['vendor_owner', 'vendor_manager'],
  '/vendor/kitchen':    ['vendor_owner', 'vendor_manager', 'vendor_kitchen'],
  '/vendor/menu':       ['vendor_owner', 'vendor_manager'],
  '/vendor/earnings':   ['vendor_owner'],
  '/vendor/staff':      ['vendor_owner'],
  '/vendor/settings':   ['vendor_owner'],
  '/vendor/orders':     ['vendor_owner', 'vendor_manager', 'vendor_cashier'],
  '/vendor/reports':    ['vendor_owner', 'vendor_manager'],
  '/admin/:path*':      ['super_admin', 'admin'],
};

// Redirect rules:
// - Unauthenticated on /vendor/* → /vendor/login
// - Unauthenticated on /admin/* → /admin/login
// - Wrong role → /unauthorized
// - Vendor accessing another vendor's data → /forbidden
// - Customer routes → no auth required (session-based)
```

---

## 4. Customer Navigation Flow

### Flow Diagram

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│   Welcome    │───→│  Browse      │───→│  Vendor      │
│   /order     │    │  Vendors     │    │  Menu        │
│              │    │  /vendors    │    │  /vendors/id │
└─────────────┘    └──────┬───────┘    └──────┬───────┘
                          │                    │
                          │    ┌───────────────┘
                          │    │  (Add to Cart)
                          │    ▼
                   ┌──────┴───────┐    ┌──────────────┐
                   │     Cart     │───→│   Payment    │
                   │   /cart      │    │   /payment/  │
                   │              │    │   {orderId}  │
                   └──────────────┘    └──────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  Confirmation│
                                       │  /status/    │
                                       │  {orderId}   │
                                       └──────────────┘
                                              │
                                       (auto-reset after
                                        60s inactivity)
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │   Welcome    │
                                       │   (reset)    │
                                       └──────────────┘
```

### Customer Navigation Rules

- **No back button on welcome screen** — this is the "home" state
- **Back button on vendor menu** → returns to vendor browsing (cart preserved)
- **Cart is accessible from every screen** via bottom bar
- **Payment screen is a one-way gate** — once payment starts, no back (show "Cancel Order" instead)
- **Confirmation screen auto-resets** — after order completion + inactivity
- **No authentication required** — session-based via `sessionId`

### iPad Gestures

- **Swipe left on cart item** → reveal delete button
- **Swipe down on modal** → dismiss
- **Pinch-to-zoom disabled** — fixed viewport for kiosk behavior
- **No pull-to-refresh** — real-time updates via Supabase Realtime

---

## 5. Vendor Navigation Flow

### Sidebar Navigation

```
┌─────────────────────────┐
│  🏪 [Vendor Name]       │
│  ● Online    [toggle]   │
├─────────────────────────┤
│                         │
│  📊 Dashboard           │
│  🍳 Kitchen (KDS)       │  ← Primary action
│  📋 Orders              │
│  🍽️ Menu                │
│  📈 Reports             │
│  💰 Earnings            │
│  👥 Staff               │
│  ⚙️ Settings            │
│                         │
├─────────────────────────┤
│  🔔 Notifications (3)   │
│  🚪 Logout              │
└─────────────────────────┘
```

### Vendor Navigation Rules

- **KDS screen can go fullscreen** — hides sidebar, maximizes kitchen view
- **New order notification badge** on Kitchen nav item
- **Sidebar collapsible on tablet** — icon-only mode at 72px width
- **Online/Offline toggle** always visible in sidebar header
- **Menu management sub-pages** use breadcrumbs: Menu → Edit Item
- **Deep links from notifications** work: clicking "New order" notification → opens KDS

---

## 6. Admin Navigation Flow

### Sidebar Navigation

```
┌─────────────────────────┐
│  🏗️ Food Village Admin   │
├─────────────────────────┤
│                         │
│  OVERVIEW               │
│  📊 Dashboard           │
│                         │
│  OPERATIONS             │
│  📋 Orders              │
│  🏪 Vendors             │
│  ✅ Menu Approvals (2)  │
│  🎯 Promotions          │
│                         │
│  FINANCE                │
│  💰 Revenue & Payouts   │
│                         │
│  ANALYTICS              │
│  📈 Reports             │
│                         │
│  SYSTEM                 │
│  👥 Users & Roles       │
│  📜 Audit Log           │
│  ⚙️ Settings            │
│                         │
├─────────────────────────┤
│  🔔 Alerts (5)          │
│  👤 Admin Name          │
│  🚪 Logout              │
└─────────────────────────┘
```

### Admin Navigation Rules

- **Badge counts on sidebar items** for pending approvals, alerts
- **Vendor detail is a deep page** with sub-tabs: Overview | Menu | Financials | Orders
- **Finance section** has sub-navigation: Summary | Commissions | Payouts | Reconciliation
- **Collapsible sidebar** on smaller screens (1024px breakpoint)
- **Global search** in top bar searches across orders, vendors, users
- **Breadcrumbs on every page** below top bar

---

## 7. Display Board Route

```
/display                  → Full display board (all vendors)
/display?vendors=1,2,5    → Filtered: only show specific vendors
/display/[vendorId]       → Single vendor display (mounted at booth)
```

### Display Board Rules

- **No navigation** — purely data-driven display
- **No interaction** — no clicks, no touches, no keyboard
- **Auto-refreshes** via Supabase Realtime subscriptions
- **Kiosk mode** — designed for `--kiosk` flag in Chrome
- **URL parameters for config:** `?refresh=30&columns=3&theme=dark`
- **Failsafe:** If WebSocket disconnects, show "Reconnecting..." overlay and auto-retry

---

## 8. Role-Based Access Matrix

| Route | Super Admin | Admin | Vendor Owner | Vendor Manager | Vendor Kitchen | Vendor Cashier | Waiter | Public |
|-------|:-----------:|:-----:|:------------:|:--------------:|:--------------:|:--------------:|:------:|:------:|
| `/order/*` | | | | | | | ✓ | ✓ |
| `/vendor/dashboard` | | | ✓ | ✓ | | | | |
| `/vendor/kitchen` | | | ✓ | ✓ | ✓ | | | |
| `/vendor/menu` | | | ✓ | ✓ | | | | |
| `/vendor/orders` | | | ✓ | ✓ | | ✓ | | |
| `/vendor/reports` | | | ✓ | ✓ | | | | |
| `/vendor/earnings` | | | ✓ | | | | | |
| `/vendor/staff` | | | ✓ | | | | | |
| `/vendor/settings` | | | ✓ | | | | | |
| `/admin/dashboard` | ✓ | ✓ | | | | | | |
| `/admin/orders` | ✓ | ✓ | | | | | | |
| `/admin/vendors` | ✓ | ✓ | | | | | | |
| `/admin/finance` | ✓ | ✓ | | | | | | |
| `/admin/promotions` | ✓ | ✓ | | | | | | |
| `/admin/users` | ✓ | ✓ | | | | | | |
| `/admin/settings` | ✓ | | | | | | | |
| `/admin/audit` | ✓ | ✓ | | | | | | |
| `/display/*` | | | | | | | | ✓ |

---

## 9. Deep Linking & QR Strategy

### QR Code URLs

Each physical table has a QR code that encodes:

```
https://foodvillage.com/order?table={tableId}&pin={securityPin}
```

- `tableId` identifies the table
- `securityPin` is a daily-rotating 4-digit code to prevent QR spoofing
- Scanned by waiter's device, which then creates a session

### Waiter iPad URL

When waiter starts a session for a table:

```
https://foodvillage.com/order?table=table_05&session=sess_abc123&waiter=user_w01
```

### Deep Links from Notifications

```
Vendor new order:     /vendor/kitchen?highlight=order_item_xyz
Admin alert:          /admin/orders/order_xyz
Vendor payout:        /vendor/earnings
```

---

## 10. Navigation State Management

### URL Search Params for Filters

All list views persist filter state in URL search params for shareability and browser history:

```
/admin/orders?status=pending&vendor=vendor_01&from=2024-01-01&to=2024-01-15&page=2
/vendor/orders?status=completed&from=2024-01-01&search=047
/admin/analytics?period=monthly&vendor=all
```

### Parallel Routes (Next.js)

Used for modals that preserve background context:

```
/order/vendors/vendor_01          ← Vendor menu page
/order/vendors/vendor_01/@modal   ← Item detail modal overlaid on menu
```

When modal is dismissed, URL reverts to parent route without page reload.

---

## 11. Breadcrumb System

### Breadcrumb Pattern

```
Admin > Vendors > Pizza Palace > Financials
Admin > Orders > #047 > Refund
Vendor > Menu > Edit "Classic Burger"
```

### Implementation

```tsx
// Each page exports metadata that feeds the breadcrumb component
export const metadata = {
  breadcrumbs: [
    { label: 'Vendors', href: '/admin/vendors' },
    { label: '{vendorName}', href: '/admin/vendors/{vendorId}' },
    { label: 'Financials' },  // Current page, no href
  ]
};
```

Breadcrumbs appear below the top bar in vendor and admin layouts. Not shown in customer or KDS views.

---

## 12. URL Design Principles

**Human-readable:** `/admin/vendors/pizza-palace` not `/admin/vendors/550e8400-e29b`

**Predictable hierarchy:** The URL tells you where you are:
- `/admin/vendors` → list of vendors
- `/admin/vendors/pizza-palace` → detail
- `/admin/vendors/pizza-palace/financials` → sub-section

**Stateless filters:** All filters in search params, not hidden state

**No trailing slashes**

**Slugs for display, UUIDs for API calls:** URLs use slugs (`/vendors/pizza-palace`), API calls use UUIDs (`GET /api/vendors/{uuid}`). The slug→UUID resolution happens server-side.

**Secure routes first:** Auth check happens in middleware before any page component renders. No flash of unauthorized content.
