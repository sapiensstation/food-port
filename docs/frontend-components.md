# Food Village POS — Frontend Component Architecture (Phase 1 & 2)

> **Framework:** Next.js 14 App Router · TypeScript · Tailwind CSS
> **State:** Zustand (cart + UI store)
> **Realtime:** Supabase Realtime channels
> **Animations:** Framer Motion (page transitions, KDS cards) · Lottie (order confirmation)
> **Design tokens:** `#0d0d0d` bg · `#1a1a1a` card · `#ff5c00` orange · `#ffd000` yellow · `#f5f5f0` text
> **Fonts:** Bebas Neue · DM Mono · DM Sans

---

## App Router Structure

```
frontend/app/
├── layout.tsx                    # Root layout: fonts, global providers
├── page.tsx                      # Redirect → /order
│
├── order/                        # Customer ordering flow (iPad-style)
│   ├── layout.tsx                # CustomerLayout: branded header + cart bottom bar
│   ├── page.tsx                  # Welcome screen
│   ├── vendors/
│   │   ├── page.tsx              # Vendor browsing grid (Phase 2)
│   │   └── [vendorId]/
│   │       └── menu/
│   │           └── page.tsx      # Vendor menu screen
│   ├── cart/
│   │   └── page.tsx              # Cart screen
│   └── confirmation/
│       └── [orderId]/
│           └── page.tsx          # Token + Lottie confirmation
│
├── vendor/                       # Vendor portal
│   ├── layout.tsx                # VendorLayout: sidebar nav
│   ├── login/
│   │   └── page.tsx              # Vendor login + PIN login
│   ├── kitchen/
│   │   └── page.tsx              # KDS (Kitchen Display System)
│   ├── dashboard/
│   │   └── page.tsx              # Vendor dashboard home
│   ├── menu/
│   │   └── page.tsx              # Menu management
│   ├── orders/
│   │   └── page.tsx              # Order history
│   └── settings/
│       └── page.tsx              # Vendor settings
│
└── display/
    └── page.tsx                  # TV display board (fullscreen, public)
```

---

## Shared Components (`components/ui/`)

| Component | Props | Purpose |
|---|---|---|
| `Button` | `variant: 'primary'|'secondary'|'ghost'|'danger'`, `size`, `loading`, `disabled` | Base button with orange/dark theme |
| `Badge` | `color: string`, `label: string` | Status/tag badge (dietary, booth color) |
| `Modal` | `isOpen`, `onClose`, `title?`, `size?` | Glassmorphism overlay modal |
| `Spinner` | `size?` | Loading spinner |
| `Input` | `label`, `error?`, rest | Dark-themed form input |
| `Select` | `label`, `options`, `error?` | Dark-themed select |
| `Toast` | Managed by Zustand `uiStore` | Top-right toast notifications |
| `PageTransition` | `children` | Framer Motion page fade/slide |
| `GlassCard` | `children`, `className?` | `backdrop-blur` glassmorphism card |

---

## Customer Flow Components

### `app/order/layout.tsx` — CustomerLayout

```
CustomerLayout
├── CustomerHeader           # Food village name, back button, vendor logo
│   └── CartBadge            # Item count bubble on cart icon
└── CartBottomBar            # Sticky bottom: item count + total + "View Cart" CTA
    └── [children]
```

**State consumed:** `cartStore.itemCount`, `cartStore.total`

---

### `app/order/page.tsx` — Welcome Screen

```
WelcomeScreen
├── FoodVillageBranding      # Name (Bebas Neue 72px), tagline, animated logo
├── TableInfo                # "Table X · Waiter: Y" (from URL params)
├── StartOrderingButton      # → /order/vendors
└── BackgroundDecoration     # Geometric circles (CSS pseudo, from HTML reference)
```

**API:** `POST /api/sessions` on mount (creates session, stores in sessionStorage)

---

### `app/order/vendors/page.tsx` — Vendor Browsing (Phase 2)

```
VendorBrowsingScreen
├── SearchBar / FilterChips  # "All", "Fast Food", "Asian", "Drinks", "Desserts"
├── VendorGrid               # Responsive grid
│   └── VendorCard (×10)     # Logo, name, cuisine, booth color border, prep time, status badge
│       └── OfflineBadge     # Shows if vendor.is_accepting_orders === false
└── CartBottomBar            # Persistent from CustomerLayout
```

**API:** `GET /api/vendors?status=active`  
**Realtime:** `vendors:status` channel → update open/offline badge live

---

### `app/order/vendors/[vendorId]/menu/page.tsx` — Vendor Menu

```
VendorMenuScreen
├── VendorHero               # Vendor name, cuisine type, booth color banner, prep time
├── CategoryTabBar           # Sticky horizontal scrollable tabs
│   └── CategoryTab (×N)     # Active = orange underline
├── MenuItemGrid             # 2-col responsive grid
│   └── MenuItemCard         # Image, name, price, dietary badges, SoldOut overlay
│       └── DietaryBadge     # 🌱 vegan · 🌶️ spicy · GF · Halal (from dietary_tags)
└── ItemDetailModal          # Portal modal (see below)
```

**API:** `GET /api/vendors/:id/menu`  
**Realtime:** `menu:availability:{vendorId}` → live sold-out toggle

---

### ItemDetailModal (nested in VendorMenuScreen)

```
ItemDetailModal
├── ItemImage                # Full-width, aspect-ratio 16/9
├── ItemInfo                 # Name (Bebas Neue 28px), description, base price
├── ModifierGroupSection (×N)
│   ├── GroupHeader          # Name + "(Required)" indicator
│   └── ModifierOption (×N)  # Radio (single) or Checkbox (multi), price delta
├── QuantityStepper          # − / count / + (1–10)
├── SpecialInstructions      # Textarea, 200-char max, counts down
├── LivePriceDisplay         # "Add to Cart · $14.50" (updates as modifiers toggled)
└── AddToCartButton          # Orange CTA → closes modal, updates cart
```

**State:** Local modal state + `cartStore.addItem()`

---

### `app/order/cart/page.tsx` — Cart Screen

```
CartScreen
├── EmptyCartState           # Illustration + "Browse Vendors" CTA
└── CartContent
    ├── VendorCartGroup (×N)  # Grouped by vendor
    │   ├── VendorGroupHeader # Booth color bar, vendor name, item count
    │   └── CartItemRow (×N)  # Item name, modifiers, quantity controls, price, remove
    │       ├── QuantityStepper
    │       └── RemoveButton
    ├── OrderSummary         # Subtotal / Tax 8.25% / Total (monospace)
    ├── ContinueOrderingBtn  # Ghost button → back to vendors
    └── PlaceOrderButton     # Orange CTA → POST /api/orders → confirmation
        └── LoadingSpinner   # While API call in flight
```

**State:** `cartStore` (items, quantities, totals)  
**API:** `POST /api/orders` on "Place Order"

---

### `app/order/confirmation/[orderId]/page.tsx` — Order Confirmation

```
ConfirmationScreen
├── LottieAnimation          # Cooking/chef animation (auto-plays, loops 2×)
├── TokenDisplay             # "#047" — Bebas Neue 120px, orange glow
├── CatchyMessage            # Rotating messages: "Your food is on its way! 🔥"
├── PerVendorStatusList      # One row per vendor
│   └── VendorStatusRow      # Vendor name + status chip (Pending/Preparing/Ready ✅)
│       └── StatusChip       # Color: gray/purple/green
├── AllReadyState            # Shows when all items ready: "Everything's ready! 🎉"
└── AutoResetTimer           # 60s inactivity → back to Welcome
```

**API:** `GET /api/orders/:id/status` (polling fallback)  
**Realtime:** `orders:customer:{orderId}` channel → live status updates

---

## Vendor Portal Components

### `app/vendor/layout.tsx` — VendorLayout

```
VendorLayout
├── VendorSidebar
│   ├── VendorLogo/Name      # Booth color accent
│   ├── NavItem (Kitchen)    # /vendor/kitchen — active on KDS page
│   ├── NavItem (Dashboard)  # /vendor/dashboard
│   ├── NavItem (Menu)       # /vendor/menu
│   ├── NavItem (Orders)     # /vendor/orders
│   ├── NavItem (Settings)   # /vendor/settings
│   └── OnlineToggle         # PATCH /api/vendor/status — instant online/offline
└── [children]
```

---

### `app/vendor/login/page.tsx` — Vendor Login

```
VendorLoginScreen
├── LoginTabs                # "Email Login" | "PIN Login"
│   ├── EmailLoginForm       # Email + password → POST /api/auth/login
│   └── PinLoginForm         # Vendor selector + 4-digit PIN pad → POST /api/auth/pin-login
└── BrandedBackground        # Same dark design tokens
```

---

### `app/vendor/kitchen/page.tsx` — KDS (Full)

```
KDSScreen
├── KDSHeader                # Vendor name, date, queue depth, online status, mute toggle
├── AudioController          # Web Audio API chime on new orders (hidden)
├── ReconnectionBanner       # "Connection lost — reconnecting..." (conditional)
├── KDSBoard                 # 3-column Kanban
│   ├── KDSColumn (New)      # amber header, count badge
│   │   └── KDSCard (×N)
│   ├── KDSColumn (Preparing)# purple header
│   │   └── KDSCard (×N)
│   └── KDSColumn (Ready)    # green header
│       └── KDSCard (×N)
└── FullscreenToggle         # Bottom-right corner
```

**KDSCard Component:**
```
KDSCard
├── VendorColorBar           # 4px left border (vendor booth_color)
├── TokenBadge               # #047 — 64px Bebas Neue
├── TableInfo                # "Table 5" — DM Mono
├── ItemInfo                 # Item name (large), quantity
├── ModifierList             # ADD modifiers green, REMOVE modifiers red uppercase
├── SpecialInstructionsBanner# Yellow bg banner (conditional)
├── PrepTimer                # MM:SS counting up; yellow >1.5×, red >2×
└── ActionButtons            # Accept / Ready / Complete + Reject (with reason modal)
```

**API:** `GET /api/kds/orders` on mount; `PATCH` for each action  
**Realtime:** `orders:vendor:{vendorId}` → new cards appear, move between columns

---

### `app/vendor/dashboard/page.tsx` — Vendor Dashboard

```
VendorDashboard
├── StatsRow
│   ├── StatCard (Orders Today)
│   ├── StatCard (Revenue Today)   # DM Mono, yellow value
│   ├── StatCard (Active Queue)
│   └── StatCard (Avg Prep Time)
├── TopItemsChart            # Horizontal bar chart (Recharts)
└── RecentOrdersTable        # Last 10 orders with status chips
```

**API:** `GET /api/vendor/dashboard`

---

### `app/vendor/menu/page.tsx` — Menu Management

```
MenuManagementPage
├── CategoryTabs             # Tab per category + "Add Category" button
├── MenuItemList             # List view per category
│   └── MenuItemRow          # Name, price, availability toggle, Edit/Delete actions
│       └── AvailabilityToggle # PATCH /api/vendor/menu-items/:id/availability
├── MenuItemFormModal        # Create / Edit slide-over panel
│   ├── BasicInfoSection     # Name, description, price, category, prep time
│   ├── ImageUpload          # Drag-drop, preview, POST /api/vendor/menu-items/:id/image
│   ├── DietaryTagsSection   # Checkbox pills
│   └── ModifierGroupSection # Assign modifier groups via multi-select
└── ModifierGroupManager     # Expandable section at bottom
    └── ModifierGroupCard    # Create/edit modifier groups + modifiers
```

**API:** Full CRUD via `/api/vendor/menu-items` + `/api/vendor/categories` + `/api/vendor/modifier-groups`

---

### `app/vendor/orders/page.tsx` — Order History

```
OrderHistoryPage
├── FilterBar                # Date range picker, status filter
├── OrdersTable              # Paginated DataTable
│   └── OrderRow             # Token, table, item count, amount, status, timestamp
└── Pagination               # Previous / Next
```

**API:** `GET /api/vendor/orders`

---

### `app/display/page.tsx` — TV Display Board

```
DisplayBoardScreen           # fullscreen, dark bg, auto-refresh
├── DisplayHeader            # Food village name, clock
├── VendorDisplaySection (×N) # One section per vendor with items
│   ├── VendorHeader         # booth_color bg, vendor name + logo
│   ├── PreparingTokens      # White token numbers
│   └── ReadyTokens          # Green pill + pulse animation, auto-remove after 30s
└── FooterMessage            # "Please collect your ready orders" (subtle scroll)
```

**API:** `GET /api/display/board` on mount (30s polling fallback)  
**Realtime:** `orders:display` channel

---

## State Management (Zustand)

### `store/cartStore.ts`

```typescript
interface CartStore {
  items: CartItem[];               // { menuItemId, vendorId, vendorName, vendorColor, itemName, unitPrice, modifiers, quantity, specialInstructions }
  sessionId: string | null;
  tableId: string | null;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  removeItem: (itemKey: string) => void;
  clearCart: () => void;
  setSession: (sessionId: string, tableId: string) => void;
  
  // Computed
  itemCount: () => number;
  subtotal: () => number;
  tax: () => number;             // subtotal * 0.0825
  total: () => number;
  itemsByVendor: () => Record<string, CartItem[]>;
}
```

### `store/uiStore.ts`

```typescript
interface UIStore {
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
  isKDSMuted: boolean;
  toggleKDSMute: () => void;
  kdsVolume: number;
  setKDSVolume: (v: number) => void;
}
```

---

## Design Token Reference (Tailwind config)

```javascript
// tailwind.config.ts
colors: {
  brand: {
    bg: '#0d0d0d',
    card: '#1a1a1a',
    steel: '#2c2c2c',
    chrome: '#c8c8c8',
    orange: '#ff5c00',
    yellow: '#ffd000',
    white: '#f5f5f0',
    dim: '#888888',
  },
  booth: {
    1: '#E63946',  // Burger Barn
    2: '#457B9D',  // Pizza Palace
    3: '#F4A261',  // Taco Fiesta
    4: '#E9C46A',  // Wok & Roll
    5: '#2A9D8F',  // Juice Junction
    6: '#E76F51',  // Spice Garden
    7: '#264653',  // Sushi Stop
    8: '#6A994E',  // Falafel House
    9: '#9B5DE5',  // Dessert Den
    10: '#CB4335', // BBQ Boss
  },
  kds: {
    new: '#F59E0B',      // amber
    preparing: '#8B5CF6', // purple
    ready: '#10B981',     // green
  }
}
fonts: {
  heading: ['Bebas Neue', 'sans-serif'],
  mono: ['DM Mono', 'monospace'],
  body: ['DM Sans', 'sans-serif'],
}
```

---

## Lottie Animation Sources

Order confirmation uses one of these free LottieFiles animations:
- Chef cooking: search "chef cooking" on lottiefiles.com
- Food delivery: search "food delivery" on lottiefiles.com  
- Checkmark celebration: search "order success" on lottiefiles.com

Install: `npm install lottie-react`

```tsx
// Usage in ConfirmationScreen
import Lottie from 'lottie-react';
import cookingAnimation from '@/animations/cooking.json';

<Lottie animationData={cookingAnimation} loop={2} className="w-64 h-64" />
```

---

## API Client (`lib/api.ts`)

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const token = getToken(); // from localStorage
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message ?? 'API error');
  return data.data as T;
}
```
