# Food Village POS — API Contract (Phase 1 & 2)

> **Backend:** NestJS · Prisma · Supabase (PostgreSQL + Auth + Realtime)
> **Base URL:** `http://localhost:3001/api` (dev) · `https://api.foodvillage.com/api` (prod)
> **Auth:** Supabase JWT. Header: `Authorization: Bearer <token>`
> **Response envelope:** `{ success: boolean, data: T, meta?: PaginationMeta }`
> **Error envelope:** `{ success: false, error: { code: string, message: string, status: number } }`

---

## Table of Contents

1. [Auth Module](#1-auth-module)
2. [Sessions Module](#2-sessions-module)
3. [Menu Module (Public)](#3-menu-module-public)
4. [Order Module](#4-order-module)
5. [KDS Module (Vendor Kitchen)](#5-kds-module-vendor-kitchen)
6. [Vendor Module (Phase 2)](#6-vendor-module-phase-2)
7. [Display Board Module (Phase 2)](#7-display-board-module-phase-2)
8. [Supabase Realtime Channels](#8-supabase-realtime-channels)
9. [DTOs & Interfaces Reference](#9-dtos--interfaces-reference)

---

## 1. Auth Module

**Screen:** Vendor Login (`/vendor/login`), Admin Login  
**NestJS Module:** `AuthModule`  
**Controller:** `AuthController` — prefix `/api/auth`

| Component | Method | Endpoint | DTO / Interface | Request Body | Response Data | Description |
|---|---|---|---|---|---|---|
| VendorLoginForm | POST | `/api/auth/login` | `LoginDto` | `{ email: string, password: string }` | `AuthResponseDto` | Email + password login for vendors/admins |
| PinLoginForm | POST | `/api/auth/pin-login` | `PinLoginDto` | `{ vendor_id: string, pin: string }` | `AuthResponseDto` | 4-digit PIN login for kitchen staff |
| UserHeader | GET | `/api/auth/me` | — | Bearer token | `UserProfileDto` | Get current authenticated user info |
| LogoutButton | POST | `/api/auth/logout` | — | Bearer token | `{ message: string }` | Invalidate session |

### DTOs

```typescript
// LoginDto
{ email: string; password: string; }

// PinLoginDto
{ vendor_id: string; pin: string; }

// AuthResponseDto
{ access_token: string; user: UserProfileDto; }

// UserProfileDto
{ id: string; email: string; role: UserRole; vendor_id?: string; full_name: string; }

// UserRole enum
'super_admin' | 'admin' | 'vendor_owner' | 'vendor_kitchen' | 'vendor_cashier' | 'waiter'
```

---

## 2. Sessions Module

**Screen:** Welcome Screen (`/order?table=X&waiter=Y`)  
**NestJS Module:** `SessionsModule`  
**Controller:** `SessionsController` — prefix `/api/sessions`

| Component | Method | Endpoint | DTO / Interface | Request Body | Response Data | Description |
|---|---|---|---|---|---|---|
| WelcomeScreen | POST | `/api/sessions` | `CreateSessionDto` | `{ table_id: string, waiter_id: string }` | `SessionDto` | Create new ordering session for table |
| WelcomeScreen | GET | `/api/sessions/:id` | — | Bearer token | `SessionDto` | Get existing session details |
| WelcomeScreen | PATCH | `/api/sessions/:id/close` | — | Bearer token | `SessionDto` | Close session after order completion |

### DTOs

```typescript
// CreateSessionDto
{ table_id: string; waiter_id: string; }

// SessionDto
{
  id: string;
  table_id: string;
  table_number: number;
  waiter_id: string;
  waiter_name: string;
  status: 'active' | 'closed';
  created_at: string;
  expires_at: string;
}
```

---

## 3. Menu Module (Public)

**Screens:** Vendor Browsing (`/order/vendors`), Vendor Menu (`/order/vendors/:id/menu`), Item Detail Modal  
**NestJS Module:** `MenuModule`  
**Controller:** `MenuController` — prefix `/api`

| Component | Method | Endpoint | DTO / Interface | Request / Query | Response Data | Description |
|---|---|---|---|---|---|---|
| VendorBrowsingScreen | GET | `/api/vendors` | — | `?status=active` | `VendorListDto[]` | List all active vendors with metadata |
| VendorMenuScreen | GET | `/api/vendors/:vendorId/menu` | — | `?available=true&category=slug` | `VendorMenuDto` | Full menu: categories + items + modifiers |
| ItemDetailModal | GET | `/api/menu-items/:itemId` | — | — | `MenuItemDetailDto` | Single item detail with full modifier groups |
| VendorMenuScreen | GET | `/api/vendors/:vendorId/categories` | — | — | `CategoryDto[]` | Vendor's categories (ordered) |

### DTOs

```typescript
// VendorListDto
{
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  cuisine_type: string;
  booth_number: number;
  booth_color: string;           // hex, used for KDS left border + display board header
  avg_prep_time_minutes: number;
  status: 'online' | 'offline' | 'suspended';
  is_accepting_orders: boolean;
}

// CategoryDto
{
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  item_count: number;
}

// VendorMenuDto
{
  vendor: VendorListDto;
  categories: Array<{
    category: CategoryDto;
    items: MenuItemSummaryDto[];
  }>;
}

// MenuItemSummaryDto (used in menu grid)
{
  id: string;
  name: string;
  description?: string;
  price: number;                 // in dollars, 2 decimal places
  image_url?: string;
  thumbnail_url?: string;
  prep_time_minutes: number;
  dietary_tags: string[];        // ['vegan', 'gluten_free', 'spicy', 'halal']
  allergens: string[];
  is_available: boolean;
  has_modifiers: boolean;
  category_id: string;
}

// MenuItemDetailDto (used in modifier modal)
{
  ...MenuItemSummaryDto;
  modifier_groups: Array<{
    id: string;
    name: string;
    is_required: boolean;
    min_selections: number;
    max_selections: number;
    modifiers: ModifierDto[];
  }>;
}

// ModifierDto
{
  id: string;
  name: string;
  price_adjustment: number;     // 0 if no extra charge
  is_available: boolean;
}
```

---

## 4. Order Module

**Screens:** Cart (`/order/cart`), Order Confirmation (`/order/confirmation/:id`)  
**NestJS Module:** `OrderModule`  
**Controller:** `OrderController` — prefix `/api/orders`

| Component | Method | Endpoint | DTO / Interface | Request Body | Response Data | Description |
|---|---|---|---|---|---|---|
| CartScreen | POST | `/api/orders` | `CreateOrderDto` | `CreateOrderDto` | `OrderDto` | Create order from cart, generate token number |
| ConfirmationScreen | GET | `/api/orders/:orderId` | — | Bearer token | `OrderDto` | Get full order details + per-item status |
| ConfirmationScreen | GET | `/api/orders/:orderId/status` | — | — | `OrderStatusSummaryDto` | Lightweight status check (polling fallback) |
| CartScreen | PATCH | `/api/orders/:orderId/cancel` | `CancelOrderDto` | `{ reason?: string }` | `OrderDto` | Cancel order (before any item accepted) |
| CartScreen | POST | `/api/orders/:orderId/items` | `AddOrderItemsDto` | `{ items: CartItemDto[] }` | `OrderDto` | Add more items to existing order |

### DTOs

```typescript
// CartItemDto
{
  menu_item_id: string;
  vendor_id: string;
  quantity: number;
  modifiers: Array<{ modifier_id: string; quantity: number }>;
  special_instructions?: string;  // max 200 chars
}

// CreateOrderDto
{
  session_id: string;
  table_id: string;
  waiter_id?: string;
  idempotency_key: string;         // client-generated UUID, prevents duplicate orders
  items: CartItemDto[];
}

// OrderDto (full response)
{
  id: string;
  token_number: number;            // daily sequence, e.g. 47
  table_id: string;
  table_number: number;
  session_id: string;
  status: OrderStatus;
  payment_status: 'unpaid';        // always unpaid for cash-only model
  payment_method: 'cash';
  subtotal: number;
  tax_amount: number;
  total: number;
  items: OrderItemDto[];
  created_at: string;
  updated_at: string;
}

// OrderItemDto
{
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_color: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  modifier_price: number;
  total_price: number;
  modifiers: Array<{ name: string; price: number; type: 'add' | 'remove' }>;
  special_instructions?: string;
  status: OrderItemStatus;
  estimated_prep_time_minutes: number;
  accepted_at?: string;
  preparing_at?: string;
  ready_at?: string;
  completed_at?: string;
}

// OrderStatus enum
'pending' | 'confirmed' | 'partially_ready' | 'ready' | 'completed' | 'cancelled'

// OrderItemStatus enum
'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'rejected'

// OrderStatusSummaryDto
{
  order_id: string;
  token_number: number;
  overall_status: OrderStatus;
  items: Array<{
    id: string;
    vendor_name: string;
    vendor_color: string;
    item_name: string;
    status: OrderItemStatus;
    estimated_prep_time_minutes: number;
  }>;
}

// AddOrderItemsDto
{ items: CartItemDto[]; }

// CancelOrderDto
{ reason?: string; }
```

---

## 5. KDS Module (Vendor Kitchen)

**Screen:** KDS (`/vendor/kitchen`)  
**NestJS Module:** `KdsModule`  
**Controller:** `KdsController` — prefix `/api/kds`  
**Auth:** `vendor_kitchen | vendor_cashier | vendor_owner` roles only

| Component | Method | Endpoint | DTO / Interface | Request | Response Data | Description |
|---|---|---|---|---|---|---|
| KDSBoard | GET | `/api/kds/orders` | — | Bearer token (vendor) | `KDSOrdersResponseDto` | All active order items for this vendor grouped by status |
| KDSNewColumn | PATCH | `/api/kds/items/:itemId/accept` | — | Bearer token | `OrderItemDto` | Accept item → move to Preparing column |
| KDSPreparingColumn | PATCH | `/api/kds/items/:itemId/preparing` | — | Bearer token | `OrderItemDto` | Explicitly mark as preparing (optional, accept auto-sets) |
| KDSPreparingColumn | PATCH | `/api/kds/items/:itemId/ready` | — | Bearer token | `OrderItemDto` | Mark item ready for pickup |
| KDSReadyColumn | PATCH | `/api/kds/items/:itemId/complete` | — | Bearer token | `OrderItemDto` | Mark item picked up / completed |
| KDSNewColumn | PATCH | `/api/kds/items/:itemId/reject` | `RejectItemDto` | `{ reason: string, custom_reason?: string }` | `OrderItemDto` | Reject item with reason |
| KDSSidebar | GET | `/api/kds/queue-stats` | — | Bearer token | `QueueStatsDto` | Queue depth + avg prep time for vendor |

### DTOs

```typescript
// KDSOrdersResponseDto
{
  vendor_id: string;
  new: KDSOrderCardDto[];
  preparing: KDSOrderCardDto[];
  ready: KDSOrderCardDto[];
}

// KDSOrderCardDto
{
  item_id: string;
  order_id: string;
  token_number: number;
  table_number: number;
  item_name: string;
  quantity: number;
  modifiers: Array<{ name: string; type: 'add' | 'remove'; price: number }>;
  special_instructions?: string;
  status: OrderItemStatus;
  estimated_prep_time_minutes: number;
  accepted_at?: string;          // for timer calculation
  preparing_at?: string;
  created_at: string;
}

// RejectItemDto
{
  reason: 'out_of_stock' | 'equipment_issue' | 'custom';
  custom_reason?: string;        // required when reason === 'custom'
}

// QueueStatsDto
{
  vendor_id: string;
  queue_depth: number;           // count of pending + preparing items
  avg_prep_time_minutes: number;
  oldest_pending_minutes: number;
}
```

---

## 6. Vendor Module (Phase 2)

**Screens:** Vendor Dashboard (`/vendor/dashboard`), Menu Management (`/vendor/menu`), Orders History (`/vendor/orders`), Settings (`/vendor/settings`)  
**NestJS Module:** `VendorModule`  
**Controller:** `VendorController` — prefix `/api/vendor`  
**Auth:** `vendor_owner | vendor_manager` roles

### 6a. Dashboard

| Component | Method | Endpoint | DTO / Interface | Request | Response Data | Description |
|---|---|---|---|---|---|---|
| DashboardHome | GET | `/api/vendor/dashboard` | — | Bearer token | `VendorDashboardDto` | Today's stats for vendor |
| OrdersWidget | GET | `/api/vendor/orders` | — | `?from=&to=&status=&page=&limit=` | `PaginatedDto<VendorOrderSummaryDto>` | Paginated order history |
| OrderDetail | GET | `/api/vendor/orders/:orderId` | — | Bearer token | `OrderDto` | Single order detail |

```typescript
// VendorDashboardDto
{
  vendor_id: string;
  today: {
    order_count: number;
    revenue: number;            // cash collected total
    avg_prep_time_minutes: number;
    active_orders_count: number;
    top_items: Array<{ name: string; count: number }>;
  };
  date: string;                 // YYYY-MM-DD
}

// VendorOrderSummaryDto
{
  id: string;
  token_number: number;
  table_number: number;
  status: OrderStatus;
  item_count: number;
  total_vendor_amount: number;  // sum of this vendor's items only
  created_at: string;
}
```

### 6b. Menu Management

| Component | Method | Endpoint | DTO / Interface | Request Body | Response Data | Description |
|---|---|---|---|---|---|---|
| MenuItemList | GET | `/api/vendor/menu-items` | — | `?category=&available=` | `MenuItemDetailDto[]` | All vendor menu items |
| MenuItemForm | POST | `/api/vendor/menu-items` | `CreateMenuItemDto` | `CreateMenuItemDto` | `MenuItemDetailDto` | Create new menu item |
| MenuItemForm | PUT | `/api/vendor/menu-items/:id` | `UpdateMenuItemDto` | `UpdateMenuItemDto` | `MenuItemDetailDto` | Update menu item |
| MenuItemList | DELETE | `/api/vendor/menu-items/:id` | — | Bearer token | `{ success: true }` | Soft-delete menu item |
| MenuItemList | PATCH | `/api/vendor/menu-items/:id/availability` | `UpdateAvailabilityDto` | `{ is_available: boolean }` | `MenuItemDetailDto` | Toggle sold out instantly |
| MenuItemForm | POST | `/api/vendor/menu-items/:id/image` | — | multipart/form-data `{ file }` | `{ image_url: string, thumbnail_url: string }` | Upload item image to Supabase Storage |
| CategoryList | GET | `/api/vendor/categories` | — | Bearer token | `CategoryDto[]` | Vendor's menu categories |
| CategoryForm | POST | `/api/vendor/categories` | `CreateCategoryDto` | `{ name: string, sort_order?: number }` | `CategoryDto` | Create category |
| CategoryForm | PUT | `/api/vendor/categories/:id` | `UpdateCategoryDto` | `{ name?: string, sort_order?: number }` | `CategoryDto` | Update category |
| ModifierGroupForm | POST | `/api/vendor/modifier-groups` | `CreateModifierGroupDto` | `CreateModifierGroupDto` | `ModifierGroupDto` | Create modifier group |
| ModifierGroupForm | PUT | `/api/vendor/modifier-groups/:id` | `UpdateModifierGroupDto` | `UpdateModifierGroupDto` | `ModifierGroupDto` | Update modifier group |
| ModifierGroupForm | POST | `/api/vendor/modifier-groups/:id/modifiers` | `CreateModifierDto` | `{ name: string, price_adjustment: number }` | `ModifierDto` | Add modifier option to group |
| ModifierGroupForm | DELETE | `/api/vendor/modifier-groups/:id/modifiers/:modId` | — | Bearer token | `{ success: true }` | Remove modifier option |

```typescript
// CreateMenuItemDto
{
  name: string;
  description?: string;
  price: number;
  category_id: string;
  prep_time_minutes: number;
  dietary_tags?: string[];
  allergens?: string[];
  modifier_group_ids?: string[];
}

// UpdateMenuItemDto — all fields optional
{ name?: string; description?: string; price?: number; category_id?: string; prep_time_minutes?: number; dietary_tags?: string[]; allergens?: string[]; modifier_group_ids?: string[]; }

// UpdateAvailabilityDto
{ is_available: boolean; }

// CreateCategoryDto
{ name: string; sort_order?: number; }

// CreateModifierGroupDto
{
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  modifiers: Array<{ name: string; price_adjustment: number }>;
}

// ModifierGroupDto
{
  id: string;
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  modifiers: ModifierDto[];
}
```

### 6c. Settings

| Component | Method | Endpoint | DTO / Interface | Request Body | Response Data | Description |
|---|---|---|---|---|---|---|
| VendorSettingsPage | GET | `/api/vendor/settings` | — | Bearer token | `VendorSettingsDto` | Get vendor booth settings |
| VendorSettingsPage | PUT | `/api/vendor/settings` | `UpdateVendorSettingsDto` | `UpdateVendorSettingsDto` | `VendorSettingsDto` | Update booth settings |
| VendorSettingsPage | PATCH | `/api/vendor/status` | `UpdateVendorStatusDto` | `{ is_accepting_orders: boolean }` | `VendorSettingsDto` | Toggle online/offline |

```typescript
// VendorSettingsDto
{
  id: string;
  name: string;
  slug: string;
  cuisine_type: string;
  booth_number: number;
  booth_color: string;
  logo_url?: string;
  avg_prep_time_minutes: number;
  is_accepting_orders: boolean;
  operating_hours: OperatingHoursDto;
  notification_preferences: { new_order_sound: boolean; volume: number };
}

// UpdateVendorSettingsDto — all optional
{
  name?: string;
  cuisine_type?: string;
  booth_color?: string;
  avg_prep_time_minutes?: number;
  operating_hours?: OperatingHoursDto;
  notification_preferences?: { new_order_sound?: boolean; volume?: number };
}

// OperatingHoursDto
{
  mon: { open: string; close: string; is_closed: boolean };
  // ... tue–sun same shape
}
```

---

## 7. Display Board Module (Phase 2)

**Screen:** Display Board (`/display`)  
**NestJS Module:** Part of `OrderModule`  
**Controller:** `DisplayController` — prefix `/api/display`  
**Auth:** Public (no auth needed — TV kiosk screen)

| Component | Method | Endpoint | DTO / Interface | Request | Response Data | Description |
|---|---|---|---|---|---|---|
| DisplayBoard | GET | `/api/display/board` | — | — | `DisplayBoardDto` | All preparing + ready items grouped by vendor |

```typescript
// DisplayBoardDto
{
  food_village_name: string;
  vendors: Array<{
    vendor_id: string;
    vendor_name: string;
    booth_color: string;
    logo_url?: string;
    preparing: number[];         // token numbers
    ready: number[];             // token numbers (show with green pulse)
  }>;
  last_updated: string;
}
```

---

## 8. Supabase Realtime Channels

> These are NOT REST endpoints. Configured in frontend using `supabase.channel()`. No NestJS code needed — Supabase handles broadcast directly from DB triggers.

| Channel Name | Table Watched | Filter | Used By | Event |
|---|---|---|---|---|
| `orders:vendor:{vendorId}` | `order_items` | `vendor_id=eq.{vendorId}` | KDS screen | INSERT (new order), UPDATE (status change) |
| `orders:customer:{orderId}` | `order_items` | `order_id=eq.{orderId}` | Confirmation screen | UPDATE (status change per item) |
| `orders:display` | `order_items` | `status=in.(preparing,ready)` | Display board TV | INSERT, UPDATE, DELETE |
| `menu:availability:{vendorId}` | `menu_items` | `vendor_id=eq.{vendorId}` | Customer menu screen | UPDATE (is_available change) |
| `vendors:status` | `vendors` | — | Customer vendor browse | UPDATE (is_accepting_orders change) |

### Frontend Subscription Pattern

```typescript
// KDS subscription (vendor kitchen screen)
supabase
  .channel(`orders:vendor:${vendorId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'order_items',
    filter: `vendor_id=eq.${vendorId}`
  }, handleKDSUpdate)
  .subscribe();

// Customer order tracking (confirmation screen)
supabase
  .channel(`orders:customer:${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'order_items',
    filter: `order_id=eq.${orderId}`
  }, handleStatusUpdate)
  .subscribe();
```

---

## 9. DTOs & Interfaces Reference

### Pagination

```typescript
// PaginationMeta (in response envelope meta field)
{
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// PaginatedDto<T>
{
  items: T[];
  meta: PaginationMeta;
}
```

### Standard Responses

```typescript
// Success envelope
{ success: true; data: T; meta?: PaginationMeta; }

// Error envelope
{
  success: false;
  error: {
    code: string;          // e.g. 'ORDER_NOT_FOUND', 'VALIDATION_ERROR'
    message: string;
    status: number;        // HTTP status code
    details?: Record<string, string[]>;  // validation errors
  };
}
```

### Common Error Codes

| Code | HTTP | When |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing/invalid JWT |
| `FORBIDDEN` | 403 | Correct JWT, wrong role |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 422 | DTO validation failed |
| `DUPLICATE_ORDER` | 409 | Idempotency key already used |
| `ORDER_ALREADY_ACCEPTED` | 409 | Tried to cancel accepted order |
| `ITEM_NOT_AVAILABLE` | 422 | Menu item sold out at time of order |
| `INVALID_TRANSITION` | 422 | Invalid order status state machine transition |
| `SESSION_EXPIRED` | 401 | Ordering session expired |

### NestJS Module Structure

```
backend/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/           jwt-auth.guard.ts, roles.guard.ts
│   ├── decorators/       roles.decorator.ts, current-user.decorator.ts
│   ├── filters/          http-exception.filter.ts
│   ├── interceptors/     response-transform.interceptor.ts
│   └── pipes/            validation.pipe.ts
├── config/
│   └── configuration.ts  (env vars typed config)
├── database/
│   ├── prisma.service.ts
│   └── seed.ts
└── modules/
    ├── auth/             auth.module, auth.controller, auth.service, dto/
    ├── sessions/         sessions.module, sessions.controller, sessions.service, dto/
    ├── menu/             menu.module, menu.controller, menu.service, dto/
    ├── orders/           orders.module, orders.controller, orders.service, dto/
    ├── kds/              kds.module, kds.controller, kds.service, dto/
    └── vendor/           vendor.module, vendor.controller, vendor.service, dto/
                          sub-controllers: vendor-menu.controller, vendor-dashboard.controller
```

---

## Endpoint Summary Table (quick reference)

| # | Method | Endpoint | Auth | Phase | Module |
|---|---|---|---|---|---|
| 1 | POST | `/api/auth/login` | Public | 1 | Auth |
| 2 | POST | `/api/auth/pin-login` | Public | 1 | Auth |
| 3 | GET | `/api/auth/me` | Auth | 1 | Auth |
| 4 | POST | `/api/auth/logout` | Auth | 1 | Auth |
| 5 | POST | `/api/sessions` | Waiter | 1 | Sessions |
| 6 | GET | `/api/sessions/:id` | Auth | 1 | Sessions |
| 7 | PATCH | `/api/sessions/:id/close` | Auth | 1 | Sessions |
| 8 | GET | `/api/vendors` | Public | 1 | Menu |
| 9 | GET | `/api/vendors/:id/menu` | Public | 1 | Menu |
| 10 | GET | `/api/menu-items/:id` | Public | 1 | Menu |
| 11 | GET | `/api/vendors/:id/categories` | Public | 1 | Menu |
| 12 | POST | `/api/orders` | Session | 1 | Orders |
| 13 | GET | `/api/orders/:id` | Auth | 1 | Orders |
| 14 | GET | `/api/orders/:id/status` | Public | 1 | Orders |
| 15 | PATCH | `/api/orders/:id/cancel` | Auth | 1 | Orders |
| 16 | POST | `/api/orders/:id/items` | Auth | 1 | Orders |
| 17 | GET | `/api/kds/orders` | Vendor | 1 | KDS |
| 18 | PATCH | `/api/kds/items/:id/accept` | Vendor | 1 | KDS |
| 19 | PATCH | `/api/kds/items/:id/preparing` | Vendor | 1 | KDS |
| 20 | PATCH | `/api/kds/items/:id/ready` | Vendor | 1 | KDS |
| 21 | PATCH | `/api/kds/items/:id/complete` | Vendor | 1 | KDS |
| 22 | PATCH | `/api/kds/items/:id/reject` | Vendor | 1 | KDS |
| 23 | GET | `/api/kds/queue-stats` | Vendor | 1 | KDS |
| 24 | GET | `/api/vendor/dashboard` | Vendor | 2 | Vendor |
| 25 | GET | `/api/vendor/orders` | Vendor | 2 | Vendor |
| 26 | GET | `/api/vendor/orders/:id` | Vendor | 2 | Vendor |
| 27 | GET | `/api/vendor/menu-items` | Vendor | 2 | Vendor |
| 28 | POST | `/api/vendor/menu-items` | Vendor | 2 | Vendor |
| 29 | PUT | `/api/vendor/menu-items/:id` | Vendor | 2 | Vendor |
| 30 | DELETE | `/api/vendor/menu-items/:id` | Vendor | 2 | Vendor |
| 31 | PATCH | `/api/vendor/menu-items/:id/availability` | Vendor | 2 | Vendor |
| 32 | POST | `/api/vendor/menu-items/:id/image` | Vendor | 2 | Vendor |
| 33 | GET | `/api/vendor/categories` | Vendor | 2 | Vendor |
| 34 | POST | `/api/vendor/categories` | Vendor | 2 | Vendor |
| 35 | PUT | `/api/vendor/categories/:id` | Vendor | 2 | Vendor |
| 36 | POST | `/api/vendor/modifier-groups` | Vendor | 2 | Vendor |
| 37 | PUT | `/api/vendor/modifier-groups/:id` | Vendor | 2 | Vendor |
| 38 | POST | `/api/vendor/modifier-groups/:id/modifiers` | Vendor | 2 | Vendor |
| 39 | DELETE | `/api/vendor/modifier-groups/:id/modifiers/:modId` | Vendor | 2 | Vendor |
| 40 | GET | `/api/vendor/settings` | Vendor | 2 | Vendor |
| 41 | PUT | `/api/vendor/settings` | Vendor | 2 | Vendor |
| 42 | PATCH | `/api/vendor/status` | Vendor | 2 | Vendor |
| 43 | GET | `/api/display/board` | Public | 2 | Orders |
