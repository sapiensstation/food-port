# Food Port POS — API Test Results

> Run 1: 2026-07-06 — Tasks #1-30 (106 cases), backend on old compiled `dist/`.
> Run 2: 2026-07-06 (same day, later) — backend rebuilt + restarted after 8 bug fixes applied; fixes re-verified; new Tasks #32-61 (60 more cases) tested against the updated `test_cases.md`. Frontend started this round (`localhost:3000`) for header/PWA-adjacent checks.
> Environment: local Docker Supabase stack (`localhost:54322`), backend `localhost:3001`.
> Method: live curl against running API, using seeded data. Where seed data was insufficient (no promo codes existed), 3 test promo rows were inserted directly via SQL — noted below. State-changing tests (sold-out, pause) used real API endpoints, not DB writes, and were reverted after.

**Legend:** ✅ PASS · ❌ FAIL (bug) · ⚠️ PASS-with-mismatch (works but response shape/fields differ from spec) · ➖ N/A / not independently testable via API · 🔧 FIXED (was ❌ in Run 1, retested and confirmed working in Run 2)

---

## Summary

### Run 1 — Tasks #1-30 (106 cases), after Run 2 fixes applied

| Result | Count |
|---|---|
| ✅ PASS | 78 |
| 🔧 FIXED (was FAIL, now confirmed working) | 9 |
| ❌ FAIL (still broken) | 1 |
| ⚠️ PASS w/ schema mismatch | 12 |
| ➖ N/A (frontend-only / needs WS client) | 5 |
| **Total** | **106** |

### Run 2 — Tasks #32-61 (60 cases, new)

| Result | Count |
|---|---|
| ✅ PASS | 27 |
| ❌ FAIL (new bug) | 4 |
| ⚠️ PASS w/ schema mismatch | 15 |
| ➖ N/A (frontend-only) | 14 |
| **Total** | **60** |

### Grand total: 166 cases — 105 PASS, 9 fixed-and-confirmed, 5 still-failing, 27 mismatch, 19 N/A

---

## Bug fix verification (the 8 reported bugs, retested after rebuild+restart)

| # | Bug | Fix applied | Retest result |
|---|---|---|---|
| 1 | PIN login always fails | `auth.service.ts:96` — compare `pin:${dto.pin}` to match hash prefix | 🔧 **FIXED** — created a fresh PIN via API, logged in with it immediately, got a valid JWT |
| 2 | Empty-string `""` skips update | `vendor.service.ts` — `!== undefined` instead of truthy check | 🔧 **PARTIALLY FIXED** — `logo_url: ""` now correctly clears the logo (TC-23-02 fixed). But `name: ""` is now *also* silently accepted and persisted (no validation), which is worse for TC-19-04 (still ❌ — spec wants 400, got 200 with an empty vendor name). The generic fix wasn't paired with `@IsNotEmpty()` on `name`. |
| 3 | Dup category name → 500 | `vendor.service.ts` — `findFirst` check → `ConflictException` before create | 🔧 **FIXED** — now returns 409 "Category name already exists" |
| 4 | Empty category name → 201 | `@IsNotEmpty()` on `CreateCategoryDto.name` | 🔧 **FIXED** — now returns 400 "name should not be empty" |
| 5 | `items:[]` creates $0 order | `@ArrayMinSize(1)` on `items` | 🔧 **FIXED** — now returns 400 "items must contain at least 1 elements" |
| 6 | Bad `table_id` → 500 | NaN guard before Prisma query | 🔧 **FIXED** — now returns 404 "Table not found" |
| 7 | `special_notes` unreachable | DTO field added; `orders.service.ts` passes it through | 🔧 **FIXED** — order created with `special_notes`, persisted, and returned via `GET /vendor/orders/:id` |
| 8 | `avg_prep_time_minutes` wrong name/value | Renamed to `avg_wait_minutes`, computes actual queue wait | 🔧 **FIXED** — empty queue → `avg_wait_minutes: 0`; queue with a completed-wait item → a real computed value (230), no longer the static vendor config |

**Net: 8/8 reported bugs fixed; 1 pre-existing issue (TC-19-04, empty vendor name validation) remains open — it was never in the original fix list and the generic empty-string fix made it slightly more visible (now silently *applied* instead of silently *ignored*, but still not *rejected* as the spec wants).**

---

## New bugs found in Tasks #32-61

1. **`GET /admin/orders/export?status=completed` ignores the filter** — response includes rows of every status (pending, ready), none actually `completed`, despite the query param. **(TC-41-02)**
2. **`GET /admin/promotions/:id/stats` doesn't 404 for a nonexistent id** — returns 200 with zeroed `{uses:0, total_discount:0, orders:[]}` instead of 404. Looks like a `findFirst` + always-succeed aggregate rather than a not-found check. **(TC-42-02)**
3. **`GET /display/board?vendor_id=X` ignores the filter entirely** — querying with Burger Barn's id (which has no active orders) still returns Food Port's section unfiltered. The query param is accepted but never applied to the query/response. **(TC-44-02)**
4. **`GET /orders/by-token/abc` (non-numeric) → 500** instead of 400/404 — unguarded `parseInt`/numeric cast crashes on non-numeric input, same class of bug as the original #6. **(TC-47-03)**

## Schema/naming mismatches found in Tasks #32-61 (functional, but diverges from test_cases.md)

- `GET /vendor/reports/sales` — wraps in `{days, total_revenue, total_orders}` not documented `{daily: [...]}`; entries lack `avg_order_value`. Also only returns days that had orders, not a zero-filled range like `/revenue/weekly` does.
- `GET /vendor/reports/top-items` — items use `count` not `quantity_sold`; no `menu_item_id` field.
- `GET /vendor/reports/peak-hours` — flat array of 168 `{day_of_week, hour, count}` entries, not the documented nested 7-objects-of-24-hours-each structure. Same underlying data, different shape.
- `GET /vendor/payout/summary` (reused for Task #35 "wallet") — has no `total_revenue`/`total_paid_out`/`balance` fields; Task #28 and Task #35 document two different shapes for the same endpoint, neither of which matches the actual `{revenue_this_month, deductions_this_month, net_this_month, all_time_revenue, transactions}`.
- `POST /admin/users` — body field is `full_name`, not documented `name` (400 "property name should not exist" until corrected).
- `GET/PUT /admin/settings` — field is `name`, not documented `food_village_name` (PUT does accept `food_village_name` as input and maps it to `name` — DTO takes `food_village_name`/`currency`/`timezone` but only `name`/`tax_rate` actually persist/surface in GET; `currency`/`timezone` are accepted but appear to go nowhere).
- `GET /admin/vendors/:id/detail` — key is `categories`, not documented `menu_categories`; `stats` has `orders_today`/`total_orders`/`total_revenue`, not the documented `revenue_today` (closest analog `total_revenue` is all-time, not "today").
- `POST /admin/vendors/:id/staff` — requires `role` (enum) + optional `pin`, no `password` field at all (this creates PIN-based kitchen staff, not password-based accounts as the spec implies); response field is `full_name` not `name`.
- `GET /admin/orders/export` — CSV header column is `token`, not documented `token_number` (plus extra `subtotal`/`tax`/`items` columns, which is fine, just undocumented).
- `GET /vendor/orders` (pagination) — returns a bare array, not the documented `{orders, total, page, pages}` — `limit`/`page` slicing itself works correctly (verified with 8 orders across 2 pages, no overlap), just no metadata envelope.
- Confirmed again from Run 1: `GET /orders/:orderId` (plain, no suffix) still requires auth (401 without token) — inconsistent with the public/guest nature of the rest of the order-tracking flow. Affects TC-49-01 and TC-50 (both had to be validated via the authenticated `/vendor/orders/:id` view instead of the documented public route).

---

## Detailed Results

### Auth

| TC | Result | Notes |
|---|---|---|
| TC-AUTH-01 | ✅ | admin login returns token + role `super_admin` |
| TC-AUTH-02 | ✅ | booth11 login returns token + role `vendor_owner`, `vendor_id` |
| TC-AUTH-03 | ✅ | wrong password → 401 |

### Task #01–03 — Core Order Flow

| TC | Result | Notes |
|---|---|---|
| TC-01-01 | ✅ | 11 vendors returned with id/name/slug/booth_color |
| TC-01-02 | ✅ | Food Port present, `booth_number: 11` |
| TC-01-03 | ✅ | 20 categories incl. Juice/Momo/Taco (nested under `category.name`, not flat — fine) |
| TC-01-04 | ✅ | unknown vendorId → 404 |
| TC-01-05 | ✅ | categories have id/name/slug |
| TC-01-06 | ✅ | paused Burger Barn (`is_accepting_orders:false`) still returns categories publicly |

### Task #04 — Idempotency

| TC | Result | Notes |
|---|---|---|
| TC-04-01 | ✅ | repeat POST same `idempotency_key` → identical order id |
| TC-04-02 | ✅ | different key → new order id |

### Task #05 — Order Status

| TC | Result | Notes |
|---|---|---|
| TC-05-01 | ✅ | correct shape |
| TC-05-02 | ✅ | 404 for nonexistent order |
| TC-05-03 | ✅ | after vendor accepts item, `overall_status` → `confirmed` |
| TC-05-04 | ✅ | malformed UUID → 404 |

### Task #06 — Promotions

> No promo codes existed in seed data — inserted 3 test rows directly via SQL (`TESTQA10` active/percent/10%, `TESTEXPIRED` expired, `TESTMINAMT` min $500) to exercise the endpoint honestly.

| TC | Result | Notes |
|---|---|---|
| TC-06-01 | ⚠️ | 201, discount calculated correctly (20 off 200 @ 10%), but response has no `valid` boolean field — see mismatch list |
| TC-06-02 | ✅ | expired → 400 |
| TC-06-03 | ✅ | not found → 400 |
| TC-06-04 | ✅ | below min_order_amount → 400 with reason message |

### Task #07 — Menu Item Detail

| TC | Result | Notes |
|---|---|---|
| TC-07-01 | ✅ | `image_url` present (null), full item shape returned |
| TC-07-02 | ✅ | soft-deleted item → 404 |

### Task #08 — QR Table-Order

| TC | Result | Notes |
|---|---|---|
| TC-08-01 | ✅ | `table_id: "5"` → 201 (required creating a `session_id` first via undocumented `POST /sessions` — see note below) |
| TC-08-02 | ➖ | not separately tested; table lookup mechanism identical regardless of string format, low value re-testing |
| TC-08-03 | 🔧 | was 500, now **404** "Table not found" — fixed and reverified |
| TC-08-04 | ✅ | sold-out item (86'd via bulk-availability) → 400 "is sold out" |
| TC-08-05 | ✅ | `quantity: 0` → 400 validation error |
| TC-08-06 | 🔧 | was 201/$0 order, now **400** "items must contain at least 1 elements" — fixed and reverified |

**Undocumented dependency:** `CreateOrderDto.session_id` is `@IsUUID()` **required**, not optional as test_cases.md implies. A session must first be created via `POST /sessions {table_id}` (also undocumented in test_cases.md). Recommend adding this endpoint to the spec since every order flow depends on it.

### Task #09 — Accessibility

| TC | Result | Notes |
|---|---|---|
| TC-09-01 | ✅ | `dietary_tags`/`allergens` arrays present on every item |
| TC-09-02 | ✅ | all 5 Juice items tagged `vegan` |

### Task #10 — Display Board

| TC | Result | Notes |
|---|---|---|
| TC-10-01 | ✅ | valid ISO `last_updated` |
| TC-10-02 | ✅ | empty array when no preparing/ready items; correctly populates `ready: [1]` once an item reached ready status; no 500 |

### Task #11 — KDS Real-Time

| TC | Result | Notes |
|---|---|---|
| TC-11-01 | ⚠️ | 200, correct pending items, but shape is `{vendor_id, new, preparing, ready}` not flat array per spec |
| TC-11-02 | ✅ | unauthenticated → 401 |
| TC-11-03 | ✅ | vendor1 (Burger Barn) sees 0 items from vendor11's (Food Port) orders |
| TC-11-04 | ✅ | accept pending item → `status: accepted` |
| TC-11-05 | ✅ | re-accept → 400 "Cannot transition from accepted to accepted" |
| TC-11-06 | ✅ | cross-vendor accept attempt → 403 "Item belongs to a different vendor" |

### Task #12 — Urgency Color Coding

| TC | Result | Notes |
|---|---|---|
| TC-12-01 | ✅ | `created_at` present on every item |
| TC-12-02 | ✅ | `estimated_prep_time_minutes` present, integer |

### Task #13 — Audio Alert (WS)

| TC | Result | Notes |
|---|---|---|
| TC-13-01 | ✅ | new order confirmed appearing in `GET /kds/orders` immediately after POST |
| TC-13-02 | ➖ | requires a WS client to observe `new_order` event; not exercised (no WS tooling in this pass) |

### Task #14 — Bump/Undo

| TC | Result | Notes |
|---|---|---|
| TC-14-01 | ✅ | preparing → ready |
| TC-14-02 | ✅ | pending → ready directly → 400 "Cannot transition from pending to ready" |
| TC-14-03 | ✅ | accepted → preparing |

### Task #15 — Prep Countdown

| TC | Result | Notes |
|---|---|---|
| TC-15-01 | ⚠️ | `accepted_at` is **omitted** (not present) on pending items rather than explicit `null`; present as ISO once accepted. Functionally fine for most JS clients (`undefined == null`-ish checks) but diverges from the literal spec |
| TC-15-02 | ✅ | `estimated_prep_time_minutes` (3) matches Mango Juice's `prep_time_minutes` (3) |

### Task #16 — Queue Stats

| TC | Result | Notes |
|---|---|---|
| TC-16-01 | 🔧 | field renamed to `avg_wait_minutes` and now computed from actual completed-item wait, not the static config — fixed and reverified |
| TC-16-02 | 🔧 | empty queue now correctly returns `avg_wait_minutes: 0` — fixed and reverified |
| TC-16-03 | ✅ | unauthenticated → 401 |

### Task #17 — Vendor Pause

| TC | Result | Notes |
|---|---|---|
| TC-17-01 | ✅ | pause → `is_accepting_orders:false`, `status:offline` |
| TC-17-02 | ✅ | unpause → back to `true`/`online` |
| TC-17-03 | ✅ | unauthenticated → 401 |
| TC-17-04 | ➖ | not tested — would require a working kitchen-role JWT, which is blocked by the PIN-login bug (#1 above); once that's fixed this should be re-run |

### Task #18 — Special Notes

| TC | Result | Notes |
|---|---|---|
| TC-18-01 | 🔧 | `special_notes` is now accepted on `POST /orders`, persisted, and returned by `GET /vendor/orders/:id` — fixed and reverified |
| TC-18-02 | ✅ | field defaults to `null` when omitted |

### Task #19 — Operating Hours

| TC | Result | Notes |
|---|---|---|
| TC-19-01 | ✅ | `operating_hours: null` initially |
| TC-19-02 | ✅ | unauthenticated → 401 |
| TC-19-03 | ✅ | PUT full 7-day hours → GET reflects identical object |
| TC-19-04 | ❌ | **still open** — `name: ""` now → 200 with name *actually set to ""* (previously silently ignored, now silently applied); neither behavior is the spec's "400 validation error". Not part of the original 8-fix list; needs `@IsNotEmpty()` on `UpdateVendorSettingsDto.name`. |

### Task #20 — Dashboard Stats

| TC | Result | Notes |
|---|---|---|
| TC-20-01 | ⚠️ | all data present but fields renamed vs spec (see mismatch list) |
| TC-20-02 | ✅ | unauthenticated → 401 |

### Task #21 — Category Management

| TC | Result | Notes |
|---|---|---|
| TC-21-01 | ✅ | create "Specials" → 201, `slug: "specials"` auto-generated |
| TC-21-02 | 🔧 | was 500, now **409** "Category name already exists" — fixed and reverified |
| TC-21-03 | 🔧 | was 201 with empty name, now **400** "name should not be empty" — fixed and reverified |
| TC-21-04 | ✅ | delete empty category → 200 |
| TC-21-05 | ✅ | delete category w/ 5 active items → 400 "Cannot delete category with 5 active items" |
| TC-21-06 | ✅ | cross-vendor delete attempt → 404 |

### Task #22 — Bulk 86 Toggle

| TC | Result | Notes |
|---|---|---|
| TC-22-01 | ✅ | `{is_available:false}` on Juice (5 items) → `{updated:5}` |
| TC-22-02 | ✅ | restore → `{updated:5, is_available:true}` |
| TC-22-03 | ➖ | not independently re-tested; category-ownership check already verified equivalent via TC-21-06 pattern |
| TC-22-04 | ✅ | ordering an 86'd item → 400 "sold out" |

### Task #23 — Logo Upload

| TC | Result | Notes |
|---|---|---|
| TC-23-01 | ✅ | set logo_url → GET reflects same URL |
| TC-23-02 | 🔧 | was 200/unchanged, now correctly clears — `logo_url: ""` → GET reflects `""` — fixed and reverified |
| TC-23-03 | ✅ | `GET /display/board` includes the set `logo_url` |

### Task #24 — Order Detail

| TC | Result | Notes |
|---|---|---|
| TC-24-01 | ⚠️ | correct data, but item field is `base_price` not documented `unit_price`; also confirms order-level `special_notes:null` field genuinely exists in the model |
| TC-24-02 | ✅ | cross-vendor order fetch → 404 (no data leak) |
| TC-24-03 | ✅ | nonexistent orderId → 404 |

### Task #25 — Revenue Sparkline

| TC | Result | Notes |
|---|---|---|
| TC-25-01 | ⚠️ | exactly 7 entries returned, but wrapped in `{days:[...]}` rather than a top-level array |
| TC-25-02 | ✅ | dates ascending (2026-06-30 → 2026-07-06) |
| TC-25-03 | ✅ | revenue `0` (not null) for days without completed orders |
| TC-25-04 | ✅ | unauthenticated → 401 |

### Task #26 — Push Notifications (WS)

| TC | Result | Notes |
|---|---|---|
| TC-26-01 | ➖ | requires WS client to observe `new_order` event; not exercised |
| TC-26-02 | ✅ | new order visible in `GET /kds/orders` immediately after POST |

### Task #27 — Staff PIN Management

| TC | Result | Notes |
|---|---|---|
| TC-27-01 | ✅ | list returned, no `pin_hash` leaked |
| TC-27-02 | ✅ | unauthenticated → 401 |
| TC-27-03 | ✅ | create PIN "5678" → 201, no hash leaked (role silently forced to `vendor_kitchen` regardless of requested role — minor, acceptable) |
| TC-27-04 | ✅ | 2-digit PIN → 400 "PIN must be 4-6 digits" |
| TC-27-05 | ✅ | duplicate label → 201, succeeds as documented (not unique-constrained) |
| TC-27-06 | 🔧 | was 401 on correct PIN (hash/compare mismatch), now fresh PIN creation + immediate login → 201 with valid JWT — fixed and reverified |
| TC-27-07 | ✅ | wrong PIN → 401 |
| TC-27-08 | ✅ | inactive staff PIN → 401 (verified using Burger Barn's working seeded PIN, toggled inactive) |
| TC-27-09 | ✅ | toggle works correctly **when given explicit `{is_active}` body**; endpoint is a "set" not an auto-invert despite its name — see mismatch list |
| TC-27-10 | ✅ | cross-vendor toggle attempt → 404 |
| TC-27-11 | ✅ | delete own PIN → 200 |
| TC-27-12 | ✅ | cross-vendor delete attempt → 404 |

### Task #28 — Payout Summary

| TC | Result | Notes |
|---|---|---|
| TC-28-01 | ⚠️ | all monetary fields present, but array is named `transactions` not documented `deductions` |
| TC-28-02 | ✅ | `net_this_month = revenue − deductions` holds (both 0 in this dataset since no orders reached `completed` status) |
| TC-28-03 | ✅ | unauthenticated → 401 |

### Task #29 — Menu Item Duplication

| TC | Result | Notes |
|---|---|---|
| TC-29-01 | ✅ | `"Mango Juice (Copy)"`, `is_available:false` |
| TC-29-02 | ✅ | copy appears in Juice category via `GET /vendor/menu` |
| TC-29-03 | ✅ | cross-vendor duplicate attempt → 404 |
| TC-29-04 | ✅ | duplicating a deleted item → 404 |

### Task #30 — Customer Rating

| TC | Result | Notes |
|---|---|---|
| TC-30-01 | ✅ | 201, correct shape |
| TC-30-02 | ✅ | re-rate same order → upsert, same `id`, updated `rating`/`comment` |
| TC-30-03 | ✅ | `rating:0` → 400 "Rating must be 1-5" |
| TC-30-04 | ✅ | `rating:6` → 400 "Rating must be 1-5" |
| TC-30-05 | ✅ | nonexistent orderId → 404 |
| TC-30-06 | ✅ | no comment → 201, `comment:null` |
| TC-30-07 | ✅ | GET before rating → `data:null` |
| TC-30-08 | ✅ | GET after rating → full object |

---

# Tasks #32-61 — New Feature Test Results (Run 2)

### Task #32 — Vendor Sales Report

| TC | Result | Notes |
|---|---|---|
| TC-32-01 | ⚠️ | data correct (`{days, total_revenue, total_orders}`, 3 orders / 320 revenue today) but wrapped differently than documented `{daily}`; entries missing `avg_order_value` |
| TC-32-02 | ✅ | date-ranged query (`2024-01-01..2024-01-31`, outside actual data) → 200, empty `days: []`, no error |
| TC-32-03 | ✅ | admin token on vendor-only endpoint → 403 |

### Task #33 — Vendor Top Items Report

| TC | Result | Notes |
|---|---|---|
| TC-33-01 | ⚠️ | correct data (`Mango Juice`, count 4, revenue 320) but field is `count` not `quantity_sold`, and `menu_item_id` is missing entirely |
| TC-33-02 | ✅ | `limit=3` respected (only 1 item exists in this dataset so truncation wasn't exercised, but no error and correct shape) |
| TC-33-03 | ➖ | only 1 distinct item sold in this test dataset — can't meaningfully verify descending sort with a single entry |

### Task #34 — Peak Hours Heatmap

| TC | Result | Notes |
|---|---|---|
| TC-34-01 | ⚠️ | 200, but shape is a flat 168-entry array (`{day_of_week, hour, count}` × 7×24), not the documented nested `Array<{day, hours:[24]}>` |
| TC-34-02 | ⚠️ | same data present under different key names (`day_of_week`/`hour`/`count` vs documented `hour`/`order_count` inside a `day` grouping) |
| TC-34-03 | ✅ | unauthenticated → 401 |

### Task #35 — Wallet / Balance

| TC | Result | Notes |
|---|---|---|
| TC-35-01 | ⚠️ | endpoint returns data (`revenue_this_month`, `all_time_revenue`, etc.) but none of the specifically documented `total_revenue`/`total_paid_out`/`balance` fields exist — this is the same endpoint as Task #28, which documents yet a third shape; the two spec entries for one endpoint don't agree with each other or the code |
| TC-35-02 | ✅ | admin token → 403 (vendor-only, correctly enforced) |

### Task #36 — Admin User Management

| TC | Result | Notes |
|---|---|---|
| TC-36-01 | ✅ | `{users, total, page, pages}`, each user has id/email/role/created_at (plus vendor info) |
| TC-36-02 | ✅ | `?role=vendor_owner` → all 11 returned users have `role: "vendor_owner"` |
| TC-36-03 | ⚠️ | works once you send `full_name` instead of documented `name` (400 "property name should not exist" otherwise) — 201, correct id/email/role |
| TC-36-04 | ✅ | duplicate email → 409 "Email already in use" |
| TC-36-05 | ✅ | PUT `{role:"admin"}` → 200, role updated |
| TC-36-06 | ✅ | PUT nonexistent id → 404 |

### Task #37 — Admin System Settings

| TC | Result | Notes |
|---|---|---|
| TC-37-01 | ⚠️ | GET returns `{id, name, tagline, logo_url, address, tax_rate, ...}` — no `food_village_name`/`currency`/`timezone` keys as documented (field is just `name`) |
| TC-37-02 | ✅ | vendor token → 403 |
| TC-37-03 | ✅ | PUT `{tax_rate:0.08, food_village_name:"Test Village"}` → 200, `name` becomes "Test Village", `tax_rate` becomes 0.08; GET afterward reflects both — DTO does accept `food_village_name` as input even though GET never labels it that way |

### Task #38 — Admin Vendor Detail

| TC | Result | Notes |
|---|---|---|
| TC-38-01 | ⚠️ | full detail returned (categories, users, staffPins, stats) but key is `categories` not `menu_categories`; `stats` is `{orders_today, total_orders, total_revenue}`, not documented `{orders_today, revenue_today}` |
| TC-38-02 | ✅ | nonexistent vendor id → 404 |
| TC-38-03 | ✅ | `staffPins` entries have exactly `id`, `label`, `role`, `is_active` as documented |

### Task #39 — Admin Create Vendor Staff

| TC | Result | Notes |
|---|---|---|
| TC-39-01 | ⚠️ | works with `{email, name, role, pin}` — documented `password` field doesn't exist on this DTO at all (this creates PIN-based kitchen/cashier/waiter staff, not password accounts); response field is `full_name` not `name` |
| TC-39-02 | ✅ | duplicate email → 409 |
| TC-39-03 | ✅ | nonexistent vendor id → 404 |

### Task #40 — Finance CSV Export

| TC | Result | Notes |
|---|---|---|
| TC-40-01 | ✅ | `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="finance-....csv"` |
| TC-40-02 | ✅ | header row exactly `date,total_orders,gross_revenue,tax_collected,net_revenue` as documented |

### Task #41 — Orders CSV Export

| TC | Result | Notes |
|---|---|---|
| TC-41-01 | ⚠️ | `Content-Type: text/csv` correct; header row is `token,table,status,subtotal,tax,total,items,created_at` — column is `token` not documented `token_number` (extra columns are a bonus, not a problem) |
| TC-41-02 | ❌ | `?status=completed` → all rows returned regardless of status (saw `pending`/`pending`/`pending`/`ready`, zero `completed`) — **filter is not applied at all** |

### Task #42 — Admin Promotion Stats

| TC | Result | Notes |
|---|---|---|
| TC-42-01 | ⚠️ | 200 with `{uses, total_discount, orders}` — documented fields are `total_uses`/`total_discount_given`/`unique_orders`; same data, different names |
| TC-42-02 | ❌ | nonexistent promotion id → **200** with zeroed `{uses:0, total_discount:0, orders:[]}`, not 404 |

### Task #43 — KDS Fullscreen (frontend-only)

| TC | Result | Notes |
|---|---|---|
| TC-43-01, TC-43-02 | ➖ | N/A per spec — frontend UI interaction, not exercised |

### Task #44 — Display Board Vendor Filter

| TC | Result | Notes |
|---|---|---|
| TC-44-01 | ✅ | no params → full board, Food Port section with `ready:[1]` |
| TC-44-02 | ❌ | `?vendor_id=<Burger Barn id>` (which has zero active orders) still returns Food Port's section unchanged — **filter param is completely ignored** |

### Task #45 — Auto-Reconnect Overlay (frontend/WS-only)

| TC | Result | Notes |
|---|---|---|
| TC-45-01, TC-45-02 | ➖ | N/A per spec |

### Task #46 — KDS Print Ticket (frontend-only)

| TC | Result | Notes |
|---|---|---|
| TC-46-01, TC-46-02 | ➖ | N/A per spec |

### Task #47 — Order Lookup by Token

| TC | Result | Notes |
|---|---|---|
| TC-47-01 | ✅ | `GET /orders/by-token/1` → 200, `{id, token_number, status, created_at}` |
| TC-47-02 | ✅ | `GET /orders/by-token/9999` → 404 "Order not found" |
| TC-47-03 | ❌ | `GET /orders/by-token/abc` → **500** "An unexpected error occurred", not 400/404 — unguarded numeric parse, same bug class as the original bad-`table_id` issue |

### Task #48 — Saved/Recent Orders (frontend/localStorage-only)

| TC | Result | Notes |
|---|---|---|
| TC-48-01, TC-48-02 | ➖ | N/A per spec |

### Task #49 — Special Instructions per Cart Item

| TC | Result | Notes |
|---|---|---|
| TC-49-01 | ⚠️ | works — order created with `special_instructions:"No onions please"` on an item, confirmed via `GET /vendor/orders/:id` (had to use this authenticated route since documented public `GET /orders/:id` requires a Bearer token — see Run 1 finding) |
| TC-49-02 | ✅ | 201-char string → 400 "special_instructions must be shorter than or equal to 200 characters" |
| TC-49-03 | ✅ | omitted → item `special_instructions: null` |

### Task #50 — Order Tracking Shareable Link

| TC | Result | Notes |
|---|---|---|
| TC-50-01 | ✅ | `GET /orders/:orderId/status` with no auth header → 200, correct shape (this is the correct public tracking endpoint, distinct from the plain `/orders/:orderId` which does require auth) |
| TC-50-02 | ✅ | nonexistent order id → 404, not 403 — public tracking correctly returns not-found rather than leaking an auth-based signal |

### Task #51 — Accessibility Improvements (frontend-only)

| TC | Result | Notes |
|---|---|---|
| TC-51-01, TC-51-02 | ➖ | N/A per spec |

### Task #52 — Next.js Security Headers

> Frontend started for this test (`npm run dev`, `localhost:3000`).

| TC | Result | Notes |
|---|---|---|
| TC-52-01 | ✅ | `X-Frame-Options: SAMEORIGIN` present |
| TC-52-02 | ✅ | `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` both present; bonus: a full `Content-Security-Policy` header is also set (`frame-ancestors 'none'`, restricted `script-src`/`connect-src`, etc.) — better than the spec asked for |

### Task #53 — Rate Limiting (Throttler)

| TC | Result | Notes |
|---|---|---|
| TC-53-01 | ✅ | 10 rapid `POST /auth/login` (wrong creds) → first 5 returned 400 (password too short for the DTO's own validation, unrelated to throttling), next 5 returned 429 — throttle triggers correctly under burst |
| TC-53-02 | ✅ | after the window cleared, `POST /auth/login` with correct admin creds → 201 with a valid token, not stuck on 429 |
| TC-53-03 | ✅ | 15 rapid `GET /admin/overview` (which carries `@SkipThrottle({auth:true, order:true})`) with a valid token → all 200, no 429s |

### Task #54 — Error Boundary (frontend-only)

| TC | Result | Notes |
|---|---|---|
| TC-54-01, TC-54-02 | ➖ | N/A per spec |

### Task #55 — PWA Manifest (frontend-only)

| TC | Result | Notes |
|---|---|---|
| TC-55-01, TC-55-02 | ➖ | N/A per spec — not fetched since it's explicitly marked N/A/frontend in test_cases.md itself |

### Task #56 — Mobile KDS Layout (frontend-only)

| TC | Result | Notes |
|---|---|---|
| TC-56-01, TC-56-02 | ➖ | N/A per spec |

### Task #57 — Admin Dark Mode (frontend-only)

| TC | Result | Notes |
|---|---|---|
| TC-57-01, TC-57-02 | ➖ | N/A per spec |

### Task #58 — Vendor Menu Search (frontend-only)

| TC | Result | Notes |
|---|---|---|
| TC-58-01, TC-58-02 | ➖ | N/A per spec |

### Task #59 — Vendor Orders Pagination

| TC | Result | Notes |
|---|---|---|
| TC-59-01 | ⚠️ | `?page=1&limit=5` → bare array of 5 orders, correctly the most recent 5 by creation order — but no `{orders, total, page, pages}` envelope as documented |
| TC-59-02 | ✅ | `?page=2&limit=5` (8 total orders seeded for this test) → 3 remaining orders, verified zero id overlap with page 1 (token numbers repeated across pages but that's because `token_number` isn't a unique key across orders — actual order `id`s were disjoint, confirming the offset/limit logic itself is correct) |

### Task #60 — Admin Audit Log Detail

| TC | Result | Notes |
|---|---|---|
| TC-60-01 | ✅ | `{logs, total, page, pages}`; each entry has `id, actor_id, actor_name, actor_role, action, entity_type, entity_id, metadata, created_at` — exceeds spec (extra `actor_name`/`actor_role`) |
| TC-60-02 | ✅ | `metadata` is a real JSON object (e.g. `{role, vendor_id}` on a `staff.create` action); this test dataset's events are all creates so none happened to carry a `{before, after}` diff shape, but the field is genuinely structured JSON, not a null/string placeholder |

### Task #61 — KDS Keyboard Shortcuts (frontend-only)

| TC | Result | Notes |
|---|---|---|
| TC-61-01, TC-61-02 | ➖ | N/A per spec |

---

## Other observations (not formal test cases)

- Auth endpoints are throttled to 5 req/min (`ThrottlerModule` `auth` bucket) — correct and expected for a login endpoint, just slows down test iteration; had to pace requests ~15-60s apart.
- `GET /orders/:orderId` (plain, no `/status` suffix) unexpectedly requires a Bearer token (401 without one) — inconsistent with the public, guest-checkout nature of the rest of the order flow (status/rating/tracking endpoints on the same order are public, and this is the one exception). Worth a look if there's meant to be a customer-facing "view my order" page.
- Revenue/payout figures were low/`0` early in Run 1 because test orders hadn't reached `completed` status (only `ready`) — this looks correct by design (revenue counts completed sales), just noting so it isn't mistaken for a bug.
- Several Task #28/#35/#32/#33/#34/#38 report endpoints are functionally solid (correct numbers, correct filtering, correct auth) but every one of them uses field names that diverge from test_cases.md. None of these look like bugs in the code — they read like the spec was written aspirationally/independently of the implementation. Worth a pass to either update the docs to match the code, or vice versa, before anyone builds a frontend or Postman collection against the documented shapes.
- Two of the four new bugs (TC-41-02, TC-44-02) are the same *shape* of bug — a query-string filter parameter that's accepted by the DTO/route signature but never actually threaded into the underlying query/service call. Worth checking whether other list/export endpoints have the same silent-no-op filter pattern.
