# Food Village POS — Component Library

> **Framework:** Next.js + React + Tailwind CSS
> **Component Pattern:** Atomic Design (Atoms → Molecules → Organisms → Templates)
> **State Management:** Zustand (client cart), React Query (server state), Supabase Realtime (live updates)
> **Icons:** Lucide React
> **UI Base:** Custom components (no external UI library dependency — full control needed for iPad/KDS optimization)

---

## Table of Contents

1. [Component Architecture](#1-component-architecture)
2. [Atoms (Primitives)](#2-atoms-primitives)
3. [Molecules (Composite)](#3-molecules-composite)
4. [Organisms (Feature Blocks)](#4-organisms-feature-blocks)
5. [Layout Components](#5-layout-components)
6. [Customer-Specific Components](#6-customer-specific-components)
7. [Vendor/KDS-Specific Components](#7-vendorkds-specific-components)
8. [Admin-Specific Components](#8-admin-specific-components)
9. [Shared Hooks](#9-shared-hooks)
10. [State Management](#10-state-management)
11. [Component File Structure](#11-component-file-structure)

---

## 1. Component Architecture

```
src/
├── components/
│   ├── ui/                    # Atoms — design system primitives
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── composed/              # Molecules — combined primitives
│   │   ├── SearchBar.tsx
│   │   ├── PriceDisplay.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ...
│   ├── features/              # Organisms — business logic components
│   │   ├── customer/
│   │   ├── vendor/
│   │   ├── admin/
│   │   └── shared/
│   └── layouts/               # Page-level layout shells
│       ├── CustomerLayout.tsx
│       ├── VendorLayout.tsx
│       └── AdminLayout.tsx
├── hooks/                     # Custom React hooks
├── stores/                    # Zustand stores
├── lib/                       # Utilities, API clients
└── types/                     # TypeScript interfaces
```

### Component Conventions

- Every component is a named export (no default exports)
- Props interfaces end with `Props` suffix: `ButtonProps`, `OrderCardProps`
- Components use `forwardRef` when they wrap native elements
- All interactive components support `disabled`, `loading`, and `className` props
- Test files co-located: `Button.tsx` + `Button.test.tsx`

---

## 2. Atoms (Primitives)

### `Button`

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size: 'sm' | 'md' | 'lg' | 'xl';       // xl = 56px height for iPad
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
}
```

**Size guide:**
- `sm`: 32px height — admin tables, compact UI
- `md`: 40px height — standard actions
- `lg`: 48px height — vendor KDS actions
- `xl`: 56px height — customer iPad CTAs (minimum touch target)

---

### `Badge`

```tsx
interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'vendor';
  size: 'sm' | 'md' | 'lg';
  dot?: boolean;                          // Dot indicator mode
  vendorColor?: string;                   // For booth identification
  children: React.ReactNode;
}
```

---

### `Input`

```tsx
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel';
  size: 'sm' | 'md' | 'lg';
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: LucideIcon;
  rightElement?: React.ReactNode;          // Clear button, unit label
  fullWidth?: boolean;
}
```

---

### `Select`

```tsx
interface SelectProps {
  options: { value: string; label: string; disabled?: boolean }[];
  size: 'sm' | 'md' | 'lg';
  label?: string;
  placeholder?: string;
  error?: string;
  multiple?: boolean;
}
```

---

### `Toggle`

```tsx
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size: 'sm' | 'md';
  label?: string;
  disabled?: boolean;
}
```

Used for: sold-out toggle, vendor online/offline, notification preferences.

---

### `Avatar`

```tsx
interface AvatarProps {
  src?: string;
  fallback: string;                       // Initials or icon
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
}
```

---

### `Card`

```tsx
interface CardProps {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  borderLeft?: string;                    // Vendor color border
  hoverable?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

---

### `Modal`

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

---

### `Skeleton`

```tsx
interface SkeletonProps {
  variant: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;                         // Repeat count for text lines
}
```

---

### `Spinner` / `LoadingDots`

```tsx
interface SpinnerProps {
  size: 'sm' | 'md' | 'lg';
  color?: string;                         // Defaults to brand primary
}
```

---

### `Divider`

```tsx
interface DividerProps {
  orientation: 'horizontal' | 'vertical';
  label?: string;                         // Text label in the middle
}
```

---

### `EmptyState`

```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}
```

---

### `QuantityStepper`

```tsx
interface QuantityStepperProps {
  value: number;
  min?: number;                           // Default 1
  max?: number;                           // Default 99
  onChange: (value: number) => void;
  size: 'md' | 'lg';                     // lg for iPad
}
```

Touch-optimized: +/- buttons are 44x44px minimum. Long-press for rapid increment.

---

## 3. Molecules (Composite)

### `StatusBadge`

Maps order status to the correct color, icon, and label.

```tsx
interface StatusBadgeProps {
  status: OrderItemStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  animated?: boolean;                     // Pulse for "pending"
}

// Auto-maps:
// pending → amber + Clock icon
// accepted → blue + CheckCircle
// preparing → purple + Flame
// ready → green + Bell (animated pulse)
// completed → gray + CircleCheckBig
// rejected → red + XCircle
```

---

### `PriceDisplay`

```tsx
interface PriceDisplayProps {
  amount: number;
  currency?: string;                     // Default 'USD'
  size: 'sm' | 'md' | 'lg' | 'xl';
  strikethrough?: number;                // Original price for discount display
  highlight?: boolean;                   // Green for discounts
}
```

---

### `SearchBar`

```tsx
interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  debounceMs?: number;                   // Default 300ms
  size: 'md' | 'lg';
}
```

---

### `VendorChip`

Small vendor identifier with booth color dot.

```tsx
interface VendorChipProps {
  vendorName: string;
  vendorColor: string;
  boothNumber: number;
  size: 'sm' | 'md';
  onClick?: () => void;
}
```

---

### `TimerDisplay`

Live countdown/countup timer for KDS.

```tsx
interface TimerDisplayProps {
  startedAt: Date;
  estimatedMinutes?: number;
  size: 'sm' | 'md' | 'lg';
  warningThreshold?: number;             // Minutes before turning yellow
  dangerThreshold?: number;              // Minutes before turning red
}
```

Behavior: Shows `MM:SS` counting up from `startedAt`. Background color shifts from neutral → warning → danger as thresholds are crossed.

---

### `DateRangePicker`

```tsx
interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (range: { start: Date; end: Date }) => void;
  presets?: ('today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth')[];
  maxRange?: number;                     // Max days selectable
}
```

---

### `FilterBar`

Horizontal scrollable chip filter.

```tsx
interface FilterBarProps {
  filters: { key: string; label: string; count?: number }[];
  activeFilter: string;
  onChange: (key: string) => void;
}
```

Used for: menu categories, order status filters, cuisine type filters.

---

### `StatCard`

Dashboard metric card.

```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  change?: { value: number; direction: 'up' | 'down' };
  icon?: LucideIcon;
  iconColor?: string;
  loading?: boolean;
}
```

---

### `Tabs`

```tsx
interface TabsProps {
  tabs: { key: string; label: string; badge?: number; icon?: LucideIcon }[];
  activeTab: string;
  onChange: (key: string) => void;
  variant: 'line' | 'pill' | 'enclosed';
  size: 'sm' | 'md' | 'lg';
}
```

---

## 4. Organisms (Feature Blocks)

### `MenuItemCard` (Customer)

```tsx
interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  vendorColor: string;
}
```

Displays: item image (square, 120px), name, price, prep time, dietary badges. Tapping opens modifier modal. "Sold Out" overlay when `is_available = false`.

---

### `CartSummary` (Customer — Bottom Bar)

```tsx
interface CartSummaryProps {
  itemCount: number;
  total: number;
  onViewCart: () => void;
}
```

Persistent bottom bar: `🛒 3 items · $32.00 [View Cart →]`. Animates on item add (cart-bounce).

---

### `CartDrawer` (Customer)

```tsx
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartState;
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}
```

Groups items by vendor with booth color headers. Shows subtotal, tax, total.

---

### `ModifierModal` (Customer)

```tsx
interface ModifierModalProps {
  item: MenuItem;
  modifierGroups: ModifierGroup[];
  onAddToCart: (item: MenuItem, selections: ModifierSelection[], qty: number, notes: string) => void;
  onClose: () => void;
}
```

Full-screen modal on iPad. Large food image at top, modifier groups as radio/checkbox lists, quantity stepper, special instructions text area, "Add to Cart — $14.00" CTA at bottom.

---

### `OrderCard` (KDS)

```tsx
interface KDSOrderCardProps {
  orderItem: OrderItemWithDetails;
  onAccept: () => void;
  onStartPreparing: () => void;
  onMarkReady: () => void;
  onComplete: () => void;
  onReject: (reason: string) => void;
}
```

Card with vendor-color left border. Shows token number (large), table number, item name, modifiers (highlighted), special instructions (yellow background), timer, and action button based on current status. Audio chime on mount if status is "pending".

---

### `KDSColumn`

```tsx
interface KDSColumnProps {
  title: string;
  status: OrderItemStatus;
  items: OrderItemWithDetails[];
  emptyMessage: string;
  onItemAction: (itemId: string, action: string) => void;
}
```

Vertical scrollable column of `KDSOrderCard` components. Count badge in header. Auto-scrolls to show newest items.

---

### `OrderTimeline` (Admin/Vendor)

```tsx
interface OrderTimelineProps {
  history: OrderStatusHistoryEntry[];
}
```

Vertical timeline showing every status change with timestamps, actor, and optional reason.

---

### `VendorPerformanceCard` (Admin)

```tsx
interface VendorPerformanceCardProps {
  vendor: VendorWithStats;
  period: 'today' | 'week' | 'month';
}
```

Shows: vendor name + booth color, orders count, revenue, avg prep time, rating. Click to drill into vendor detail.

---

### `RevenueChart` (Admin/Vendor)

```tsx
interface RevenueChartProps {
  data: { date: string; revenue: number; orders: number }[];
  period: 'daily' | 'weekly' | 'monthly';
  showOrders?: boolean;                  // Dual axis
  vendorColor?: string;                  // Single vendor color
}
```

Uses Recharts. Responsive, supports tooltip with formatted currency.

---

### `PaymentSplitBreakdown`

```tsx
interface PaymentSplitBreakdownProps {
  splits: PaymentSplit[];
  total: number;
  tax: number;
  commissionTotal: number;
}
```

Visual breakdown: stacked bar showing each vendor's share, commission deducted, platform earnings.

---

### `DisplayBoardSection`

```tsx
interface DisplayBoardSectionProps {
  vendor: { name: string; color: string; logoUrl: string };
  preparingTokens: number[];
  readyTokens: number[];
}
```

Single vendor section on the TV display board. Large token numbers, "Ready" tokens flash with green animation.

---

### `TokenDisplay` (Customer Confirmation)

```tsx
interface TokenDisplayProps {
  tokenNumber: number;
  items: OrderItemStatus[];              // Per-vendor status
}
```

Large centered token number. Below: per-vendor status rows with live updates.

---

### `DataTable` (Admin)

```tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationState;
  sorting?: SortingState;
  onSort?: (sorting: SortingState) => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (ids: string[]) => void;
}
```

Generic sortable, paginated table for admin views. Uses `@tanstack/react-table` internally.

---

## 5. Layout Components

### `CustomerLayout`

```tsx
// Full-screen iPad layout with no visible browser chrome
// Top: branded header (food village logo, table number)
// Bottom: persistent cart summary bar
// Main: scrollable content area
```

---

### `VendorLayout`

```tsx
// Sidebar navigation (collapsible on tablet)
// Top bar: vendor name, online/offline toggle, notifications bell
// Main: content area with breadcrumbs
```

---

### `AdminLayout`

```tsx
// Fixed sidebar navigation (260px, collapsible to 72px)
// Top bar: search, notifications, user menu
// Main: content area with optional sub-navigation tabs
```

---

### `KDSLayout`

```tsx
// Full-screen, no navigation chrome
// 3-column Kanban: New | Preparing | Ready
// Top bar: vendor name, queue stats, settings gear
// Dark background by default
```

---

### `DisplayBoardLayout`

```tsx
// Full-screen TV layout, no interaction
// Auto-rotating vendor sections
// Food village branding header
// Current time display
// Dark background, high contrast
```

---

## 6. Customer-Specific Components

| Component | Purpose |
|-----------|---------|
| `VendorBrowseGrid` | Grid of vendor cards with cuisine filters |
| `VendorMenuView` | Category tabs + scrollable menu items for one vendor |
| `MenuItemCard` | Single menu item with image, price, dietary badges |
| `ModifierModal` | Full-screen modifier selection + add to cart |
| `CartDrawer` | Slide-up cart grouped by vendor |
| `CartItemRow` | Single cart item with quantity controls |
| `PaymentMethodSelector` | Card terminal vs cash selection |
| `TokenDisplay` | Large token number with per-vendor status |
| `WelcomeScreen` | Landing screen with "Start Ordering" CTA |
| `InactivityOverlay` | "Are you still ordering?" after 5 min inactivity |

---

## 7. Vendor/KDS-Specific Components

| Component | Purpose |
|-----------|---------|
| `KDSOrderCard` | Single order item card with status actions |
| `KDSColumn` | Kanban column for a status group |
| `KDSBoard` | Full 3-column KDS view |
| `NewOrderChime` | Audio player + visual flash for new orders |
| `PrepTimer` | Live timer with color-coded urgency |
| `MenuItemForm` | Create/edit menu item with modifiers |
| `ModifierGroupForm` | Create/edit modifier group |
| `AvailabilityToggle` | Quick sold-out toggle with confirmation |
| `VendorDailyStats` | Today's revenue, orders, avg prep time |
| `EarningsCard` | Wallet balance, pending, last payout |
| `StaffList` | Manage kitchen staff and roles |

---

## 8. Admin-Specific Components

| Component | Purpose |
|-----------|---------|
| `GlobalStatsBar` | Top-level KPIs: revenue, orders, active booths |
| `VendorGrid` | All 10 vendors with status indicators |
| `VendorOnboardingWizard` | Multi-step vendor setup flow |
| `FinanceDashboard` | Revenue, commissions, payouts overview |
| `PaymentSplitBreakdown` | Visual split for a single order |
| `CommissionTable` | Per-vendor commission report |
| `PayoutManager` | Trigger and track vendor payouts |
| `MenuApprovalQueue` | Pending menu changes with approve/reject |
| `PromotionBuilder` | Create cross-vendor promotions |
| `AuditLogViewer` | Searchable, filterable audit trail |
| `SystemHealthPanel` | Online/offline status of all devices and vendors |
| `SalesHeatmap` | Hourly sales intensity visualization |
| `VendorComparisonChart` | Side-by-side vendor performance |

---

## 9. Shared Hooks

### Data Fetching

```tsx
// React Query hooks — centralized API calls

useVendors()                              // List active vendors
useVendorMenu(vendorId)                   // Menu for a vendor
useMenuItem(itemId)                       // Single item with modifiers
useOrder(orderId)                         // Order details
useOrders(filters)                        // Filtered order list
useVendorDashboard()                      // Vendor's daily stats
useAdminDashboard()                       // Global admin stats
useWallet()                               // Vendor wallet/earnings
usePromotions()                           // Active promotions
useAuditLog(filters)                      // Audit log entries
```

### Real-Time

```tsx
useRealtimeOrderItems(vendorId)           // KDS: live order items for a vendor
useRealtimeOrderStatus(orderId)           // Customer: live status for their order
useRealtimeDisplayBoard()                 // TV: all preparing/ready items
useRealtimeVendorStatus()                 // Customer app: vendor online/offline
useRealtimeMenuAvailability()             // Customer: item sold-out updates
```

### Utility

```tsx
useCart()                                 // Zustand cart actions
useAuth()                                 // Current user, role, permissions
usePermissions()                          // RBAC checks: canApproveMenu, canRefund, etc.
useDebounce(value, delay)                 // Debounced search input
useInactivityTimer(timeoutMs, onTimeout)  // iPad inactivity detection
useAudioAlert()                           // KDS new order chime
useOnlineStatus()                         // Network connectivity detection
useIdempotencyKey()                       // Generate unique idempotency keys
```

---

## 10. State Management

### Cart Store (Zustand)

```tsx
interface CartStore {
  items: CartItem[];
  sessionId: string | null;
  tableId: string | null;
  waiterId: string | null;

  // Actions
  addItem: (item: MenuItem, modifiers: ModifierSelection[], qty: number, notes: string) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  setSession: (sessionId: string, tableId: string, waiterId: string) => void;

  // Computed
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  itemsByVendor: Record<string, CartItem[]>;
}
```

### Auth Store (Zustand)

```tsx
interface AuthStore {
  user: User | null;
  role: UserRole;
  vendorId: string | null;
  permissions: string[];
  isAuthenticated: boolean;

  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}
```

### KDS Store (Zustand)

```tsx
interface KDSStore {
  pendingItems: OrderItem[];
  preparingItems: OrderItem[];
  readyItems: OrderItem[];
  audioEnabled: boolean;
  autoAccept: boolean;

  acceptItem: (itemId: string) => void;
  startPreparing: (itemId: string) => void;
  markReady: (itemId: string) => void;
  completeItem: (itemId: string) => void;
  rejectItem: (itemId: string, reason: string) => void;
  toggleAudio: () => void;
}
```

---

## 11. Component File Structure

```
src/components/ui/Button/
├── Button.tsx              # Component implementation
├── Button.types.ts         # Props interface
├── Button.test.tsx         # Unit tests
└── index.ts                # Named export

src/components/features/customer/MenuItemCard/
├── MenuItemCard.tsx
├── MenuItemCard.types.ts
├── MenuItemCard.test.tsx
├── MenuItemCard.skeleton.tsx   # Loading skeleton variant
└── index.ts
```

### Export Pattern

```tsx
// components/ui/index.ts — barrel export for atoms
export { Button } from './Button';
export { Badge } from './Badge';
export { Input } from './Input';
// ...

// Usage in feature components
import { Button, Badge, Card } from '@/components/ui';
```
