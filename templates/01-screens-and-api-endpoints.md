# Food Village POS — Screens & API Endpoints Documentation

> **System:** Multi-tenant Food Court POS
> **Stack:** Next.js · NestJS · PostgreSQL / Supabase · Stripe Connect
> **Scenario:** Waiter hands iPad to customer → customer picks items from multiple vendors into 1 cart → orders → items appear on booth kitchen screens → payment splits automatically

---

## Table of Contents

1. [Customer-Facing Screens (iPad App)](#1-customer-facing-screens-ipad-app)
2. [Vendor/Booth Screens](#2-vendorbooth-screens)
3. [Admin Dashboard Screens](#3-admin-dashboard-screens)
4. [API Endpoints — Auth Module](#4-api-endpoints--auth-module)
5. [API Endpoints — Menu Module](#5-api-endpoints--menu-module)
6. [API Endpoints — Cart & Order Module](#6-api-endpoints--cart--order-module)
7. [API Endpoints — Payment Module](#7-api-endpoints--payment-module)
8. [API Endpoints — Kitchen Display (KDS) Module](#8-api-endpoints--kitchen-display-kds-module)
9. [API Endpoints — Vendor Module](#9-api-endpoints--vendor-module)
10. [API Endpoints — Admin Module](#10-api-endpoints--admin-module)
11. [API Endpoints — Notification Module](#11-api-endpoints--notification-module)
12. [API Endpoints — Analytics Module](#12-api-endpoints--analytics-module)
13. [API Endpoints — Promotion Module](#13-api-endpoints--promotion-module)
14. [WebSocket Events](#14-websocket-events)
15. [Supabase Realtime Channels](#15-supabase-realtime-channels)

---

## 1. Customer-Facing Screens (iPad App)

These are the screens the customer interacts with after the waiter hands them the iPad.

### 1.1 Welcome / Table Assignment Screen

```
Route: /order?table={tableId}&waiter={waiterId}
```

**Purpose:** Waiter scans table QR or selects table number. Customer sees a branded welcome with the food village name, tagline, and a "Start Ordering" CTA.

**Data needed:** `tableId`, `waiterId` (auto-assigned), food village branding config.

**Behavior:**
- Creates a new session (`POST /api/sessions`)
- Stores `sessionId` + `tableId` in local state
- If offline, generates a local UUID session and queues sync

---

### 1.2 Vendor Browsing Screen

```
Route: /order/vendors
```

**Purpose:** Horizontal scrollable cards showing all 10 booths. Each card shows booth logo, name, cuisine type, average prep time, and an "open/closed" badge.

**Data needed:** `GET /api/vendors?status=active` — returns all active vendors with metadata.

**Behavior:**
- Tapping a vendor card navigates to that vendor's menu
- A persistent bottom bar shows cart summary (item count + total)
- Filter chips at top: "All", "Fast Food", "Asian", "Drinks", "Desserts", etc.

---

### 1.3 Vendor Menu Screen

```
Route: /order/vendors/{vendorId}/menu
```

**Purpose:** Full menu for a single booth. Grouped by categories (Appetizers, Mains, Drinks). Each item shows image, name, price, prep time estimate, and dietary badges (🌱 vegan, 🌶️ spicy, GF gluten-free).

**Data needed:** `GET /api/vendors/{vendorId}/menu?available=true`

**Behavior:**
- Items marked `sold_out: true` show greyed out with "Sold Out" badge
- Tapping an item opens the Item Detail modal
- Category tabs are sticky at top
- Back button returns to vendor browsing (cart preserved)

---

### 1.4 Item Detail / Modifier Modal

```
Route: Modal overlay (no route change)
```

**Purpose:** Shows item image (large), full description, price, and modifier groups. Example: "Size" (Regular/Large), "Add-ons" (Extra Cheese +$2, Bacon +$3), "Special Instructions" (free text, 200 char max).

**Data needed:** `GET /api/menu-items/{itemId}?include=modifiers`

**Behavior:**
- Required modifier groups block "Add to Cart" until selected
- Price updates live as modifiers are toggled
- Quantity selector (1-10)
- "Add to Cart" button with final price

---

### 1.5 Cart Screen

```
Route: /order/cart
```

**Purpose:** Unified cart showing items from ALL vendors, grouped by booth. Each group has booth name header. Shows per-item price, modifiers selected, quantity controls, and a remove button.

**Data needed:** Local cart state (client-side). No API call needed until checkout.

**Layout:**
```
┌─────────────────────────────────┐
│  🍔 Burger Booth (Booth 1)      │
│  Classic Burger x1     $10.00   │
│    + Extra Cheese       $2.00   │
│                                 │
│  🍕 Pizza Palace (Booth 2)      │
│  Margherita Pizza x1   $15.00   │
│                                 │
│  🥤 Juice Bar (Booth 3)         │
│  Mango Smoothie x1      $5.00   │
│                                 │
│ ─────────────────────────────── │
│  Subtotal              $32.00   │
│  Tax (8.25%)            $2.64   │
│  Total                 $34.64   │
│                                 │
│  [ Continue Ordering ]          │
│  [ Proceed to Payment ✓ ]       │
└─────────────────────────────────┘
```

**Behavior:**
- "Continue Ordering" returns to vendor browsing
- "Proceed to Payment" calls `POST /api/orders` to create the order, then navigates to payment
- Empty cart shows illustration + "Browse Vendors" CTA

---

### 1.6 Payment Screen

```
Route: /order/payment/{orderId}
```

**Purpose:** Shows order summary and payment options. Supports Stripe Terminal (card tap on iPad reader), or cash (waiter handles).

**Data needed:** `GET /api/orders/{orderId}` + `POST /api/payments/intent`

**Payment flow:**
1. Customer selects payment method
2. For card: Stripe Terminal SDK collects payment
3. `POST /api/payments/confirm` with Stripe payment intent
4. On success → navigate to confirmation screen
5. On failure → show retry with error message

---

### 1.7 Order Confirmation / Token Screen

```
Route: /order/confirmation/{orderId}
```

**Purpose:** Shows token number (large, centered), estimated wait time per booth, and a live status tracker.

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│        Your Token: #047         │
│                                 │
│  🍔 Burger Booth — Preparing    │
│     Est. 8 min                  │
│                                 │
│  🍕 Pizza Palace — In Queue     │
│     Est. 12 min                 │
│                                 │
│  🥤 Juice Bar — Ready! ✅       │
│     Pick up at counter          │
│                                 │
│  [ Track on Display Board ]     │
└─────────────────────────────────┘
```

**Data needed:** Supabase Realtime subscription on `order_items` where `order_id = {orderId}`

**Behavior:**
- Real-time updates as each vendor changes item status
- When all items are "Ready" → screen shows "All items ready! 🎉"
- Auto-resets to Welcome screen after 60 seconds of inactivity post-completion

---

### 1.8 Order Status Display Board (TV Screen)

```
Route: /display?boothId={boothId}  (or /display for all booths)
```

**Purpose:** Large screen mounted in food court showing "Now Serving" per booth. Runs in kiosk/fullscreen mode on a smart TV or dedicated monitor.

**Layout:**
```
┌──────────────────────────────────────────────┐
│           🏪 FOOD VILLAGE — ORDER STATUS      │
├──────────────┬──────────────┬────────────────┤
│ 🍔 Burger    │ 🍕 Pizza     │ 🥤 Juice Bar   │
│              │              │                │
│ Preparing:   │ Preparing:   │ Ready:         │
│ #041, #044   │ #039, #042   │ #038, #040 ✅  │
│              │              │                │
│ Ready:       │ Ready:       │ Preparing:     │
│ #037, #040 ✅│ #037 ✅      │ #041, #044     │
├──────────────┴──────────────┴────────────────┤
│        Please pick up ready orders 🎉         │
└──────────────────────────────────────────────┘
```

**Data needed:** Supabase Realtime on `order_items` filtered by status `IN ('preparing', 'ready')`

---

## 2. Vendor/Booth Screens

Each booth gets a tablet or monitor running the vendor dashboard.

### 2.1 Vendor Login

```
Route: /vendor/login
```

**Purpose:** Vendor staff login with booth credentials. Supports PIN-based quick login for kitchen staff.

**API:** `POST /api/auth/vendor/login`

---

### 2.2 Vendor Dashboard (Home)

```
Route: /vendor/dashboard
```

**Purpose:** Overview for the current shift: today's orders count, revenue, active orders, avg prep time.

**API:** `GET /api/vendor/dashboard?date=today`

**Widgets:**
- Orders today (count + revenue)
- Active orders in queue
- Average prep time
- Top selling items (mini chart)

---

### 2.3 Kitchen Display System (KDS)

```
Route: /vendor/kitchen
```

**Purpose:** THE critical screen. Shows incoming orders as cards in columns: New → Preparing → Ready.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  🍔 Burger Booth — Kitchen Display                    │
├─────────────┬──────────────────┬─────────────────────┤
│  NEW (3)    │  PREPARING (2)   │  READY (1)          │
│             │                  │                     │
│ ┌─────────┐ │ ┌──────────────┐ │ ┌─────────────────┐ │
│ │ #047    │ │ │ #045         │ │ │ #042            │ │
│ │ Table 5 │ │ │ Table 3      │ │ │ Table 8         │ │
│ │         │ │ │              │ │ │                 │ │
│ │ Classic │ │ │ Double Bacon │ │ │ Veggie Burger   │ │
│ │ Burger  │ │ │ Burger x2    │ │ │ + Extra Cheese  │ │
│ │ x1      │ │ │ + No Onions  │ │ │                 │ │
│ │ +Cheese │ │ │              │ │ │ ✅ Tap to       │ │
│ │         │ │ │ ⏱️ 4:32      │ │ │    Complete     │ │
│ │ [Accept]│ │ │ [Ready ✓]    │ │ │                 │ │
│ └─────────┘ │ └──────────────┘ │ └─────────────────┘ │
└─────────────┴──────────────────┴─────────────────────┘
```

**Data needed:** Supabase Realtime on `order_items` where `vendor_id = {current_vendor}`

**Behavior:**
- New orders appear with audio chime + flash animation
- "Accept" → moves to Preparing, starts timer
- "Ready" → moves to Ready column, triggers customer notification
- "Complete" → archives the item
- Color coding: Red border if prep time exceeds estimate
- Auto-print ticket option on new order (ESC/POS printer)

**APIs used:**
- `PATCH /api/order-items/{itemId}/status` — `{ status: "accepted" | "preparing" | "ready" | "completed" }`
- WebSocket: `order.item.created` event for new incoming items

---

### 2.4 Vendor Menu Management

```
Route: /vendor/menu
```

**Purpose:** Add/edit/remove menu items. Toggle availability (sold out). Set prices, upload images, configure modifier groups.

**APIs:**
- `GET /api/vendor/menu-items`
- `POST /api/vendor/menu-items`
- `PUT /api/vendor/menu-items/{itemId}`
- `PATCH /api/vendor/menu-items/{itemId}/availability`
- `POST /api/vendor/menu-items/{itemId}/modifiers`

---

### 2.5 Vendor Orders History

```
Route: /vendor/orders
```

**Purpose:** Filterable list of past orders. Date range, status filter, search by token number.

**API:** `GET /api/vendor/orders?from={date}&to={date}&status={status}&page={n}`

---

### 2.6 Vendor Reports

```
Route: /vendor/reports
```

**Purpose:** Daily/weekly/monthly sales, top items, peak hours, revenue after commission.

**APIs:**
- `GET /api/vendor/reports/sales?period=daily&from=&to=`
- `GET /api/vendor/reports/top-items?limit=10`
- `GET /api/vendor/reports/peak-hours`

---

### 2.7 Vendor Earnings / Wallet

```
Route: /vendor/earnings
```

**Purpose:** Shows current balance, pending payouts, commission deductions, payout history.

**APIs:**
- `GET /api/vendor/wallet`
- `GET /api/vendor/wallet/transactions?page={n}`
- `GET /api/vendor/wallet/payouts`

---

### 2.8 Vendor Settings

```
Route: /vendor/settings
```

**Purpose:** Booth profile (name, logo, cuisine type), operating hours, prep time defaults, printer configuration, notification preferences.

**API:** `GET/PUT /api/vendor/settings`

---

## 3. Admin Dashboard Screens

### 3.1 Admin Login

```
Route: /admin/login
```

**API:** `POST /api/auth/admin/login`

---

### 3.2 Admin Dashboard (Home)

```
Route: /admin/dashboard
```

**Purpose:** Bird's-eye view of the entire food village. Real-time metrics.

**Widgets:**
- Total revenue today (all booths)
- Active orders count
- Orders per hour (live chart)
- Revenue by booth (bar chart)
- System health indicators (all booths online/offline)

**APIs:**
- `GET /api/admin/dashboard/stats`
- `GET /api/admin/dashboard/live-metrics`

---

### 3.3 All Orders View

```
Route: /admin/orders
```

**Purpose:** Every order across all booths. Filterable by booth, status, date, payment method. Searchable by token number or customer name.

**API:** `GET /api/admin/orders?vendor={id}&status={s}&from={d}&to={d}&search={q}&page={n}`

---

### 3.4 Order Detail (Admin)

```
Route: /admin/orders/{orderId}
```

**Purpose:** Full order breakdown: items by booth, payment details, status timeline, customer info, refund actions.

**APIs:**
- `GET /api/admin/orders/{orderId}`
- `POST /api/admin/orders/{orderId}/refund` (partial or full)

---

### 3.5 Vendor Management

```
Route: /admin/vendors
```

**Purpose:** List all 10 booths. Onboard new vendors, suspend/activate, view performance.

**APIs:**
- `GET /api/admin/vendors`
- `POST /api/admin/vendors` (onboard)
- `PATCH /api/admin/vendors/{vendorId}` (update settings, commission rate)
- `PATCH /api/admin/vendors/{vendorId}/status` (activate/suspend)

---

### 3.6 Vendor Detail (Admin View)

```
Route: /admin/vendors/{vendorId}
```

**Purpose:** Deep dive into a single booth: their menu, orders, revenue, commission owed, ratings, compliance status.

**APIs:**
- `GET /api/admin/vendors/{vendorId}/overview`
- `GET /api/admin/vendors/{vendorId}/financials`
- `GET /api/admin/vendors/{vendorId}/menu` (with approval status)

---

### 3.7 Finance / Revenue Dashboard

```
Route: /admin/finance
```

**Purpose:** The money screen. Total revenue, commission earned, vendor payouts pending/completed, tax collected, reconciliation status.

**APIs:**
- `GET /api/admin/finance/summary?period=monthly`
- `GET /api/admin/finance/commissions`
- `GET /api/admin/finance/payouts`
- `GET /api/admin/finance/reconciliation`
- `POST /api/admin/finance/payouts/trigger` (manual payout trigger)

---

### 3.8 Menu Approval Queue

```
Route: /admin/menu-approvals
```

**Purpose:** If admin approval is required for menu changes (new items, price changes), this screen queues them.

**APIs:**
- `GET /api/admin/menu-approvals?status=pending`
- `PATCH /api/admin/menu-approvals/{id}` — `{ action: "approve" | "reject", reason?: "" }`

---

### 3.9 Promotions Manager

```
Route: /admin/promotions
```

**Purpose:** Create and manage cross-vendor promotions, happy hour pricing, combo deals.

**APIs:**
- `GET /api/admin/promotions`
- `POST /api/admin/promotions`
- `PUT /api/admin/promotions/{promoId}`
- `DELETE /api/admin/promotions/{promoId}`

---

### 3.10 Analytics & Reports

```
Route: /admin/analytics
```

**Purpose:** Advanced analytics: sales heatmaps, vendor comparison, customer behavior, peak hour analysis, item-level performance.

**APIs:**
- `GET /api/admin/analytics/sales-heatmap`
- `GET /api/admin/analytics/vendor-comparison`
- `GET /api/admin/analytics/peak-hours`
- `GET /api/admin/analytics/top-items?across=all`
- `GET /api/admin/analytics/customer-insights`

---

### 3.11 System Settings

```
Route: /admin/settings
```

**Purpose:** Global config: food village branding, tax rates, default commission %, operating hours, receipt templates, payment gateway config, notification templates.

**API:** `GET/PUT /api/admin/settings`

---

### 3.12 User & Role Management

```
Route: /admin/users
```

**Purpose:** Manage all users: admin staff, vendor owners, vendor kitchen staff, vendor cashiers, waiters. Assign roles and permissions.

**APIs:**
- `GET /api/admin/users?role={role}`
- `POST /api/admin/users`
- `PUT /api/admin/users/{userId}`
- `DELETE /api/admin/users/{userId}`

---

### 3.13 Audit Log

```
Route: /admin/audit
```

**Purpose:** Every system action logged: who did what, when, from where. Filterable by user, action type, date.

**API:** `GET /api/admin/audit?user={id}&action={type}&from={d}&to={d}&page={n}`

---

## 4. API Endpoints — Auth Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register new user (admin-only for vendor creation) | Admin |
| `POST` | `/api/auth/login` | Login with email + password | Public |
| `POST` | `/api/auth/vendor/login` | Vendor staff login (email + PIN) | Public |
| `POST` | `/api/auth/refresh` | Refresh JWT token | Authenticated |
| `POST` | `/api/auth/logout` | Invalidate session | Authenticated |
| `POST` | `/api/auth/forgot-password` | Send password reset email | Public |
| `POST` | `/api/auth/reset-password` | Reset password with token | Public |
| `GET`  | `/api/auth/me` | Get current user profile + role | Authenticated |

### Authentication Strategy

- **Supabase Auth** for identity management
- **JWT** with custom claims: `{ userId, role, vendorId?, permissions[] }`
- **Roles:** `super_admin`, `admin`, `vendor_owner`, `vendor_manager`, `vendor_kitchen`, `vendor_cashier`, `waiter`
- **Row Level Security (RLS):** Enforced at database level via `vendor_id` tenant isolation
- **Session tokens:** Short-lived access (15 min) + long-lived refresh (7 days)

---

## 5. API Endpoints — Menu Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/vendors` | List all active vendors (customer-facing) | Public |
| `GET` | `/api/vendors/{vendorId}/menu` | Full menu for a vendor with categories | Public |
| `GET` | `/api/menu-items/{itemId}` | Item detail with modifiers | Public |
| `POST` | `/api/vendor/menu-items` | Create menu item | Vendor |
| `PUT` | `/api/vendor/menu-items/{itemId}` | Update menu item | Vendor |
| `DELETE` | `/api/vendor/menu-items/{itemId}` | Soft-delete menu item | Vendor |
| `PATCH` | `/api/vendor/menu-items/{itemId}/availability` | Toggle sold out | Vendor |
| `POST` | `/api/vendor/menu-items/{itemId}/image` | Upload item image | Vendor |
| `GET` | `/api/vendor/categories` | List vendor's categories | Vendor |
| `POST` | `/api/vendor/categories` | Create category | Vendor |
| `PUT` | `/api/vendor/categories/{catId}` | Update category (name, sort order) | Vendor |
| `POST` | `/api/vendor/modifier-groups` | Create modifier group | Vendor |
| `PUT` | `/api/vendor/modifier-groups/{groupId}` | Update modifier group | Vendor |
| `POST` | `/api/vendor/modifier-groups/{groupId}/modifiers` | Add modifier option | Vendor |
| `GET` | `/api/vendor/menu-schedules` | List menu schedules | Vendor |
| `POST` | `/api/vendor/menu-schedules` | Create schedule (breakfast/lunch/dinner) | Vendor |

### Query Parameters for Public Menu

```
GET /api/vendors/{vendorId}/menu?available=true&schedule=lunch&category=mains
```

- `available` — filter out sold-out items (default: `true` for customer-facing)
- `schedule` — filter by active schedule window
- `category` — filter by category slug

---

## 6. API Endpoints — Cart & Order Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/sessions` | Create ordering session (table + waiter) | Waiter |
| `POST` | `/api/orders` | Create order from cart payload | Session |
| `GET` | `/api/orders/{orderId}` | Get order details | Session/Vendor/Admin |
| `GET` | `/api/orders/{orderId}/status` | Get live status per item | Session |
| `PATCH` | `/api/orders/{orderId}/cancel` | Cancel entire order (before accepted) | Session/Admin |
| `PATCH` | `/api/order-items/{itemId}/status` | Update item status (vendor action) | Vendor |
| `POST` | `/api/orders/{orderId}/items` | Add items to existing order | Session |
| `DELETE` | `/api/order-items/{itemId}` | Remove item (before accepted) | Session |

### Order Creation Payload

```json
POST /api/orders
{
  "session_id": "sess_abc123",
  "table_id": "table_05",
  "waiter_id": "user_waiter_01",
  "items": [
    {
      "menu_item_id": "item_burger_01",
      "vendor_id": "vendor_01",
      "quantity": 1,
      "modifiers": [
        { "modifier_id": "mod_extra_cheese", "quantity": 1 }
      ],
      "special_instructions": "No pickles"
    },
    {
      "menu_item_id": "item_pizza_01",
      "vendor_id": "vendor_02",
      "quantity": 1,
      "modifiers": []
    },
    {
      "menu_item_id": "item_mango_smoothie",
      "vendor_id": "vendor_03",
      "quantity": 1,
      "modifiers": [
        { "modifier_id": "mod_large_size", "quantity": 1 }
      ]
    }
  ],
  "idempotency_key": "idem_20240115_table05_001"
}
```

### Order Response

```json
{
  "id": "order_xyz789",
  "token_number": 47,
  "table_id": "table_05",
  "status": "pending",
  "items": [
    {
      "id": "oi_001",
      "vendor_id": "vendor_01",
      "vendor_name": "Burger Booth",
      "item_name": "Classic Burger",
      "modifiers": ["Extra Cheese"],
      "special_instructions": "No pickles",
      "quantity": 1,
      "unit_price": 10.00,
      "modifier_price": 2.00,
      "total_price": 12.00,
      "status": "pending",
      "estimated_prep_time_minutes": 8
    }
  ],
  "subtotal": 32.00,
  "tax": 2.64,
  "total": 34.64,
  "created_at": "2024-01-15T12:30:00Z"
}
```

### Order State Machine

```
                    ┌──────────┐
                    │  PENDING  │ (customer placed order)
                    └─────┬────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │ ACCEPTED │  │ ACCEPTED │  │ ACCEPTED │  (each vendor accepts their items)
     │ Booth 1  │  │ Booth 2  │  │ Booth 3  │
     └────┬─────┘  └────┬─────┘  └────┬─────┘
          │              │              │
          ▼              ▼              ▼
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │PREPARING │  │PREPARING │  │PREPARING │  (vendor starts cooking)
     └────┬─────┘  └────┬─────┘  └────┬─────┘
          │              │              │
          ▼              ▼              ▼
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │  READY   │  │  READY   │  │  READY   │  (item done, customer notified)
     └────┬─────┘  └────┬─────┘  └────┬─────┘
          │              │              │
          ▼              ▼              ▼
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │ PICKED UP│  │ PICKED UP│  │ PICKED UP│  (customer collected)
     └────┬─────┘  └────┬─────┘  └────┬─────┘
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  ┌─────────────┐
                  │  COMPLETED  │  (all items picked up → order done)
                  └─────────────┘

  Side states:
  - REJECTED (vendor rejects item → refund triggered)
  - CANCELLED (customer/admin cancels → full/partial refund)
```

---

## 7. API Endpoints — Payment Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/payments/intent` | Create Stripe PaymentIntent with splits | Session |
| `POST` | `/api/payments/confirm` | Confirm payment after terminal collection | Session |
| `POST` | `/api/payments/cash` | Record cash payment (waiter action) | Waiter |
| `GET` | `/api/payments/{paymentId}` | Get payment details | Auth |
| `POST` | `/api/payments/{paymentId}/refund` | Process refund (full or partial) | Admin |
| `GET` | `/api/payments/{paymentId}/splits` | View payment split breakdown | Admin/Vendor |

### Payment Intent Creation (Stripe Connect)

```json
POST /api/payments/intent
{
  "order_id": "order_xyz789",
  "payment_method": "card_terminal"
}
```

**Backend logic:**
1. Calculate vendor splits from order items
2. Create Stripe PaymentIntent with `transfer_group`
3. After payment confirmation, create individual `Transfer` objects to each vendor's connected Stripe account
4. Deduct commission before transfer

### Payment Split Response

```json
{
  "payment_id": "pay_abc123",
  "order_id": "order_xyz789",
  "total": 34.64,
  "tax": 2.64,
  "subtotal": 32.00,
  "splits": [
    {
      "vendor_id": "vendor_01",
      "vendor_name": "Burger Booth",
      "gross_amount": 12.00,
      "commission_rate": 0.15,
      "commission_amount": 1.80,
      "net_amount": 10.20,
      "stripe_transfer_id": "tr_001"
    },
    {
      "vendor_id": "vendor_02",
      "vendor_name": "Pizza Palace",
      "gross_amount": 15.00,
      "commission_rate": 0.15,
      "commission_amount": 2.25,
      "net_amount": 12.75,
      "stripe_transfer_id": "tr_002"
    },
    {
      "vendor_id": "vendor_03",
      "vendor_name": "Juice Bar",
      "gross_amount": 5.00,
      "commission_rate": 0.12,
      "commission_amount": 0.60,
      "net_amount": 4.40,
      "stripe_transfer_id": "tr_003"
    }
  ],
  "platform_commission_total": 4.65,
  "platform_tax_collected": 2.64,
  "status": "completed"
}
```

---

## 8. API Endpoints — Kitchen Display (KDS) Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/kds/orders` | Get active orders for current vendor | Vendor |
| `PATCH` | `/api/kds/items/{itemId}/accept` | Accept order item | Vendor |
| `PATCH` | `/api/kds/items/{itemId}/preparing` | Mark as preparing | Vendor |
| `PATCH` | `/api/kds/items/{itemId}/ready` | Mark as ready | Vendor |
| `PATCH` | `/api/kds/items/{itemId}/complete` | Mark as picked up | Vendor |
| `PATCH` | `/api/kds/items/{itemId}/reject` | Reject item (with reason) | Vendor |
| `GET` | `/api/kds/queue-stats` | Queue depth, avg prep time | Vendor |
| `GET` | `/api/display/board` | Public display board data | Public |

---

## 9. API Endpoints — Vendor Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/vendor/profile` | Get vendor profile | Vendor |
| `PUT` | `/api/vendor/profile` | Update vendor profile | Vendor Owner |
| `GET` | `/api/vendor/settings` | Get vendor settings | Vendor |
| `PUT` | `/api/vendor/settings` | Update settings (hours, prep defaults) | Vendor Owner |
| `GET` | `/api/vendor/staff` | List vendor staff | Vendor Owner |
| `POST` | `/api/vendor/staff` | Add staff member | Vendor Owner |
| `PUT` | `/api/vendor/staff/{userId}` | Update staff role | Vendor Owner |
| `DELETE` | `/api/vendor/staff/{userId}` | Remove staff member | Vendor Owner |
| `GET` | `/api/vendor/dashboard` | Dashboard stats | Vendor |
| `GET` | `/api/vendor/reports/sales` | Sales reports | Vendor |
| `GET` | `/api/vendor/reports/top-items` | Top selling items | Vendor |
| `GET` | `/api/vendor/reports/peak-hours` | Peak hour analysis | Vendor |
| `GET` | `/api/vendor/wallet` | Wallet balance + summary | Vendor Owner |
| `GET` | `/api/vendor/wallet/transactions` | Transaction ledger | Vendor Owner |

---

## 10. API Endpoints — Admin Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/admin/dashboard/stats` | Global stats | Admin |
| `GET` | `/api/admin/dashboard/live-metrics` | Real-time metrics | Admin |
| `GET` | `/api/admin/vendors` | List all vendors | Admin |
| `POST` | `/api/admin/vendors` | Onboard new vendor | Admin |
| `PATCH` | `/api/admin/vendors/{id}` | Update vendor config | Admin |
| `PATCH` | `/api/admin/vendors/{id}/status` | Activate/suspend vendor | Admin |
| `PATCH` | `/api/admin/vendors/{id}/commission` | Set commission rate | Admin |
| `GET` | `/api/admin/orders` | All orders (filterable) | Admin |
| `GET` | `/api/admin/orders/{id}` | Order detail | Admin |
| `POST` | `/api/admin/orders/{id}/refund` | Process refund | Admin |
| `GET` | `/api/admin/finance/summary` | Financial summary | Admin |
| `GET` | `/api/admin/finance/commissions` | Commission report | Admin |
| `GET` | `/api/admin/finance/payouts` | Payout history | Admin |
| `POST` | `/api/admin/finance/payouts/trigger` | Manual payout trigger | Super Admin |
| `GET` | `/api/admin/finance/reconciliation` | Reconciliation report | Admin |
| `GET` | `/api/admin/menu-approvals` | Pending menu approvals | Admin |
| `PATCH` | `/api/admin/menu-approvals/{id}` | Approve/reject menu change | Admin |
| `GET` | `/api/admin/users` | All users and roles | Admin |
| `POST` | `/api/admin/users` | Create user | Admin |
| `PUT` | `/api/admin/users/{id}` | Update user | Admin |
| `DELETE` | `/api/admin/users/{id}` | Deactivate user | Admin |
| `GET` | `/api/admin/audit` | Audit log | Admin |
| `GET` | `/api/admin/settings` | Global settings | Admin |
| `PUT` | `/api/admin/settings` | Update global settings | Super Admin |

---

## 11. API Endpoints — Notification Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/notifications/send` | Send notification (internal) | System |
| `GET` | `/api/notifications` | Get user's notifications | Auth |
| `PATCH` | `/api/notifications/{id}/read` | Mark as read | Auth |
| `POST` | `/api/notifications/subscribe` | Subscribe to push notifications | Auth |
| `GET` | `/api/notifications/preferences` | Get notification preferences | Auth |
| `PUT` | `/api/notifications/preferences` | Update preferences | Auth |

### Notification Events (Triggered Automatically)

| Event | Recipients | Channel |
|-------|-----------|---------|
| `order.created` | Vendor(s) in order | WebSocket + Audio chime |
| `order.item.ready` | Customer (display board) | Realtime + SMS (optional) |
| `order.completed` | Admin dashboard | Realtime |
| `order.rejected` | Customer + Admin | Realtime + SMS |
| `vendor.payout.completed` | Vendor owner | Email + In-app |
| `menu.approval.needed` | Admin | In-app |
| `vendor.going.offline` | Admin | In-app alert |
| `system.daily.summary` | Admin | Email |

---

## 12. API Endpoints — Analytics Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/admin/analytics/sales-heatmap` | Hourly sales heatmap | Admin |
| `GET` | `/api/admin/analytics/vendor-comparison` | Compare vendor performance | Admin |
| `GET` | `/api/admin/analytics/peak-hours` | Peak hour patterns | Admin |
| `GET` | `/api/admin/analytics/top-items` | Top items across all vendors | Admin |
| `GET` | `/api/admin/analytics/customer-insights` | Order patterns, avg ticket | Admin |
| `GET` | `/api/admin/analytics/revenue-trends` | Revenue over time | Admin |
| `GET` | `/api/admin/analytics/prep-time-analysis` | Prep time by vendor/item | Admin |
| `GET` | `/api/admin/analytics/table-turnover` | Table usage analytics | Admin |

---

## 13. API Endpoints — Promotion Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/promotions/active` | Active promotions (customer-facing) | Public |
| `POST` | `/api/promotions/validate` | Validate promo code for cart | Session |
| `GET` | `/api/admin/promotions` | All promotions | Admin |
| `POST` | `/api/admin/promotions` | Create promotion | Admin |
| `PUT` | `/api/admin/promotions/{id}` | Update promotion | Admin |
| `DELETE` | `/api/admin/promotions/{id}` | Delete promotion | Admin |
| `GET` | `/api/admin/promotions/{id}/analytics` | Promotion performance | Admin |

### Promotion Types Supported

- **Percentage discount** — 10% off from Booth 1
- **Fixed discount** — $5 off orders over $25
- **Cross-vendor combo** — Burger + Juice = 15% off (admin-only creation)
- **Happy hour** — 20% off all items between 3-5 PM
- **First-order discount** — New customer gets 10% off
- **Free item** — Buy 2 pizzas, get a free drink from Booth 3

---

## 14. WebSocket Events

Connection: `wss://api.foodvillage.com/ws?token={jwt}`

### Events Emitted by Server

| Event | Payload | Sent To |
|-------|---------|---------|
| `order.created` | `{ orderId, vendorId, items[] }` | Vendor KDS |
| `order.item.status_changed` | `{ orderItemId, orderId, status, vendorId }` | Customer screen, Display board, Admin |
| `order.completed` | `{ orderId, tokenNumber }` | Admin dashboard |
| `vendor.status_changed` | `{ vendorId, status: "online"/"offline" }` | Customer app, Admin |
| `menu.item.availability_changed` | `{ menuItemId, vendorId, available }` | Customer app |
| `payment.completed` | `{ orderId, paymentId, amount }` | Admin, Vendor |
| `queue.updated` | `{ vendorId, queueDepth, estimatedWait }` | Customer app |

### Events Emitted by Client

| Event | Payload | From |
|-------|---------|------|
| `kds.item.status_update` | `{ orderItemId, status }` | Vendor KDS |
| `vendor.heartbeat` | `{ vendorId, timestamp }` | Vendor tablet |

---

## 15. Supabase Realtime Channels

For screens that need real-time updates without managing WebSocket connections directly.

| Channel | Table | Filter | Used By |
|---------|-------|--------|---------|
| `orders:vendor:{vendorId}` | `order_items` | `vendor_id=eq.{vendorId}` | Vendor KDS |
| `orders:customer:{orderId}` | `order_items` | `order_id=eq.{orderId}` | Customer status screen |
| `orders:display` | `order_items` | `status=in.(preparing,ready)` | Display board |
| `menu:availability` | `menu_items` | `available=eq.false` | Customer app |
| `vendors:status` | `vendors` | (all changes) | Customer app, Admin |

### Subscription Example (Next.js Client)

```typescript
// In customer confirmation screen
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

supabase
  .channel(`orders:customer:${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'order_items',
    filter: `order_id=eq.${orderId}`
  }, (payload) => {
    // Update UI with new status
    updateItemStatus(payload.new.id, payload.new.status);
  })
  .subscribe();
```

---

## API Conventions

### Base URL
```
Production:  https://api.foodvillage.com/api
Staging:     https://staging-api.foodvillage.com/api
Local:       http://localhost:3001/api
```

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

### Standard Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order with ID order_xyz789 not found",
    "status": 404,
    "details": {}
  }
}
```

### Rate Limiting
- Public endpoints: 100 requests/minute per IP
- Authenticated endpoints: 300 requests/minute per user
- Admin endpoints: 500 requests/minute per user
- Webhook endpoints: 1000 requests/minute

### Versioning
```
/api/v1/orders  (future versioning via URL prefix)
```
