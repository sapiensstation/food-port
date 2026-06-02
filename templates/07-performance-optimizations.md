# Food Village POS — Performance Optimizations

> **Target:** Every customer-facing interaction completes in under 200ms perceived latency. KDS screens update in under 500ms. No spinner should appear for more than 1 second on a warm cache.
> **Environment reality:** Food court WiFi, iPads on battery, TV displays running Chrome 24/7, kitchen tablets getting splashed with sauce.

---

## Table of Contents

1. [Performance Budgets](#1-performance-budgets)
2. [Frontend Performance](#2-frontend-performance)
3. [Backend Performance (NestJS)](#3-backend-performance-nestjs)
4. [Database Performance (PostgreSQL)](#4-database-performance-postgresql)
5. [Caching Strategy (Redis)](#5-caching-strategy-redis)
6. [Real-Time Performance](#6-real-time-performance)
7. [Image & Asset Optimization](#7-image--asset-optimization)
8. [Background Jobs (BullMQ)](#8-background-jobs-bullmq)
9. [Network Optimization](#9-network-optimization)
10. [iPad & Device Optimization](#10-ipad--device-optimization)
11. [Monitoring & Profiling](#11-monitoring--profiling)
12. [Load Testing Targets](#12-load-testing-targets)

---

## 1. Performance Budgets

### Page Load Budgets

| Surface | First Contentful Paint | Largest Contentful Paint | Time to Interactive | Bundle Size (gzipped) |
|---------|----------------------|-------------------------|--------------------|-----------------------|
| Customer iPad | < 1.2s | < 2.0s | < 2.5s | < 150 KB |
| Vendor KDS | < 1.0s | < 1.5s | < 2.0s | < 120 KB |
| Vendor Dashboard | < 1.5s | < 2.5s | < 3.0s | < 200 KB |
| Admin Dashboard | < 2.0s | < 3.0s | < 3.5s | < 250 KB |
| Display Board | < 1.0s | < 1.5s | < 2.0s | < 80 KB |

### Interaction Budgets

| Action | Target Latency | Maximum |
|--------|---------------|---------|
| Add item to cart | < 50ms | 100ms |
| Open modifier modal | < 100ms | 200ms |
| Submit order | < 500ms | 1500ms |
| KDS accept order | < 200ms | 500ms |
| KDS status change | < 200ms | 500ms |
| Menu item search | < 150ms | 300ms |
| Real-time order status update | < 500ms | 1000ms |
| Page navigation | < 300ms | 500ms |
| Admin table filter/sort | < 200ms | 500ms |

### API Response Time Budgets

| Endpoint Category | P50 | P95 | P99 |
|-------------------|-----|-----|-----|
| Auth endpoints | 80ms | 200ms | 500ms |
| Menu read (cached) | 15ms | 50ms | 100ms |
| Menu read (uncached) | 50ms | 150ms | 300ms |
| Order creation | 150ms | 400ms | 800ms |
| KDS status update | 50ms | 150ms | 300ms |
| Payment intent | 300ms | 800ms | 1500ms |
| Admin list queries | 100ms | 300ms | 600ms |
| Analytics aggregations | 200ms | 500ms | 1500ms |

---

## 2. Frontend Performance

### Code Splitting Strategy

```typescript
// Route-based splitting via Next.js App Router (automatic)
// Each route group is a separate chunk:
//   (customer) → customer-bundle.js
//   (vendor)   → vendor-bundle.js
//   (admin)    → admin-bundle.js
//   (display)  → display-bundle.js

// Heavy component lazy loading:
const RevenueChart = dynamic(() => import('@/components/features/admin/RevenueChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,   // Charts don't need server rendering
});

const ModifierModal = dynamic(() => import('@/components/features/customer/ModifierModal'), {
  loading: () => <ModalSkeleton />,
});

// Third-party lazy loading:
const StripeTerminal = dynamic(() => import('@stripe/terminal-js'), { ssr: false });
```

### Bundle Analysis Targets

```
Core shared bundle:     < 50 KB gzipped (React, routing, auth, UI primitives)
Customer route chunk:   < 80 KB gzipped
Vendor route chunk:     < 70 KB gzipped
Admin route chunk:      < 120 KB gzipped (larger due to charts, tables)
Display route chunk:    < 30 KB gzipped (minimal — just real-time + display)
```

### React Rendering Optimization

```typescript
// 1. Memoize expensive list renders
const MenuItemList = memo(({ items, onAddToCart }: MenuItemListProps) => {
  return items.map(item => (
    <MenuItemCard key={item.id} item={item} onAddToCart={onAddToCart} />
  ));
});

// 2. Virtualize long lists (vendor order history, admin order table, audit log)
import { useVirtualizer } from '@tanstack/react-virtual';

const OrderList = ({ orders }: { orders: Order[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,               // Estimated row height
    overscan: 5,                          // Render 5 extra items above/below viewport
  });
  // Only renders visible rows
};

// 3. Stable references for callbacks
const handleAddToCart = useCallback((item: MenuItem) => {
  cartStore.addItem(item, selectedModifiers, quantity, notes);
}, [selectedModifiers, quantity, notes]);

// 4. Selective re-renders with Zustand selectors
const itemCount = useCartStore((state) => state.items.length);  // Only re-renders when count changes
const total = useCartStore((state) => state.total);             // Only re-renders when total changes
```

### Prefetching Strategy

```typescript
// Next.js Link prefetching for likely next pages:

// On vendor browsing page, prefetch popular vendor menus
<Link href={`/order/vendors/${vendor.slug}`} prefetch={true}>
  <VendorCard vendor={vendor} />
</Link>

// On cart page, prefetch payment page
useEffect(() => {
  if (cart.items.length > 0) {
    router.prefetch('/order/payment');
  }
}, [cart.items.length]);

// Prefetch vendor data on hover (desktop) or focus (tablet)
const prefetchVendorMenu = (vendorId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['vendor-menu', vendorId],
    queryFn: () => fetchVendorMenu(vendorId),
    staleTime: 60_000,
  });
};
```

### Optimistic Updates

```typescript
// Cart operations are instant (local state, no server call)
// KDS status changes use optimistic updates with rollback

const useUpdateItemStatus = () => {
  return useMutation({
    mutationFn: (data: { itemId: string; status: string }) =>
      api.patch(`/kds/items/${data.itemId}/${data.status}`),
    
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['kds-orders']);
      
      // Snapshot previous state for rollback
      const previous = queryClient.getQueryData(['kds-orders']);
      
      // Optimistically update the UI
      queryClient.setQueryData(['kds-orders'], (old: any) => ({
        ...old,
        items: old.items.map((item: any) =>
          item.id === data.itemId ? { ...item, status: data.status } : item
        ),
      }));
      
      return { previous };
    },
    
    onError: (err, data, context) => {
      // Rollback on error
      queryClient.setQueryData(['kds-orders'], context?.previous);
      toast.error('Failed to update — reverted');
    },
  });
};
```

---

## 3. Backend Performance (NestJS)

### Request Pipeline Optimization

```typescript
// 1. Compression middleware
app.use(compression({
  threshold: 1024,     // Only compress responses > 1KB
  level: 6,            // Balance speed vs ratio
}));

// 2. Request logging with performance timing
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const start = performance.now();
    return next.handle().pipe(
      tap(() => {
        const duration = performance.now() - start;
        const request = context.switchToHttp().getRequest();
        
        if (duration > 500) {
          this.logger.warn(`Slow request: ${request.method} ${request.url} — ${duration.toFixed(0)}ms`);
        }
      }),
    );
  }
}

// 3. Connection pooling (Prisma)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings via DATABASE_URL params:
  // ?connection_limit=20&pool_timeout=10
});
```

### Query Optimization Patterns

```typescript
// 1. Select only needed fields
const orders = await prisma.order.findMany({
  where: { status: 'pending' },
  select: {
    id: true,
    tokenNumber: true,
    total: true,
    createdAt: true,
    items: {
      select: {
        id: true,
        itemName: true,
        quantity: true,
        status: true,
        vendorId: true,
      },
    },
  },
});

// 2. Avoid N+1 queries — use includes/joins
// BAD: Loop of queries
for (const order of orders) {
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
}

// GOOD: Single query with include
const orders = await prisma.order.findMany({
  include: { items: true },
});

// 3. Cursor-based pagination for large datasets
const orders = await prisma.order.findMany({
  take: 20,
  cursor: lastId ? { id: lastId } : undefined,
  skip: lastId ? 1 : 0,
  orderBy: { createdAt: 'desc' },
});
```

### Response Optimization

```typescript
// 1. Slim API responses — don't return entire database rows
// Transform entities to DTOs before sending

class OrderResponseDto {
  @Expose() id: string;
  @Expose() tokenNumber: number;
  @Expose() status: string;
  @Expose() total: number;
  // Excludes: internal IDs, audit fields, soft-delete markers
}

// 2. Pagination metadata
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}
```

---

## 4. Database Performance (PostgreSQL)

### Index Strategy

```sql
-- Critical query paths and their indexes:

-- KDS: "Show me active orders for my booth" (runs every few seconds per vendor)
CREATE INDEX CONCURRENTLY idx_order_items_kds
  ON order_items (vendor_id, status, created_at)
  WHERE status NOT IN ('completed', 'picked_up', 'cancelled');

-- Customer menu: "Show available items for this vendor"
CREATE INDEX CONCURRENTLY idx_menu_items_customer
  ON menu_items (vendor_id, category_id, sort_order)
  WHERE is_active = true AND is_available = true AND deleted_at IS NULL;

-- Admin orders: "Show recent orders with filters"
CREATE INDEX CONCURRENTLY idx_orders_admin_filter
  ON orders (created_at DESC, status)
  INCLUDE (token_number, total, payment_status);

-- Token lookup: "Find order by today's token number"
CREATE INDEX CONCURRENTLY idx_orders_token_today
  ON orders (token_number, (created_at::date));

-- Financial queries: vendor earnings for a period
CREATE INDEX CONCURRENTLY idx_payment_splits_vendor_date
  ON payment_splits (vendor_id, created_at DESC)
  INCLUDE (gross_amount, commission_amount, net_amount);

-- Partial indexes for "active" queries (most queries exclude archived data)
CREATE INDEX CONCURRENTLY idx_orders_active
  ON orders (created_at DESC)
  WHERE status NOT IN ('completed', 'cancelled');
```

### Query Performance Rules

```
1. Every query hitting production must have an EXPLAIN ANALYZE under 10ms for indexed queries.
2. No sequential scans on tables with > 10,000 rows.
3. JOIN operations limited to 3 tables per query. Beyond that, break into multiple queries.
4. Aggregation queries (SUM, COUNT, AVG for reports) use materialized views or pre-computed values.
5. LIKE queries must use trigram indexes (pg_trgm) if searching text fields.
6. Date-range queries always use indexed timestamp columns.
```

### Materialized Views for Analytics

```sql
-- Pre-compute daily vendor stats (refreshed every 15 minutes)
CREATE MATERIALIZED VIEW mv_vendor_daily_stats AS
SELECT
  oi.vendor_id,
  DATE(o.created_at) AS date,
  COUNT(DISTINCT o.id) AS order_count,
  SUM(oi.line_total) AS gross_revenue,
  AVG(EXTRACT(EPOCH FROM (oi.ready_at - oi.prep_started_at)) / 60) AS avg_prep_time_minutes,
  COUNT(CASE WHEN oi.status = 'rejected' THEN 1 END) AS rejected_count
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.created_at > NOW() - INTERVAL '90 days'
GROUP BY oi.vendor_id, DATE(o.created_at);

CREATE UNIQUE INDEX idx_mv_vendor_daily ON mv_vendor_daily_stats (vendor_id, date);

-- Refresh schedule (via pg_cron or BullMQ job)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vendor_daily_stats;
```

### Connection Pooling

```
# PgBouncer configuration (recommended for Supabase)
pool_mode = transaction          # Release connection after each transaction
default_pool_size = 25           # Per database
max_client_conn = 200            # Total client connections
reserve_pool_size = 5            # Emergency connections
reserve_pool_timeout = 3         # Seconds to wait for emergency pool

# For NestJS direct connection (if not using PgBouncer):
DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=10"
```

---

## 5. Caching Strategy (Redis)

### Cache Architecture

```
Redis Cluster Layout:
├── Cache DB (db 0)          — API response caching
├── Session DB (db 1)        — User sessions, cart state backup
├── Queue DB (db 2)          — BullMQ job queues
└── Pub/Sub                  — Real-time event broadcasting
```

### Cache Layers

```typescript
// Layer 1: HTTP Response Cache (CDN/Edge)
// Static assets: 1 year (immutable hashes)
// Menu images: 24 hours
// API responses: not cached at edge (dynamic, tenant-scoped)

// Layer 2: Application Cache (Redis)
const CACHE_CONFIG = {
  // Vendor menu: cached per vendor, invalidated on menu change
  'vendor:menu:{vendorId}': {
    ttl: 300,               // 5 minutes
    invalidateOn: ['menu_item.updated', 'menu_item.created', 'menu_item.deleted',
                   'menu_item.availability_changed'],
  },

  // Vendor list: cached globally, invalidated on vendor status change
  'vendors:active': {
    ttl: 60,                // 1 minute
    invalidateOn: ['vendor.status_changed', 'vendor.updated'],
  },

  // Vendor dashboard stats: cached per vendor
  'vendor:dashboard:{vendorId}': {
    ttl: 30,                // 30 seconds (near-real-time)
    invalidateOn: ['order.created', 'order.completed'],
  },

  // Admin global stats
  'admin:dashboard:stats': {
    ttl: 15,                // 15 seconds
    invalidateOn: ['order.created', 'order.completed', 'payment.completed'],
  },

  // KDS active orders: NOT cached in Redis (real-time via Supabase)
  // Token sequence: NOT cached (atomic database operation)
  // Payment data: NEVER cached (always fresh from Stripe)
};
```

### Cache Invalidation

```typescript
// Event-driven invalidation via NestJS EventEmitter

@Injectable()
export class CacheInvalidationService {
  constructor(
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
  ) {
    // Listen to domain events and invalidate relevant caches
    this.eventEmitter.on('menu_item.updated', async (event) => {
      await this.redis.del(`vendor:menu:${event.vendorId}`);
    });

    this.eventEmitter.on('vendor.status_changed', async () => {
      await this.redis.del('vendors:active');
    });

    this.eventEmitter.on('order.completed', async (event) => {
      await this.redis.del(`vendor:dashboard:${event.vendorId}`);
      await this.redis.del('admin:dashboard:stats');
    });
  }
}
```

### Cache-Aside Pattern

```typescript
// Standard cache-aside (read-through) pattern for all cached endpoints

async getVendorMenu(vendorId: string): Promise<MenuResponse> {
  const cacheKey = `vendor:menu:${vendorId}`;
  
  // 1. Check cache
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // 2. Fetch from database
  const menu = await this.menuRepository.getActiveMenu(vendorId);
  
  // 3. Store in cache
  await this.redis.setex(cacheKey, 300, JSON.stringify(menu));
  
  return menu;
}
```

---

## 6. Real-Time Performance

### Supabase Realtime Optimization

```typescript
// 1. Subscribe only to needed columns (reduce payload size)
supabase
  .channel('kds-orders')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'order_items',
    filter: `vendor_id=eq.${vendorId}`,
    columns: ['id', 'status', 'updated_at'],     // Only status changes, not full row
  }, handleStatusChange)
  .subscribe();

// 2. Debounce rapid updates (batch display updates)
const debouncedDisplayUpdate = useDebouncedCallback(
  (updates: OrderItemUpdate[]) => {
    setDisplayItems(prev => applyBatchUpdates(prev, updates));
  },
  100,      // Batch updates within 100ms window
);

// 3. Limit concurrent subscriptions
// Customer: 1 subscription (their order)
// KDS: 1 subscription (vendor's items)
// Display: 1 subscription (all preparing/ready)
// Admin: max 3 subscriptions (dashboard, orders, alerts)
```

### WebSocket Message Optimization

```typescript
// Keep WebSocket payloads small
// BAD: Sending entire order object on status change
{ type: 'order.updated', data: { /* entire order with 20 fields */ } }

// GOOD: Send only the change
{ type: 'order.item.status', data: { itemId: 'oi_001', status: 'ready', updatedAt: '...' } }

// Client merges the update into local state
```

---

## 7. Image & Asset Optimization

### Menu Item Images

```typescript
// Upload pipeline:
// 1. Client resizes to max 1200x1200 before upload (reduce bandwidth)
// 2. Server generates responsive variants:
//    - thumb: 200x200 (vendor list, cart)
//    - medium: 400x400 (menu grid)
//    - large: 800x800 (item detail modal)
// 3. Convert to WebP with JPEG fallback
// 4. Store in Supabase Storage / S3 with CDN

// Next.js Image component handles responsive loading:
<Image
  src={item.imageUrl}
  alt={item.name}
  width={400}
  height={400}
  sizes="(max-width: 768px) 50vw, 200px"
  placeholder="blur"
  blurDataURL={item.thumbBlurHash}        // Low-quality placeholder
  loading="lazy"                           // Below-fold images
/>

// Above-fold images (first 4 items on menu):
<Image priority={index < 4} ... />
```

### Static Asset Caching

```
# Cache headers:
# Static assets (JS, CSS, fonts): immutable, 1 year
Cache-Control: public, max-age=31536000, immutable

# Images (menu items): 24 hours, stale-while-revalidate
Cache-Control: public, max-age=86400, stale-while-revalidate=3600

# API responses: no cache (dynamic, tenant-scoped)
Cache-Control: no-store

# HTML pages: short cache with revalidation
Cache-Control: public, max-age=0, must-revalidate
```

### Font Loading

```typescript
// Inter font — subset to Latin characters only
// Load via next/font for automatic optimization

import { Inter, Plus_Jakarta_Sans } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',          // Show fallback font immediately, swap when loaded
  variable: '--font-inter',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['600', '700'],   // Only weights we use for display text
});
```

---

## 8. Background Jobs (BullMQ)

### Job Queue Architecture

```typescript
// Queues and their priorities:

const queues = {
  // CRITICAL — payment processing
  'payment-splits': {
    concurrency: 5,
    attempts: 10,
    backoff: { type: 'exponential', delay: 5000 },
  },

  // HIGH — order routing and notifications
  'order-processing': {
    concurrency: 10,
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
  },

  // MEDIUM — notifications
  'notifications': {
    concurrency: 20,
    attempts: 3,
    backoff: { type: 'fixed', delay: 5000 },
  },

  // LOW — analytics, reports
  'analytics': {
    concurrency: 3,
    attempts: 2,
    backoff: { type: 'fixed', delay: 30000 },
  },

  // SCHEDULED — recurring jobs
  'scheduled': {
    concurrency: 2,
  },
};
```

### Key Background Jobs

```typescript
// 1. Payment split processing (after payment confirmed)
@Processor('payment-splits')
export class PaymentSplitProcessor {
  @Process()
  async processSplit(job: Job<PaymentSplitData>) {
    const { paymentId, vendorSplits } = job.data;
    for (const split of vendorSplits) {
      await this.stripeService.createTransfer(split);
      await this.ledgerService.recordSplit(split);
    }
  }
}

// 2. Daily token number reset (midnight)
@Cron('0 0 * * *')
async resetTokenSequence() {
  // Token sequences auto-create new row for new date
  // Old sequences preserved for historical lookup
}

// 3. Materialized view refresh (every 15 minutes)
@Cron('*/15 * * * *')
async refreshAnalytics() {
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vendor_daily_stats`;
}

// 4. Stale order cleanup (every 5 minutes)
@Cron('*/5 * * * *')
async cleanupStaleOrders() {
  // Orders in "pending" for > 30 minutes with no payment → mark as abandoned
}

// 5. Vendor payout processing (daily at 2 AM)
@Cron('0 2 * * *')
async processPayouts() {
  // Batch vendor payouts via Stripe
}
```

---

## 9. Network Optimization

### API Request Batching

```typescript
// Cart → Order conversion: single request with all items
// NOT: one request per item
// NOT: one request per vendor

// Admin dashboard: parallel fetch
const [stats, liveMetrics, recentOrders] = await Promise.all([
  api.get('/admin/dashboard/stats'),
  api.get('/admin/dashboard/live-metrics'),
  api.get('/admin/orders?status=active&limit=5'),
]);
```

### Request Deduplication

```typescript
// React Query automatically deduplicates identical requests
// If 3 components request useVendorMenu('vendor_01'),
// only 1 network request is made

// For mutations, idempotency keys prevent duplicate server-side processing
```

### Compression

```
# All API responses compressed with gzip (NestJS compression middleware)
# Minimum response size for compression: 1KB
# WebSocket messages: not compressed (already small payloads)
# Typical compression ratios:
#   Menu JSON: ~80% reduction (repetitive structure)
#   Order JSON: ~70% reduction
#   Analytics JSON: ~75% reduction
```

---

## 10. iPad & Device Optimization

### iPad-Specific Performance

```typescript
// 1. Disable unnecessary browser features in kiosk mode
// meta viewport: prevent zoom, fixed scale
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

// 2. Reduce memory usage on iPad
// - Limit image cache size
// - Dispose off-screen components (React virtualization)
// - Clear completed order data from memory after 5 minutes

// 3. Battery optimization
// - Reduce animation frame rate when on battery
// - Dim screen after 2 minutes of inactivity (not full sleep — preserve session)
// - Pause non-essential background sync when battery < 20%

// 4. Touch performance
// - Remove 300ms tap delay (already handled by modern browsers)
// - Use passive event listeners for scroll events
// - Hardware-accelerated CSS transforms for animations
```

### KDS Tablet Optimization

```typescript
// Kitchen tablets run 12+ hours straight. Memory leaks are critical.

// 1. Clean up completed orders from memory every 5 minutes
useEffect(() => {
  const cleanup = setInterval(() => {
    kdsStore.pruneCompletedOrders(5 * 60 * 1000);  // Remove items completed > 5 min ago
  }, 5 * 60 * 1000);
  return () => clearInterval(cleanup);
}, []);

// 2. Force garbage collection hints
// Unmount off-screen order cards, don't just hide them

// 3. WebSocket keepalive to prevent connection timeout
// Heartbeat every 30 seconds
```

### Display Board (TV) Optimization

```typescript
// TV displays run Chrome in kiosk mode 24/7

// 1. Auto-reload every 6 hours (prevent memory leaks)
setTimeout(() => window.location.reload(), 6 * 60 * 60 * 1000);

// 2. CSS animations only (no JavaScript-driven animation)
// GPU-accelerated: transform, opacity only

// 3. Minimal DOM: only render visible tokens
// Auto-prune "completed" tokens after 30 seconds

// 4. Dark theme default (OLED: lower power, LCD: reduced backlight strain)
```

---

## 11. Monitoring & Profiling

### Key Metrics to Track

```typescript
// Application Performance Monitoring (APM) metrics:

// 1. API response times (P50, P95, P99) per endpoint
// 2. Database query times per query pattern
// 3. Cache hit rate (target: > 90% for menu endpoints)
// 4. WebSocket connection count and reconnection rate
// 5. Error rate per endpoint
// 6. Active order count (system load indicator)
// 7. Payment processing time
// 8. Background job queue depth and processing time
// 9. Memory usage per service
// 10. CPU usage per service

// Frontend-specific:
// 1. Core Web Vitals (LCP, FID, CLS) per surface
// 2. Client-side error rate (error boundary catches)
// 3. Time to first order display on KDS after order creation
// 4. Cart-to-checkout conversion time
```

### Performance Alerts

| Metric | Warning | Critical |
|--------|---------|----------|
| API P95 latency | > 500ms | > 1000ms |
| Database connection pool | > 80% used | > 95% used |
| Redis memory | > 70% | > 90% |
| Error rate | > 2% | > 5% |
| KDS update latency | > 2s | > 5s |
| Background job queue depth | > 100 | > 500 |
| Memory usage (per service) | > 80% | > 95% |

---

## 12. Load Testing Targets

### Expected Load

```
Peak hour (lunch rush, 11:30 AM - 1:30 PM):
- 10 vendors active
- ~30 concurrent iPad sessions
- ~5 orders per minute (300/hour)
- ~15 items per minute across all vendors
- ~50 KDS status updates per minute
- ~10 payment transactions per minute
- ~3 admin users viewing dashboards
- 1-3 display boards active
```

### Load Test Scenarios

```
Scenario 1: Normal lunch rush
- 30 concurrent customers browsing menus
- 5 orders/minute
- All 10 vendors active on KDS
- Target: < 200ms API response, < 500ms KDS update

Scenario 2: Peak overload (2x normal)
- 60 concurrent customers
- 10 orders/minute
- Target: < 500ms API response, < 1000ms KDS update, no errors

Scenario 3: Vendor stress test
- All 10 vendors simultaneously updating item availability
- 100 menu item changes per minute
- Target: Cache invalidation + menu refresh < 2s

Scenario 4: Payment storm
- 20 simultaneous payment requests
- Target: All payments processed, no duplicates, splits completed within 30s

Scenario 5: Recovery
- Kill WebSocket server, verify KDS polling fallback activates within 5s
- Kill Redis, verify API falls back to database-only (degraded but functional)
- Kill one NestJS instance, verify load balancer routes to healthy instance
```
