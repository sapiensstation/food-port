# Food Village POS — Phase 3 & 4 API Contract

> **Methodology:** API contract doc → NestJS backend → Frontend component doc → Next.js frontend
> **Auth:** All admin endpoints require `Authorization: Bearer <jwt>` with role `super_admin` or `admin`

---

## Admin Portal — Screen → Component → Endpoint Map

### Screen: Admin Login (`/admin/login`)

| Component | Method | Endpoint | DTO | Request | Response | Description |
|-----------|--------|----------|-----|---------|----------|-------------|
| AdminLoginForm | POST | `/api/auth/login` | `LoginDto` | `{ email, password }` | `{ token, user: { id, role, name } }` | Reuse existing auth; guard checks role |

---

### Screen: Admin Overview Dashboard (`/admin`)

| Component | Method | Endpoint | DTO | Request | Response | Description |
|-----------|--------|----------|-----|---------|----------|-------------|
| StatsBar | GET | `/api/admin/overview` | — | — | `{ orders_today, revenue_today, active_vendors, avg_prep_time, orders_this_week, revenue_this_week }` | Aggregated village-wide stats |
| RevenueChart | GET | `/api/admin/analytics/revenue` | — | `?from&to&interval=day\|hour` | `[{ date, revenue, order_count }]` | Revenue time series |
| VendorLeaderboard | GET | `/api/admin/analytics/vendors` | — | `?from&to` | `[{ vendor_id, vendor_name, booth_color, revenue, order_count, avg_prep_time }]` | Per-vendor stats sorted by revenue |
| OrderHeatmap | GET | `/api/admin/analytics/peak-hours` | — | `?from&to` | `[{ hour: 0-23, day_of_week: 0-6, count }]` | Hour × weekday order density |
| LiveFeed | GET | `/api/admin/orders/live` | — | — | `[KDSOrder]` (last 20 active orders) | Live order feed for admin monitor |

---

### Screen: Order Management (`/admin/orders`)

| Component | Method | Endpoint | DTO | Request | Response | Description |
|-----------|--------|----------|-----|---------|----------|-------------|
| OrderTable | GET | `/api/admin/orders` | — | `?from&to&status&vendor_id&page&limit` | `{ orders: [...], total, page, pages }` | All orders, paginated + filtered |
| OrderRow | GET | `/api/admin/orders/:id` | — | — | `{ order, items: [...], history: [...] }` | Full order detail with status history |
| OrderStatusPatch | PATCH | `/api/admin/orders/:id/status` | `UpdateOrderStatusDto` | `{ status, reason? }` | `{ id, status }` | Override order status (admin only) |
| OrderCancelBtn | POST | `/api/admin/orders/:id/cancel` | `CancelOrderDto` | `{ reason }` | `{ id, status: 'cancelled' }` | Cancel any order with reason |
| ExportBtn | GET | `/api/admin/orders/export` | — | `?from&to&format=csv` | CSV file download | Export orders as CSV |

---

### Screen: Vendor Management (`/admin/vendors`)

| Component | Method | Endpoint | DTO | Request | Response | Description |
|-----------|--------|----------|-----|---------|----------|-------------|
| VendorGrid | GET | `/api/admin/vendors` | — | `?status&page&limit` | `[{ id, name, cuisine_type, booth_number, booth_color, status, is_accepting_orders, revenue_today, order_count_today }]` | All vendors with live stats |
| VendorCreateBtn | POST | `/api/admin/vendors` | `CreateVendorDto` | `{ name, cuisine_type, booth_number, booth_color, email, pin }` | `Vendor` | Create vendor + owner user account |
| VendorEditModal | PUT | `/api/admin/vendors/:id` | `UpdateVendorDto` | `{ name?, cuisine_type?, booth_color?, booth_number?, avg_prep_time_minutes? }` | `Vendor` | Update vendor profile |
| VendorSuspendBtn | PATCH | `/api/admin/vendors/:id/status` | `VendorStatusDto` | `{ status: 'online'\|'offline'\|'suspended' }` | `{ id, status }` | Toggle vendor online/suspended |
| VendorDeleteBtn | DELETE | `/api/admin/vendors/:id` | — | — | `{ success: true }` | Soft-delete vendor |
| StaffList | GET | `/api/admin/vendors/:id/staff` | — | — | `[{ id, name, email, role, pin_set }]` | List staff accounts for vendor |
| StaffInviteBtn | POST | `/api/admin/vendors/:id/staff` | `CreateStaffDto` | `{ name, email, role, pin? }` | `User` | Create kitchen/cashier staff |
| StaffRemoveBtn | DELETE | `/api/admin/vendors/:vendorId/staff/:userId` | — | — | `{ success: true }` | Remove staff account |

---

### Screen: Finance Dashboard (`/admin/finance`)

| Component | Method | Endpoint | DTO | Request | Response | Description |
|-----------|--------|----------|-----|---------|----------|-------------|
| DailySummaryTable | GET | `/api/admin/finance/daily` | — | `?from&to` | `[{ date, total_orders, gross_revenue, tax_collected, net_revenue }]` | Daily cash totals |
| VendorRevenueTable | GET | `/api/admin/finance/by-vendor` | — | `?from&to` | `[{ vendor_id, vendor_name, orders, revenue, tax, net }]` | Revenue split per vendor |
| CashLogList | GET | `/api/admin/finance/cash-log` | — | `?date&page` | `[{ id, order_id, token_number, amount, collected_by, created_at }]` | Cash collection audit trail |
| CashLogEntry | POST | `/api/admin/finance/cash-log` | `CashLogDto` | `{ order_id, amount, collected_by }` | `CashLog` | Manual cash collection record |
| ExportFinanceBtn | GET | `/api/admin/finance/export` | — | `?from&to&format=csv` | CSV download | Finance export |

---

### Screen: Analytics (`/admin/analytics`)

| Component | Method | Endpoint | DTO | Request | Response | Description |
|-----------|--------|----------|-----|---------|----------|-------------|
| TopItemsChart | GET | `/api/admin/analytics/top-items` | — | `?from&to&vendor_id?&limit=10` | `[{ item_name, vendor_name, count, revenue }]` | Best-selling items |
| OrderTrend | GET | `/api/admin/analytics/revenue` | — | `?from&to&interval` | `[{ date, revenue, order_count }]` | Reused from dashboard |
| PeakHoursHeatmap | GET | `/api/admin/analytics/peak-hours` | — | `?from&to` | `[{ hour, day_of_week, count }]` | Reused from dashboard |
| CuisineBreakdown | GET | `/api/admin/analytics/by-cuisine` | — | `?from&to` | `[{ cuisine_type, order_count, revenue }]` | Orders by cuisine category |
| PrepTimeReport | GET | `/api/admin/analytics/prep-times` | — | `?from&to&vendor_id?` | `[{ vendor_name, avg_prep_time, p50, p90 }]` | Prep time percentiles per vendor |

---

### Screen: Promotions (`/admin/promotions`)

| Component | Method | Endpoint | DTO | Request | Response | Description |
|-----------|--------|----------|-----|---------|----------|-------------|
| PromotionList | GET | `/api/admin/promotions` | — | `?active&page` | `[Promotion]` | All promotions |
| PromotionCreateModal | POST | `/api/admin/promotions` | `CreatePromotionDto` | `{ code, type: 'percent'\|'fixed', value, min_order_amount?, max_uses?, vendor_id?, valid_from, valid_to }` | `Promotion` | Create promo code |
| PromotionEditModal | PUT | `/api/admin/promotions/:id` | `UpdatePromotionDto` | Partial fields | `Promotion` | Edit promotion |
| PromotionToggleBtn | PATCH | `/api/admin/promotions/:id/toggle` | — | — | `{ id, is_active }` | Enable/disable promotion |
| PromotionDeleteBtn | DELETE | `/api/admin/promotions/:id` | — | — | `{ success: true }` | Delete promotion |
| PromoValidate | POST | `/api/promotions/validate` | `ValidatePromoDto` | `{ code, subtotal, vendor_id? }` | `{ valid, discount_amount, promotion }` | Customer-side: validate promo code at checkout |
| PromoStats | GET | `/api/admin/promotions/:id/stats` | — | — | `{ uses, total_discount, orders: [...] }` | Usage stats per promotion |

---

### Screen: Audit Log (`/admin/audit`)

| Component | Method | Endpoint | DTO | Request | Response | Description |
|-----------|--------|----------|-----|---------|----------|-------------|
| AuditTable | GET | `/api/admin/audit` | — | `?from&to&actor_id?&action?&page&limit` | `{ logs: [...], total, page }` | Filterable audit log |
| AuditRow | — | — | — | — | `{ id, actor_name, actor_role, action, entity_type, entity_id, metadata, created_at }` | Single log entry shape |

---

## Data Models

### Promotion
```typescript
interface Promotion {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  vendor_id: string | null;   // null = applies to all vendors
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  created_at: string;
}
```

### CashLog
```typescript
interface CashLog {
  id: string;
  order_id: string;
  token_number: number;
  amount: number;
  collected_by: string;
  notes: string | null;
  created_at: string;
}
```

### AuditLog
```typescript
interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;          // e.g. 'order.cancel', 'vendor.suspend', 'promotion.create'
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
```

---

## Phase 4 — Technical Endpoints

| Component | Purpose | Endpoint / File |
|-----------|---------|-----------------|
| PWA Manifest | Installable web app | `GET /manifest.json` (Next.js public/) |
| Service Worker | Offline shell caching | `public/sw.js` + `next-pwa` config |
| Error Boundary | Catch React errors | `app/error.tsx`, `app/global-error.tsx` |
| Rate Limiting | Guard API abuse | NestJS `@nestjs/throttler` on auth + order endpoints |
| Security Headers | CSP, HSTS, X-Frame | `next.config.ts` headers() |
| Health Check | Uptime monitoring | `GET /api/health` → `{ status: 'ok', db: 'ok', timestamp }` |
| Metrics | Basic perf logging | NestJS interceptor logging response times |

---

## Prisma Schema Additions (Phase 3)

```prisma
model Promotion {
  id                String    @id @default(uuid())
  code              String    @unique
  type              String    // 'percent' | 'fixed'
  value             Float
  min_order_amount  Float?
  max_uses          Int?
  current_uses      Int       @default(0)
  vendor_id         String?
  valid_from        DateTime
  valid_to          DateTime
  is_active         Boolean   @default(true)
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt

  vendor  Vendor? @relation(fields: [vendor_id], references: [id])
  orders  OrderPromotion[]

  @@map("promotions")
}

model OrderPromotion {
  id             String    @id @default(uuid())
  order_id       String
  promotion_id   String
  discount_amount Float
  created_at     DateTime  @default(now())

  order     Order     @relation(fields: [order_id], references: [id])
  promotion Promotion @relation(fields: [promotion_id], references: [id])

  @@map("order_promotions")
}

model CashLog {
  id           String   @id @default(uuid())
  order_id     String
  amount       Float
  collected_by String
  notes        String?
  created_at   DateTime @default(now())

  order Order @relation(fields: [order_id], references: [id])

  @@map("cash_logs")
}

model AuditLog {
  id          String   @id @default(uuid())
  actor_id    String?
  actor_name  String
  actor_role  String
  action      String
  entity_type String
  entity_id   String?
  metadata    Json     @default("{}")
  created_at  DateTime @default(now())

  @@map("audit_logs")
}
```
