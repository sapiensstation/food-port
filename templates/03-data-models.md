# Food Village POS — Data Models

> **Database:** PostgreSQL via Supabase
> **ORM:** Prisma (NestJS backend)
> **Multi-tenancy:** Shared database, tenant isolation via `vendor_id` + Row Level Security (RLS)
> **Key principle:** Append-only ledger for financial data. Soft-delete everywhere. Audit trail on every mutation.

---

## Table of Contents

1. [Entity Relationship Overview](#1-entity-relationship-overview)
2. [Core Tables](#2-core-tables)
3. [Menu System Tables](#3-menu-system-tables)
4. [Order System Tables](#4-order-system-tables)
5. [Payment & Finance Tables](#5-payment--finance-tables)
6. [Notification Tables](#6-notification-tables)
7. [Promotion Tables](#7-promotion-tables)
8. [System Tables](#8-system-tables)
9. [Enums & Types](#9-enums--types)
10. [Row Level Security Policies](#10-row-level-security-policies)
11. [Indexes](#11-indexes)
12. [Database Functions & Triggers](#12-database-functions--triggers)
13. [Prisma Schema Reference](#13-prisma-schema-reference)

---

## 1. Entity Relationship Overview

```
                        ┌──────────────┐
                        │  food_village │  (global config, 1 row)
                        └──────┬───────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
              ┌─────┴────┐ ┌──┴───┐ ┌───┴────┐
              │  vendors  │ │users │ │tables  │
              └─────┬────┘ └──┬───┘ └───┬────┘
                    │         │         │
        ┌───────────┼─────┐   │         │
        │           │     │   │         │
  ┌─────┴──┐  ┌────┴──┐  │   │         │
  │menu_   │  │menu_  │  │   │         │
  │categories│ │items  │  │   │         │
  └────────┘  └───┬───┘  │   │         │
                  │       │   │         │
           ┌──────┴──┐    │   │         │
           │modifier_│    │   │         │
           │groups   │    │   │         │
           └────┬────┘    │   │         │
                │         │   │         │
           ┌────┴─────┐   │   │         │
           │modifiers │   │   │         │
           └──────────┘   │   │         │
                          │   │         │
                    ┌─────┴───┴─────────┴──┐
                    │       orders          │
                    └─────────┬────────────┘
                              │
                    ┌─────────┼──────────────┐
                    │         │              │
              ┌─────┴────┐ ┌─┴──────┐ ┌────┴─────┐
              │order_    │ │payments│ │order_    │
              │items     │ │        │ │status_   │
              └─────┬────┘ └───┬────┘ │history   │
                    │          │      └──────────┘
              ┌─────┴──────┐   │
              │order_item_ │   │
              │modifiers   │ ┌─┴──────────┐
              └────────────┘ │payment_    │
                             │splits      │
                             └──────┬─────┘
                                    │
                             ┌──────┴─────┐
                             │ledger_     │
                             │entries     │
                             └────────────┘
```

---

## 2. Core Tables

### `food_village`

Global configuration. Single row.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, default `gen_random_uuid()` | |
| `name` | `VARCHAR(255)` | NOT NULL | Food village name |
| `slug` | `VARCHAR(100)` | UNIQUE, NOT NULL | URL-safe identifier |
| `logo_url` | `TEXT` | | Branding logo |
| `address` | `TEXT` | NOT NULL | Physical address |
| `city` | `VARCHAR(100)` | | |
| `state` | `VARCHAR(50)` | | |
| `zip` | `VARCHAR(20)` | | |
| `country` | `VARCHAR(2)` | DEFAULT 'US' | ISO country code |
| `timezone` | `VARCHAR(50)` | DEFAULT 'America/Chicago' | |
| `currency` | `VARCHAR(3)` | DEFAULT 'USD' | ISO currency code |
| `tax_rate` | `DECIMAL(5,4)` | DEFAULT 0.0825 | Default tax rate (8.25% for Oklahoma) |
| `default_commission_rate` | `DECIMAL(5,4)` | DEFAULT 0.1500 | Default vendor commission |
| `operating_hours` | `JSONB` | | `{ mon: { open: "10:00", close: "22:00" }, ... }` |
| `settings` | `JSONB` | DEFAULT '{}' | Misc global settings |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `vendors`

Each booth / restaurant tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `name` | `VARCHAR(255)` | NOT NULL | Booth display name |
| `slug` | `VARCHAR(100)` | UNIQUE, NOT NULL | URL-safe identifier |
| `description` | `TEXT` | | Short description / tagline |
| `cuisine_type` | `VARCHAR(100)` | | "Italian", "Asian Fusion", etc. |
| `logo_url` | `TEXT` | | |
| `banner_url` | `TEXT` | | |
| `booth_number` | `INTEGER` | UNIQUE, NOT NULL | Physical booth number (1-10) |
| `color` | `VARCHAR(7)` | NOT NULL | Hex color for UI identification |
| `commission_rate` | `DECIMAL(5,4)` | NOT NULL | Override or use global default |
| `status` | `vendor_status` | DEFAULT 'active' | `active`, `suspended`, `onboarding`, `closed` |
| `is_online` | `BOOLEAN` | DEFAULT true | Real-time availability toggle |
| `operating_hours` | `JSONB` | | Override global hours per vendor |
| `avg_prep_time_minutes` | `INTEGER` | DEFAULT 10 | Default prep time estimate |
| `stripe_account_id` | `VARCHAR(255)` | | Stripe Connect connected account ID |
| `contact_email` | `VARCHAR(255)` | | |
| `contact_phone` | `VARCHAR(20)` | | |
| `settings` | `JSONB` | DEFAULT '{}' | Vendor-specific settings |
| `onboarded_at` | `TIMESTAMPTZ` | | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `deleted_at` | `TIMESTAMPTZ` | | Soft delete |

---

### `users`

All system users: admins, vendor staff, waiters.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | Maps to Supabase Auth `auth.users.id` |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | |
| `full_name` | `VARCHAR(255)` | NOT NULL | |
| `avatar_url` | `TEXT` | | |
| `role` | `user_role` | NOT NULL | See enum definition |
| `vendor_id` | `UUID` | FK → vendors.id, NULLABLE | NULL for admin/super_admin/waiter |
| `pin_code` | `VARCHAR(6)` | | Quick login PIN for kitchen staff |
| `phone` | `VARCHAR(20)` | | |
| `is_active` | `BOOLEAN` | DEFAULT true | |
| `last_login_at` | `TIMESTAMPTZ` | | |
| `permissions` | `TEXT[]` | DEFAULT '{}' | Granular permissions array |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `deleted_at` | `TIMESTAMPTZ` | | Soft delete |

**Index:** `UNIQUE (vendor_id, pin_code) WHERE pin_code IS NOT NULL` — PINs unique per vendor.

---

### `tables`

Physical tables in the food court.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `table_number` | `INTEGER` | UNIQUE, NOT NULL | Display number |
| `label` | `VARCHAR(50)` | | "Patio 1", "Window Seat", etc. |
| `qr_code` | `TEXT` | | QR code content (URL with table ID) |
| `seats` | `INTEGER` | DEFAULT 4 | Capacity |
| `zone` | `VARCHAR(50)` | | "Indoor", "Outdoor", "Bar" |
| `status` | `table_status` | DEFAULT 'available' | `available`, `occupied`, `reserved`, `maintenance` |
| `is_active` | `BOOLEAN` | DEFAULT true | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `sessions`

Ordering session: ties a customer visit to a table and waiter.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `table_id` | `UUID` | FK → tables.id, NOT NULL | |
| `waiter_id` | `UUID` | FK → users.id | |
| `status` | `session_status` | DEFAULT 'active' | `active`, `completed`, `abandoned` |
| `guest_count` | `INTEGER` | | |
| `started_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `completed_at` | `TIMESTAMPTZ` | | |
| `metadata` | `JSONB` | DEFAULT '{}' | Device info, etc. |

---

## 3. Menu System Tables

### `menu_categories`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `vendor_id` | `UUID` | FK → vendors.id, NOT NULL | Tenant isolation |
| `name` | `VARCHAR(100)` | NOT NULL | "Appetizers", "Mains", "Drinks" |
| `slug` | `VARCHAR(100)` | NOT NULL | |
| `description` | `TEXT` | | |
| `sort_order` | `INTEGER` | DEFAULT 0 | Display order |
| `is_active` | `BOOLEAN` | DEFAULT true | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Index:** `UNIQUE (vendor_id, slug)`

---

### `menu_items`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `vendor_id` | `UUID` | FK → vendors.id, NOT NULL | Tenant isolation |
| `category_id` | `UUID` | FK → menu_categories.id, NOT NULL | |
| `name` | `VARCHAR(255)` | NOT NULL | |
| `slug` | `VARCHAR(255)` | NOT NULL | |
| `description` | `TEXT` | | |
| `price` | `DECIMAL(10,2)` | NOT NULL | Base price |
| `image_url` | `TEXT` | | |
| `prep_time_minutes` | `INTEGER` | | Estimated prep time |
| `calories` | `INTEGER` | | |
| `is_available` | `BOOLEAN` | DEFAULT true | Real-time sold-out toggle |
| `is_active` | `BOOLEAN` | DEFAULT true | Long-term active/inactive |
| `is_featured` | `BOOLEAN` | DEFAULT false | Highlighted on menu |
| `dietary_tags` | `TEXT[]` | DEFAULT '{}' | `['vegan', 'gluten_free', 'spicy', 'halal', 'nut_free']` |
| `allergens` | `TEXT[]` | DEFAULT '{}' | `['dairy', 'gluten', 'nuts', 'soy', 'eggs']` |
| `sort_order` | `INTEGER` | DEFAULT 0 | |
| `tax_category` | `VARCHAR(50)` | DEFAULT 'food' | `food`, `beverage`, `alcohol`, `packaged` |
| `approval_status` | `approval_status` | DEFAULT 'approved' | `pending`, `approved`, `rejected` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `deleted_at` | `TIMESTAMPTZ` | | Soft delete |

**Index:** `UNIQUE (vendor_id, slug)`, `(vendor_id, category_id, is_active, is_available)`

---

### `menu_schedules`

Time-based menu visibility (breakfast, lunch, dinner, happy hour).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `vendor_id` | `UUID` | FK → vendors.id, NOT NULL | |
| `name` | `VARCHAR(100)` | NOT NULL | "Breakfast", "Lunch", "Happy Hour" |
| `start_time` | `TIME` | NOT NULL | |
| `end_time` | `TIME` | NOT NULL | |
| `days_of_week` | `INTEGER[]` | NOT NULL | `[1,2,3,4,5]` (Mon-Fri) |
| `menu_item_ids` | `UUID[]` | | If NULL, all items visible |
| `is_active` | `BOOLEAN` | DEFAULT true | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `modifier_groups`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `vendor_id` | `UUID` | FK → vendors.id, NOT NULL | |
| `menu_item_id` | `UUID` | FK → menu_items.id, NOT NULL | |
| `name` | `VARCHAR(100)` | NOT NULL | "Size", "Add-ons", "Sauces" |
| `description` | `TEXT` | | |
| `selection_type` | `selection_type` | NOT NULL | `single` (radio), `multi` (checkbox) |
| `min_selections` | `INTEGER` | DEFAULT 0 | 0 = optional, 1+ = required |
| `max_selections` | `INTEGER` | | NULL = unlimited |
| `sort_order` | `INTEGER` | DEFAULT 0 | |
| `is_active` | `BOOLEAN` | DEFAULT true | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `modifiers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `modifier_group_id` | `UUID` | FK → modifier_groups.id, NOT NULL | |
| `vendor_id` | `UUID` | FK → vendors.id, NOT NULL | Denormalized for RLS |
| `name` | `VARCHAR(100)` | NOT NULL | "Extra Cheese", "Large Size" |
| `price_adjustment` | `DECIMAL(10,2)` | DEFAULT 0.00 | Can be positive or negative |
| `is_available` | `BOOLEAN` | DEFAULT true | |
| `is_default` | `BOOLEAN` | DEFAULT false | Pre-selected |
| `sort_order` | `INTEGER` | DEFAULT 0 | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

## 4. Order System Tables

### `orders`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `token_number` | `INTEGER` | NOT NULL | Daily sequential, resets at midnight |
| `session_id` | `UUID` | FK → sessions.id | |
| `table_id` | `UUID` | FK → tables.id | |
| `waiter_id` | `UUID` | FK → users.id | |
| `status` | `order_status` | DEFAULT 'pending' | Aggregate status |
| `subtotal` | `DECIMAL(10,2)` | NOT NULL | Pre-tax total |
| `tax_amount` | `DECIMAL(10,2)` | NOT NULL | |
| `discount_amount` | `DECIMAL(10,2)` | DEFAULT 0.00 | Promotion discounts |
| `total` | `DECIMAL(10,2)` | NOT NULL | Final amount charged |
| `payment_method` | `payment_method` | | `card`, `cash`, `split` |
| `payment_status` | `payment_status` | DEFAULT 'pending' | |
| `promotion_id` | `UUID` | FK → promotions.id | Applied promotion |
| `special_instructions` | `TEXT` | | Order-level notes |
| `estimated_ready_at` | `TIMESTAMPTZ` | | Calculated max prep time |
| `idempotency_key` | `VARCHAR(255)` | UNIQUE | Prevents duplicate orders |
| `order_source` | `VARCHAR(50)` | DEFAULT 'ipad' | `ipad`, `kiosk`, `qr`, `delivery` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `completed_at` | `TIMESTAMPTZ` | | When all items completed |

**Index:** `(token_number, DATE(created_at))` — for daily token lookup.
**Index:** `(status, created_at)` — for active order queries.

---

### `order_items`

Each line item, tied to a specific vendor. This is the table that routes to KDS.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `order_id` | `UUID` | FK → orders.id, NOT NULL | |
| `vendor_id` | `UUID` | FK → vendors.id, NOT NULL | Which booth prepares this |
| `menu_item_id` | `UUID` | FK → menu_items.id, NOT NULL | |
| `item_name` | `VARCHAR(255)` | NOT NULL | Snapshot at order time |
| `quantity` | `INTEGER` | NOT NULL, CHECK > 0 | |
| `unit_price` | `DECIMAL(10,2)` | NOT NULL | Snapshot at order time |
| `modifier_total` | `DECIMAL(10,2)` | DEFAULT 0.00 | Sum of modifier prices |
| `line_total` | `DECIMAL(10,2)` | NOT NULL | `(unit_price + modifier_total) * quantity` |
| `tax_amount` | `DECIMAL(10,2)` | DEFAULT 0.00 | Per-item tax |
| `tax_category` | `VARCHAR(50)` | | Snapshot from menu item |
| `status` | `order_item_status` | DEFAULT 'pending' | Individual item status |
| `special_instructions` | `TEXT` | | Item-level notes |
| `prep_started_at` | `TIMESTAMPTZ` | | When vendor starts preparing |
| `ready_at` | `TIMESTAMPTZ` | | When marked ready |
| `picked_up_at` | `TIMESTAMPTZ` | | When customer picks up |
| `rejected_reason` | `TEXT` | | If vendor rejects |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Index:** `(vendor_id, status, created_at)` — KDS query: "show me my active items".
**Index:** `(order_id)` — fetch all items for an order.

---

### `order_item_modifiers`

Snapshot of modifiers selected for each order item.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `order_item_id` | `UUID` | FK → order_items.id, NOT NULL | |
| `modifier_id` | `UUID` | FK → modifiers.id | Reference (may be null if deleted) |
| `modifier_name` | `VARCHAR(100)` | NOT NULL | Snapshot |
| `modifier_group_name` | `VARCHAR(100)` | NOT NULL | Snapshot |
| `price_adjustment` | `DECIMAL(10,2)` | NOT NULL | Snapshot |
| `quantity` | `INTEGER` | DEFAULT 1 | |

---

### `order_status_history`

Audit trail for every status change on an order or item.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `order_id` | `UUID` | FK → orders.id, NOT NULL | |
| `order_item_id` | `UUID` | FK → order_items.id | NULL for order-level changes |
| `from_status` | `VARCHAR(50)` | | Previous status |
| `to_status` | `VARCHAR(50)` | NOT NULL | New status |
| `changed_by` | `UUID` | FK → users.id | Who made the change |
| `reason` | `TEXT` | | e.g., rejection reason |
| `metadata` | `JSONB` | DEFAULT '{}' | Extra context |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Index:** `(order_id, created_at)` — timeline query.

---

## 5. Payment & Finance Tables

### `payments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `order_id` | `UUID` | FK → orders.id, NOT NULL | |
| `amount` | `DECIMAL(10,2)` | NOT NULL | Total charged |
| `currency` | `VARCHAR(3)` | DEFAULT 'USD' | |
| `payment_method` | `payment_method` | NOT NULL | |
| `status` | `payment_status` | DEFAULT 'pending' | |
| `stripe_payment_intent_id` | `VARCHAR(255)` | | Stripe PI ID |
| `stripe_charge_id` | `VARCHAR(255)` | | |
| `stripe_transfer_group` | `VARCHAR(255)` | | Groups vendor transfers |
| `card_last_four` | `VARCHAR(4)` | | For receipt display |
| `card_brand` | `VARCHAR(20)` | | "visa", "mastercard" |
| `receipt_url` | `TEXT` | | Stripe receipt URL |
| `refunded_amount` | `DECIMAL(10,2)` | DEFAULT 0.00 | |
| `metadata` | `JSONB` | DEFAULT '{}' | |
| `paid_at` | `TIMESTAMPTZ` | | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `payment_splits`

How each payment is divided across vendors. Created after successful payment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `payment_id` | `UUID` | FK → payments.id, NOT NULL | |
| `order_id` | `UUID` | FK → orders.id, NOT NULL | |
| `vendor_id` | `UUID` | FK → vendors.id, NOT NULL | |
| `gross_amount` | `DECIMAL(10,2)` | NOT NULL | Vendor's portion before commission |
| `commission_rate` | `DECIMAL(5,4)` | NOT NULL | Rate at time of transaction |
| `commission_amount` | `DECIMAL(10,2)` | NOT NULL | Platform commission |
| `tax_amount` | `DECIMAL(10,2)` | DEFAULT 0.00 | Tax collected for this vendor's items |
| `net_amount` | `DECIMAL(10,2)` | NOT NULL | `gross - commission` |
| `stripe_transfer_id` | `VARCHAR(255)` | | Stripe Transfer ID |
| `transfer_status` | `VARCHAR(50)` | DEFAULT 'pending' | `pending`, `completed`, `failed` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `vendor_wallets`

Running balance for each vendor. Updated via ledger entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `vendor_id` | `UUID` | FK → vendors.id, UNIQUE, NOT NULL | One wallet per vendor |
| `balance` | `DECIMAL(12,2)` | DEFAULT 0.00 | Current available balance |
| `pending_balance` | `DECIMAL(12,2)` | DEFAULT 0.00 | Not yet settled |
| `total_earned` | `DECIMAL(12,2)` | DEFAULT 0.00 | Lifetime earnings |
| `total_commission_paid` | `DECIMAL(12,2)` | DEFAULT 0.00 | Lifetime commission |
| `total_payouts` | `DECIMAL(12,2)` | DEFAULT 0.00 | Lifetime payouts |
| `last_payout_at` | `TIMESTAMPTZ` | | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `ledger_entries`

**APPEND-ONLY.** Every financial event is a ledger entry. Never update or delete.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `vendor_id` | `UUID` | FK → vendors.id, NOT NULL | |
| `type` | `ledger_type` | NOT NULL | See enum |
| `amount` | `DECIMAL(12,2)` | NOT NULL | Positive = credit, negative = debit |
| `balance_after` | `DECIMAL(12,2)` | NOT NULL | Running balance after this entry |
| `reference_type` | `VARCHAR(50)` | | `payment_split`, `payout`, `refund`, `adjustment` |
| `reference_id` | `UUID` | | FK to the source record |
| `description` | `TEXT` | | Human-readable description |
| `metadata` | `JSONB` | DEFAULT '{}' | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Immutable |

**Index:** `(vendor_id, created_at DESC)` — wallet transaction history.
**Constraint:** This table has NO update/delete permissions. Insert only.

---

### `payouts`

Scheduled or manual payouts to vendor bank accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `vendor_id` | `UUID` | FK → vendors.id, NOT NULL | |
| `amount` | `DECIMAL(12,2)` | NOT NULL | |
| `currency` | `VARCHAR(3)` | DEFAULT 'USD' | |
| `status` | `payout_status` | DEFAULT 'pending' | |
| `stripe_payout_id` | `VARCHAR(255)` | | |
| `period_start` | `DATE` | | Settlement period start |
| `period_end` | `DATE` | | Settlement period end |
| `initiated_by` | `UUID` | FK → users.id | |
| `processed_at` | `TIMESTAMPTZ` | | |
| `failed_reason` | `TEXT` | | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `refunds`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `payment_id` | `UUID` | FK → payments.id, NOT NULL | |
| `order_id` | `UUID` | FK → orders.id, NOT NULL | |
| `order_item_id` | `UUID` | FK → order_items.id | NULL for full refund |
| `vendor_id` | `UUID` | FK → vendors.id | Which vendor's item is refunded |
| `amount` | `DECIMAL(10,2)` | NOT NULL | |
| `reason` | `TEXT` | NOT NULL | |
| `refund_type` | `VARCHAR(20)` | NOT NULL | `full`, `partial`, `item` |
| `status` | `VARCHAR(20)` | DEFAULT 'pending' | `pending`, `processed`, `failed` |
| `stripe_refund_id` | `VARCHAR(255)` | | |
| `initiated_by` | `UUID` | FK → users.id | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `processed_at` | `TIMESTAMPTZ` | | |

---

## 6. Notification Tables

### `notifications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id | NULL for broadcast |
| `vendor_id` | `UUID` | FK → vendors.id | Scoped to vendor |
| `type` | `VARCHAR(100)` | NOT NULL | `order.created`, `order.ready`, etc. |
| `title` | `VARCHAR(255)` | NOT NULL | |
| `body` | `TEXT` | | |
| `data` | `JSONB` | DEFAULT '{}' | Payload for deep linking |
| `channel` | `VARCHAR(50)` | NOT NULL | `in_app`, `push`, `sms`, `email` |
| `is_read` | `BOOLEAN` | DEFAULT false | |
| `read_at` | `TIMESTAMPTZ` | | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `notification_preferences`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id, NOT NULL | |
| `event_type` | `VARCHAR(100)` | NOT NULL | |
| `channel` | `VARCHAR(50)` | NOT NULL | |
| `enabled` | `BOOLEAN` | DEFAULT true | |

**Index:** `UNIQUE (user_id, event_type, channel)`

---

## 7. Promotion Tables

### `promotions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `name` | `VARCHAR(255)` | NOT NULL | |
| `description` | `TEXT` | | |
| `type` | `promotion_type` | NOT NULL | See enum |
| `discount_type` | `VARCHAR(20)` | NOT NULL | `percentage`, `fixed`, `free_item` |
| `discount_value` | `DECIMAL(10,2)` | NOT NULL | % or $ amount |
| `min_order_amount` | `DECIMAL(10,2)` | | Minimum cart total |
| `max_discount_amount` | `DECIMAL(10,2)` | | Cap on discount |
| `code` | `VARCHAR(50)` | UNIQUE | Promo code (NULL for auto-applied) |
| `vendor_ids` | `UUID[]` | | NULL = all vendors, or specific vendors |
| `menu_item_ids` | `UUID[]` | | Specific items (for combos) |
| `start_date` | `TIMESTAMPTZ` | NOT NULL | |
| `end_date` | `TIMESTAMPTZ` | NOT NULL | |
| `start_time` | `TIME` | | For happy hour (daily recurrence) |
| `end_time` | `TIME` | | |
| `days_of_week` | `INTEGER[]` | | `[1,2,3,4,5]` for weekdays |
| `max_uses` | `INTEGER` | | Total redemption limit |
| `current_uses` | `INTEGER` | DEFAULT 0 | |
| `is_active` | `BOOLEAN` | DEFAULT true | |
| `created_by` | `UUID` | FK → users.id | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `promotion_uses`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `promotion_id` | `UUID` | FK → promotions.id, NOT NULL | |
| `order_id` | `UUID` | FK → orders.id, NOT NULL | |
| `discount_applied` | `DECIMAL(10,2)` | NOT NULL | Actual discount given |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

## 8. System Tables

### `audit_log`

Every significant action in the system. Append-only.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id | Who did it |
| `vendor_id` | `UUID` | FK → vendors.id | Tenant context (if applicable) |
| `action` | `VARCHAR(100)` | NOT NULL | `menu_item.created`, `order.refunded`, etc. |
| `entity_type` | `VARCHAR(50)` | NOT NULL | `menu_item`, `order`, `vendor`, etc. |
| `entity_id` | `UUID` | | Which record was affected |
| `changes` | `JSONB` | | `{ before: {...}, after: {...} }` |
| `ip_address` | `INET` | | |
| `user_agent` | `TEXT` | | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Index:** `(entity_type, entity_id, created_at)` — "show me history for this record".
**Index:** `(user_id, created_at)` — "show me what this user did".

---

### `token_sequences`

Daily token number generator.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `date` | `DATE` | UNIQUE, NOT NULL | |
| `last_token` | `INTEGER` | DEFAULT 0 | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Usage:** `UPDATE token_sequences SET last_token = last_token + 1 WHERE date = CURRENT_DATE RETURNING last_token`

---

### `devices`

Registered hardware devices (iPads, KDS tablets, printers).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `vendor_id` | `UUID` | FK → vendors.id | NULL for shared devices |
| `name` | `VARCHAR(100)` | NOT NULL | "Kitchen iPad", "Receipt Printer 1" |
| `type` | `VARCHAR(50)` | NOT NULL | `ipad_ordering`, `kds_tablet`, `receipt_printer`, `display_tv` |
| `device_identifier` | `VARCHAR(255)` | | Hardware ID or serial |
| `status` | `VARCHAR(20)` | DEFAULT 'active' | `active`, `offline`, `maintenance` |
| `last_heartbeat_at` | `TIMESTAMPTZ` | | |
| `config` | `JSONB` | DEFAULT '{}' | Device-specific config |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

## 9. Enums & Types

```sql
-- Vendor status
CREATE TYPE vendor_status AS ENUM ('active', 'suspended', 'onboarding', 'closed');

-- User roles
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'vendor_owner',
  'vendor_manager',
  'vendor_kitchen',
  'vendor_cashier',
  'waiter'
);

-- Table status
CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved', 'maintenance');

-- Session status
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned');

-- Modifier selection type
CREATE TYPE selection_type AS ENUM ('single', 'multi');

-- Approval status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Order status (aggregate)
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'partially_ready',
  'ready',
  'completed',
  'cancelled'
);

-- Order item status (per-vendor)
CREATE TYPE order_item_status AS ENUM (
  'pending',
  'accepted',
  'preparing',
  'ready',
  'picked_up',
  'completed',
  'rejected',
  'cancelled'
);

-- Payment method
CREATE TYPE payment_method AS ENUM ('card', 'cash', 'split');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');

-- Ledger entry type
CREATE TYPE ledger_type AS ENUM (
  'sale_credit',
  'commission_debit',
  'payout_debit',
  'refund_debit',
  'adjustment_credit',
  'adjustment_debit'
);

-- Payout status
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Promotion type
CREATE TYPE promotion_type AS ENUM (
  'vendor_discount',
  'cross_vendor_combo',
  'happy_hour',
  'first_order',
  'coupon_code',
  'free_item'
);
```

---

## 10. Row Level Security Policies

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Vendor can only see their own data
CREATE POLICY vendor_isolation ON menu_items
  FOR ALL
  USING (vendor_id = auth.jwt() -> 'vendor_id');

CREATE POLICY vendor_isolation ON order_items
  FOR ALL
  USING (vendor_id = auth.jwt() -> 'vendor_id');

CREATE POLICY vendor_isolation ON ledger_entries
  FOR SELECT
  USING (vendor_id = auth.jwt() -> 'vendor_id');

-- Admin can see everything
CREATE POLICY admin_full_access ON menu_items
  FOR ALL
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin'));

CREATE POLICY admin_full_access ON order_items
  FOR ALL
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin'));

-- Public read access for customer-facing menu
CREATE POLICY public_menu_read ON menu_items
  FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY public_vendor_read ON vendors
  FOR SELECT
  USING (status = 'active' AND deleted_at IS NULL);

-- Ledger entries are insert-only (no update, no delete)
CREATE POLICY ledger_insert_only ON ledger_entries
  FOR INSERT
  WITH CHECK (true);

-- Revoke UPDATE and DELETE on ledger_entries from all roles
REVOKE UPDATE, DELETE ON ledger_entries FROM PUBLIC;
```

---

## 11. Indexes

```sql
-- Performance-critical indexes

-- Orders: active orders lookup
CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC)
  WHERE status NOT IN ('completed', 'cancelled');

-- Order items: KDS query (vendor's active items)
CREATE INDEX idx_order_items_vendor_status ON order_items (vendor_id, status, created_at)
  WHERE status NOT IN ('completed', 'picked_up', 'cancelled');

-- Order items: realtime status updates
CREATE INDEX idx_order_items_order_status ON order_items (order_id, status);

-- Token lookup: find order by today's token
CREATE INDEX idx_orders_token_date ON orders (token_number, (created_at::date));

-- Menu items: customer-facing menu query
CREATE INDEX idx_menu_items_vendor_active ON menu_items (vendor_id, category_id, sort_order)
  WHERE is_active = true AND is_available = true AND deleted_at IS NULL;

-- Ledger: vendor transaction history
CREATE INDEX idx_ledger_vendor_created ON ledger_entries (vendor_id, created_at DESC);

-- Audit log: entity history
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id, created_at DESC);

-- Audit log: user activity
CREATE INDEX idx_audit_user ON audit_log (user_id, created_at DESC);

-- Payments: by order
CREATE INDEX idx_payments_order ON payments (order_id);

-- Payment splits: by vendor for financial reports
CREATE INDEX idx_payment_splits_vendor ON payment_splits (vendor_id, created_at DESC);

-- Sessions: active sessions by table
CREATE INDEX idx_sessions_table_active ON sessions (table_id)
  WHERE status = 'active';

-- Notifications: unread per user
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, created_at DESC)
  WHERE is_read = false;
```

---

## 12. Database Functions & Triggers

### Auto-update `updated_at` Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (repeat for orders, order_items, menu_items, users, etc.)
```

### Token Number Generator

```sql
CREATE OR REPLACE FUNCTION next_token_number()
RETURNS INTEGER AS $$
DECLARE
  next_token INTEGER;
BEGIN
  INSERT INTO token_sequences (date, last_token)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (date)
  DO UPDATE SET last_token = token_sequences.last_token + 1,
               updated_at = NOW()
  RETURNING last_token INTO next_token;

  RETURN next_token;
END;
$$ LANGUAGE plpgsql;
```

### Order Aggregate Status Update

```sql
-- When an order_item status changes, recalculate the parent order's aggregate status
CREATE OR REPLACE FUNCTION update_order_aggregate_status()
RETURNS TRIGGER AS $$
DECLARE
  item_statuses TEXT[];
  new_order_status order_status;
BEGIN
  SELECT ARRAY_AGG(DISTINCT status::TEXT) INTO item_statuses
  FROM order_items WHERE order_id = NEW.order_id;

  new_order_status = CASE
    WHEN 'pending' = ANY(item_statuses) AND array_length(item_statuses, 1) = 1 THEN 'pending'
    WHEN 'ready' = ALL(SELECT UNNEST(item_statuses) EXCEPT SELECT 'completed' UNION SELECT 'picked_up') THEN 'ready'
    WHEN 'ready' = ANY(item_statuses) THEN 'partially_ready'
    WHEN 'completed' = ALL(SELECT UNNEST(item_statuses)) OR 'picked_up' = ALL(SELECT UNNEST(item_statuses)) THEN 'completed'
    ELSE 'confirmed'
  END;

  UPDATE orders SET status = new_order_status, updated_at = NOW()
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_item_status_change
  AFTER UPDATE OF status ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_order_aggregate_status();
```

### Audit Log Trigger (Generic)

```sql
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, changes, created_at)
  VALUES (
    current_setting('app.current_user_id', true)::UUID,
    TG_OP || '.' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'before', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
      'after', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    ),
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

---

## 13. Prisma Schema Reference

```prisma
// prisma/schema.prisma — abbreviated, showing key models and relations

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Vendor {
  id               String   @id @default(uuid())
  name             String
  slug             String   @unique
  boothNumber      Int      @unique @map("booth_number")
  color            String
  commissionRate   Decimal  @map("commission_rate") @db.Decimal(5, 4)
  status           String   @default("active")
  isOnline         Boolean  @default(true) @map("is_online")
  stripeAccountId  String?  @map("stripe_account_id")

  menuCategories   MenuCategory[]
  menuItems        MenuItem[]
  orderItems       OrderItem[]
  paymentSplits    PaymentSplit[]
  ledgerEntries    LedgerEntry[]
  wallet           VendorWallet?
  users            User[]
  devices          Device[]

  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  deletedAt        DateTime? @map("deleted_at")

  @@map("vendors")
}

model Order {
  id                String   @id @default(uuid())
  tokenNumber       Int      @map("token_number")
  sessionId         String?  @map("session_id")
  tableId           String?  @map("table_id")
  waiterId          String?  @map("waiter_id")
  status            String   @default("pending")
  subtotal          Decimal  @db.Decimal(10, 2)
  taxAmount         Decimal  @map("tax_amount") @db.Decimal(10, 2)
  discountAmount    Decimal  @default(0) @map("discount_amount") @db.Decimal(10, 2)
  total             Decimal  @db.Decimal(10, 2)
  paymentMethod     String?  @map("payment_method")
  paymentStatus     String   @default("pending") @map("payment_status")
  idempotencyKey    String   @unique @map("idempotency_key")

  items             OrderItem[]
  payments          Payment[]
  statusHistory     OrderStatusHistory[]
  session           Session?  @relation(fields: [sessionId], references: [id])
  table             Table?    @relation(fields: [tableId], references: [id])
  waiter            User?     @relation(fields: [waiterId], references: [id])

  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  completedAt       DateTime? @map("completed_at")

  @@index([status, createdAt])
  @@index([tokenNumber, createdAt])
  @@map("orders")
}

model OrderItem {
  id                   String   @id @default(uuid())
  orderId              String   @map("order_id")
  vendorId             String   @map("vendor_id")
  menuItemId           String   @map("menu_item_id")
  itemName             String   @map("item_name")
  quantity             Int
  unitPrice            Decimal  @map("unit_price") @db.Decimal(10, 2)
  modifierTotal        Decimal  @default(0) @map("modifier_total") @db.Decimal(10, 2)
  lineTotal            Decimal  @map("line_total") @db.Decimal(10, 2)
  status               String   @default("pending")
  specialInstructions  String?  @map("special_instructions")

  order                Order    @relation(fields: [orderId], references: [id])
  vendor               Vendor   @relation(fields: [vendorId], references: [id])
  menuItem             MenuItem @relation(fields: [menuItemId], references: [id])
  modifiers            OrderItemModifier[]

  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  @@index([vendorId, status, createdAt])
  @@index([orderId])
  @@map("order_items")
}
```
