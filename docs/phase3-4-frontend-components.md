# Food Village POS — Phase 3 & 4 Frontend Components

> **Routes:** All admin routes under `/admin/*` (separate portal from `/vendor/*`)
> **Auth:** Zustand `adminAuthStore` — persisted JWT, role check on every route
> **Layout:** Collapsible sidebar (240px), dark glassmorphism, orange brand accent

---

## Admin Portal Architecture

```
app/
  admin/
    layout.tsx            # AdminLayout — sidebar nav + auth guard
    page.tsx              # redirect → /admin/dashboard
    login/page.tsx        # Admin login form (email + password only, no PIN)
    dashboard/page.tsx    # Overview stats + revenue chart + live feed
    orders/page.tsx       # Order management table + detail panel
    vendors/page.tsx      # Vendor grid + create/edit + suspend/delete
    finance/page.tsx      # Daily summary + per-vendor table + cash log
    analytics/page.tsx    # Charts: revenue trend, heatmap, top items, cuisine
    promotions/page.tsx   # Promotion CRUD + stats modal
    audit/page.tsx        # Audit log table (read-only, no actions)
  error.tsx               # React error boundary page
  global-error.tsx        # Root error boundary
  not-found.tsx           # 404 page
```

---

## Shared Admin UI Components

| Component | File | Description |
|-----------|------|-------------|
| `AdminLayout` | `admin/layout.tsx` | Sidebar + header + auth guard |
| `StatCard` | `components/admin/StatCard.tsx` | Dark glass card, metric + delta |
| `BarChart` | `components/admin/BarChart.tsx` | Framer Motion animated horizontal bars |
| `LineChart` | `components/admin/LineChart.tsx` | SVG path revenue trend |
| `HeatmapGrid` | `components/admin/HeatmapGrid.tsx` | 7×24 day/hour grid for peak hours |
| `DataTable` | `components/admin/DataTable.tsx` | Sortable, filterable table |
| `DateRangePicker` | `components/admin/DateRangePicker.tsx` | Two date inputs with quick-select (Today, Week, Month) |
| `StatusChip` | `components/admin/StatusChip.tsx` | Color-coded order/vendor status pill |
| `VendorBadge` | `components/admin/VendorBadge.tsx` | Booth-color dot + vendor name |

---

## Screen Specifications

### `/admin/login`
**Components:** LoginForm
- Email + password inputs
- Submit → `POST /api/auth/login` → check role is `super_admin` or `admin`
- Error state: "Access denied — admin account required"
- On success: save token + user to `adminAuthStore`, redirect → `/admin/dashboard`

---

### `/admin/dashboard`
**Components:** StatsBar, RevenueChart, VendorLeaderboard, LiveFeed

**StatsBar (4 cards):**
- Orders Today | Revenue Today (yellow, font-mono) | Active Vendors | Avg Prep Time
- Polls `GET /api/admin/overview` every 30s

**RevenueChart:**
- SVG line chart — 30-day revenue trend
- X-axis: dates, Y-axis: revenue in $
- Toggle: Day / Hour granularity
- Data: `GET /api/admin/analytics/revenue?interval=day&from=&to=`

**VendorLeaderboard:**
- Ranked list — booth-color bar, vendor name, revenue, order count
- Data: `GET /api/admin/analytics/vendors`

**LiveFeed:**
- Last 20 active order items, auto-refreshes 10s
- Color-coded by status: amber=pending, purple=preparing, green=ready
- Data: `GET /api/admin/orders/live`

---

### `/admin/orders`
**Components:** OrderFilters, OrderTable, OrderDetailPanel

**OrderFilters:**
- DateRangePicker, status filter chips (All / Pending / Ready / Completed / Cancelled), vendor dropdown
- Export CSV button → `GET /api/admin/orders/export`

**OrderTable columns:** Token | Table | Vendor(s) | Items | Total | Status | Time
- Click row → slide-in `OrderDetailPanel`
- Pagination: 20 per page

**OrderDetailPanel (right slide-in):**
- Full order detail: token, table, items with modifiers
- Status history timeline
- Action buttons: Cancel Order (red, with reason modal) | Override Status (dropdown)
- Cancel: `POST /api/admin/orders/:id/cancel`
- Override: `PATCH /api/admin/orders/:id/status`

---

### `/admin/vendors`
**Components:** VendorGrid, VendorCard, VendorFormModal, StaffModal

**VendorGrid:**
- 3-col grid on desktop, 1-col mobile
- Filter by status (All / Online / Offline / Suspended)
- "+ Add Vendor" button top right

**VendorCard:**
- Booth-color top border (4px)
- Name, cuisine, booth #
- Revenue today (yellow), order count (dim)
- Status chip + toggle button
- Edit | View Staff | Suspend/Delete actions

**VendorFormModal:**
- Create: name, cuisine, booth #, color picker, email (new owner)
- Edit: same fields without email

**StaffModal:**
- Table: name, email, role, active status
- Remove button per row
- PIN entries listed separately

---

### `/admin/finance`
**Components:** DateRangePicker, DailySummaryTable, VendorRevenueTable, CashLogTable, CashLogEntryModal

**DailySummaryTable:**
- Date | Orders | Gross | Tax | Net columns
- Totals row at bottom
- Export button

**VendorRevenueTable:**
- Vendor | Orders | Revenue | Tax | Net
- Color-coded vendor column

**CashLogTable:**
- Token | Amount | Collected By | Time columns
- Date filter (single day)
- "+ Log Cash" button → CashLogEntryModal

**CashLogEntryModal:**
- Order ID input (or token number lookup)
- Amount, collected_by, notes fields

---

### `/admin/analytics`
**Components:** DateRangePicker, RevenueLineChart, PeakHoursHeatmap, TopItemsChart, CuisineDonut, PrepTimeTable

**Tab layout:** Revenue | Peak Hours | Top Items | By Cuisine | Prep Times

**RevenueLineChart:** SVG, day/hour toggle, vendor filter
**PeakHoursHeatmap:** 7 rows (Mon-Sun) × 24 cols (0-23h), opacity = order density, hover shows count
**TopItemsChart:** Horizontal bar chart, sortable by count or revenue, vendor filter
**CuisineDonut:** CSS conic-gradient pie by revenue, legend list
**PrepTimeTable:** Vendor | Avg | P50 | P90 | Sample Count

---

### `/admin/promotions`
**Components:** PromotionList, PromotionCard, PromotionFormModal, PromotionStatsModal

**PromotionList:**
- Filter: Active / Inactive / All
- Grid of PromotionCards

**PromotionCard:**
- Code (large, font-mono), type badge (percent/fixed), value
- Usage: current_uses / max_uses progress bar
- Valid date range
- Active toggle switch
- Edit | Stats | Delete buttons

**PromotionFormModal:**
- Code (auto-uppercase), type (percent/fixed radio), value
- Min order amount, max uses (optional)
- Vendor selector (All vendors or specific)
- Date pickers: valid from / valid to

**PromotionStatsModal:**
- Total uses, total discount given
- Orders table: token, date, discount, order total

---

### `/admin/audit`
**Components:** AuditFilters, AuditTable

**AuditFilters:** DateRangePicker, actor search, action type filter (dropdown with common actions)

**AuditTable columns:** Time | Actor | Role | Action | Entity | Details
- Color-coded action: red=delete/cancel, amber=suspend, green=create, blue=update
- Expandable row → full metadata JSON
- No actions (read-only)
- Pagination: 30 per page

---

## New TypeScript Types (add to `types/index.ts`)

```typescript
export interface AdminOverview {
  orders_today: number;
  revenue_today: number;
  orders_this_week: number;
  revenue_this_week: number;
  active_vendors: number;
  avg_prep_time: number;
}

export interface Promotion {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  vendor_id: string | null;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  created_at: string;
}

export interface CashLog {
  id: string;
  order_id: string;
  token_number: number;
  amount: number;
  collected_by: string;
  notes: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  order_count: number;
}

export interface PeakHourPoint {
  day_of_week: number;
  hour: number;
  count: number;
}
```

---

## Phase 4 Files

| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest — name, icons, theme_color, display: standalone |
| `public/sw.js` | Service worker — cache-first for shell, network-first for API |
| `app/error.tsx` | React error boundary: glass card + "Something went wrong" + retry |
| `app/global-error.tsx` | Root error boundary (catches layout errors) |
| `app/not-found.tsx` | Custom 404 page |
| `next.config.ts` | Security headers: CSP, X-Frame-Options, HSTS |
| NestJS throttler | Rate limit: auth 5/min, orders 30/min, general 100/min |
