# Food Village POS — Error Handling Strategy

> **Principle:** A food court POS cannot "crash." Errors must be caught, contained, and recovered from — silently where possible, gracefully where not. A kitchen screen that stops showing orders means food doesn't get made.

---

## Table of Contents

1. [Error Philosophy](#1-error-philosophy)
2. [Error Classification](#2-error-classification)
3. [Frontend Error Handling](#3-frontend-error-handling)
4. [Backend Error Handling (NestJS)](#4-backend-error-handling-nestjs)
5. [API Error Response Format](#5-api-error-response-format)
6. [Real-Time Connection Errors](#6-real-time-connection-errors)
7. [Payment Error Handling](#7-payment-error-handling)
8. [Offline & Network Errors](#8-offline--network-errors)
9. [Order Flow Error Scenarios](#9-order-flow-error-scenarios)
10. [Error Logging & Monitoring](#10-error-logging--monitoring)
11. [User-Facing Error Messages](#11-user-facing-error-messages)
12. [Error Recovery Patterns](#12-error-recovery-patterns)

---

## 1. Error Philosophy

**Hierarchy of error response priority:**

1. **Never lose an order** — if an order was placed and paid for, it MUST reach the kitchen. Even if it means falling back to a printed ticket.
2. **Never lose money** — payment failures must be idempotent. No double charges. No phantom payments.
3. **Keep the kitchen running** — KDS screens must never show a blank state. If real-time fails, poll. If polling fails, show last known state with a "stale data" warning.
4. **Inform, don't alarm** — customers see friendly messages. Vendors see actionable messages. Admins see technical details.
5. **Retry before failing** — network requests get 3 retries with exponential backoff before surfacing an error.

---

## 2. Error Classification

### Severity Levels

| Level | Description | Example | Response |
|-------|-------------|---------|----------|
| **Critical** | System-breaking, affects operations | Payment gateway down, database unreachable | Alert admin immediately, activate fallback, page on-call |
| **High** | Feature-breaking, affects a workflow | KDS real-time disconnected, order routing failure | Auto-retry, show degraded state, log to monitoring |
| **Medium** | Inconvenient but workaroundable | Image upload fails, report generation timeout | Show error toast, offer retry, log |
| **Low** | Cosmetic or minor | Analytics chart fails to load, avatar missing | Silent fallback, log at debug level |

### Error Categories

```
NETWORK_ERROR          — Connection timeout, DNS failure, offline
AUTH_ERROR             — Token expired, unauthorized, forbidden
VALIDATION_ERROR       — Invalid input, missing fields, constraint violation
BUSINESS_LOGIC_ERROR   — Item sold out during checkout, vendor offline
PAYMENT_ERROR          — Stripe decline, insufficient funds, terminal disconnect
REALTIME_ERROR         — WebSocket disconnect, subscription failure
SYSTEM_ERROR           — Database error, internal server error, OOM
THIRD_PARTY_ERROR      — Stripe API error, SMS provider down, printer offline
IDEMPOTENCY_ERROR      — Duplicate request detected
RATE_LIMIT_ERROR       — Too many requests
```

---

## 3. Frontend Error Handling

### Error Boundaries

```tsx
// app/error.tsx — Global error boundary
// app/(customer)/order/error.tsx — Customer-specific error boundary
// app/(vendor)/vendor/kitchen/error.tsx — KDS-specific error boundary

// Strategy per surface:
// Customer: Friendly message + "Try Again" button + "Ask your waiter" fallback
// KDS: "Connection issue" banner at top, keep showing last known orders below
// Admin: Technical error details + stack trace in expandable section
```

### React Query Error Handling

```typescript
// Global error handler for all API queries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 30_000,                    // 30s before refetch
      onError: (error) => {
        if (error.status === 401) {
          // Token expired — redirect to login
          authStore.getState().logout();
          return;
        }
        if (error.status === 403) {
          // Wrong role — show forbidden page
          router.push('/unauthorized');
          return;
        }
        // All other errors: show toast
        toast.error(getHumanReadableError(error));
      }
    },
    mutations: {
      retry: 1,                              // Mutations get 1 retry (idempotency key prevents duplicates)
      onError: (error) => {
        toast.error(getHumanReadableError(error));
      }
    }
  }
});
```

### Toast Notification System

```typescript
// Error toasts auto-dismiss after 5 seconds
// Critical errors persist until dismissed
// Payment errors show with a unique style (red border, no auto-dismiss)

type ToastLevel = 'info' | 'success' | 'warning' | 'error' | 'critical';

interface ErrorToast {
  level: ToastLevel;
  message: string;
  action?: { label: string; onClick: () => void };  // "Retry", "Contact Support"
  persistent?: boolean;
  id?: string;                                        // Prevent duplicate toasts
}
```

### Form Validation Errors

```typescript
// Client-side validation: Zod schemas matching backend DTOs
// Server-side validation: NestJS class-validator pipes
// Display: inline field errors + summary at top of form

// Error state per field:
interface FieldError {
  field: string;
  message: string;           // "Price must be greater than $0"
  code: string;              // "VALIDATION_MIN_VALUE"
}
```

---

## 4. Backend Error Handling (NestJS)

### Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log to monitoring
    this.logger.error({
      ...errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
      requestId: request.headers['x-request-id'],
      userId: request.user?.id,
      vendorId: request.user?.vendorId,
      path: request.url,
      method: request.method,
      body: this.sanitizeBody(request.body),
    });

    response.status(errorResponse.status).json(errorResponse);
  }
}
```

### Custom Exception Classes

```typescript
// Business logic exceptions
export class ItemSoldOutException extends HttpException {
  constructor(itemId: string) {
    super({
      code: 'ITEM_SOLD_OUT',
      message: 'This item is no longer available',
      details: { itemId }
    }, HttpStatus.CONFLICT);
  }
}

export class VendorOfflineException extends HttpException { ... }
export class InsufficientFundsException extends HttpException { ... }
export class OrderAlreadyAcceptedException extends HttpException { ... }
export class DuplicateOrderException extends HttpException { ... }
export class PaymentSplitFailedException extends HttpException { ... }
export class RefundExceedsPaymentException extends HttpException { ... }
```

### Request Validation

```typescript
// All DTOs validated via class-validator decorators
// Validation pipe runs before controller method

@UsePipes(new ValidationPipe({
  whitelist: true,              // Strip unknown properties
  forbidNonWhitelisted: true,   // Reject unknown properties
  transform: true,              // Auto-transform types
  exceptionFactory: (errors) => {
    const messages = errors.map(err => ({
      field: err.property,
      constraints: Object.values(err.constraints || {}),
    }));
    return new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      errors: messages,
    });
  }
}))
```

---

## 5. API Error Response Format

### Standard Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "ITEM_SOLD_OUT",
    "message": "This item is no longer available",
    "status": 409,
    "details": {
      "itemId": "item_burger_01",
      "itemName": "Classic Burger",
      "vendorId": "vendor_01"
    },
    "requestId": "req_abc123def456",
    "timestamp": "2024-01-15T12:30:45Z"
  }
}
```

### Error Code Catalog

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request body failed validation |
| `INVALID_MODIFIER_SELECTION` | 400 | Modifier requirements not met |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `TOKEN_EXPIRED` | 401 | JWT expired, need refresh |
| `FORBIDDEN` | 403 | Role doesn't have permission |
| `VENDOR_ACCESS_DENIED` | 403 | Vendor accessing another vendor's data |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `ORDER_NOT_FOUND` | 404 | Order ID not found |
| `VENDOR_NOT_FOUND` | 404 | Vendor ID not found |
| `ITEM_SOLD_OUT` | 409 | Item became unavailable during ordering |
| `VENDOR_OFFLINE` | 409 | Vendor is not accepting orders |
| `ORDER_ALREADY_ACCEPTED` | 409 | Can't cancel an accepted order |
| `DUPLICATE_ORDER` | 409 | Idempotency key already used |
| `ORDER_STATUS_INVALID_TRANSITION` | 409 | Invalid status change (e.g., "pending" → "ready") |
| `PAYMENT_DECLINED` | 402 | Card declined |
| `PAYMENT_FAILED` | 402 | Payment processing error |
| `REFUND_EXCEEDS_PAYMENT` | 422 | Refund amount > original payment |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `STRIPE_ERROR` | 502 | Stripe API returned error |
| `SERVICE_UNAVAILABLE` | 503 | System in maintenance mode |

---

## 6. Real-Time Connection Errors

### WebSocket Reconnection Strategy

```typescript
// Supabase Realtime auto-reconnects, but we add our own layer

const RECONNECT_INTERVALS = [1000, 2000, 5000, 10000, 30000]; // Escalating backoff

class RealtimeManager {
  private reconnectAttempt = 0;
  private isConnected = false;

  onDisconnect() {
    this.isConnected = false;

    // Show banner on KDS: "⚠️ Live updates paused — reconnecting..."
    showConnectionBanner('warning', 'Live updates paused — reconnecting...');

    // Start polling fallback after 5 seconds of disconnection
    setTimeout(() => {
      if (!this.isConnected) {
        this.startPollingFallback();
      }
    }, 5000);

    this.attemptReconnect();
  }

  onReconnect() {
    this.isConnected = true;
    this.reconnectAttempt = 0;

    // Fetch any missed updates
    this.syncMissedUpdates();

    // Remove warning banner
    hideConnectionBanner();

    // Stop polling fallback
    this.stopPollingFallback();
  }

  // Polling fallback: GET /api/kds/orders every 10 seconds
  startPollingFallback() { ... }
}
```

### KDS Specific Resilience

The KDS screen is the most critical real-time surface. Error handling priorities:

1. **WebSocket connected** → real-time updates (normal mode)
2. **WebSocket disconnected < 5s** → show warning banner, keep last known state
3. **WebSocket disconnected > 5s** → switch to polling mode (every 10s)
4. **Polling fails** → show "Connection Lost" overlay with manual refresh button
5. **Offline** → show cached orders with "OFFLINE — data may be stale" banner

---

## 7. Payment Error Handling

Payment is the highest-stakes error domain. Every scenario must be handled.

### Stripe Terminal Errors

| Scenario | Error | Recovery |
|----------|-------|----------|
| Card declined | `card_declined` | Show "Card declined — try another card or pay with cash" |
| Insufficient funds | `insufficient_funds` | Show "Insufficient funds" message |
| Terminal disconnected | `terminal_offline` | "Card reader disconnected — check device and try again" |
| Network error during payment | `network_error` | "Network error — your card was NOT charged. Try again." |
| Payment confirmed, but split fails | Backend error | Payment is captured. Queue split for retry. Mark order as "payment processing." |
| Timeout | `request_timeout` | Check payment intent status. If confirmed → proceed. If not → show retry. |

### Idempotency for Payment Safety

```typescript
// Every payment request includes idempotency key
// Stripe handles duplicate payment intents
// Our backend handles duplicate order creation

const createOrder = async (cart: Cart) => {
  const idempotencyKey = `order_${sessionId}_${Date.now()}`;

  // If this exact key was used before, Stripe/our API returns the original result
  // Not a new charge. Not a duplicate order.
  const response = await api.post('/orders', {
    ...cartPayload,
    idempotency_key: idempotencyKey
  });
};
```

### Payment Split Failure Recovery

```
1. Customer pays $30 (single Stripe charge)
2. Backend tries to split:
   - $10 to Vendor 1 ✅
   - $15 to Vendor 2 ❌ (Stripe transfer fails)
   - $5 to Vendor 3 ✅
3. Failed split queued in `payment_split_retries` table
4. BullMQ job retries every 5 minutes (max 10 retries)
5. After 10 failures → alert admin for manual resolution
6. Order still routes to kitchen regardless (customer already paid)
```

---

## 8. Offline & Network Errors

### Offline Detection

```typescript
// Multiple detection strategies:
// 1. navigator.onLine (basic)
// 2. Periodic ping to /api/health (reliable)
// 3. WebSocket connection state (real-time)

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerReachable, setIsServerReachable] = useState(true);

  // Ping health endpoint every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
        setIsServerReachable(true);
      } catch {
        setIsServerReachable(false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isOnline: isOnline && isServerReachable };
};
```

### Offline Behavior Per Surface

| Surface | Offline Behavior |
|---------|-----------------|
| **Customer iPad** | Show "No connection" overlay. Cart preserved in local state. Block checkout. |
| **KDS** | Show "OFFLINE" banner. Display cached orders. Block status updates. Queue actions for sync. |
| **Vendor Dashboard** | Show "Offline" badge. Reports show cached data with "stale" warning. |
| **Admin Dashboard** | Show "Offline" badge. All data marked as potentially stale. |
| **Display Board** | Show last known state. "Updates paused" message. Auto-recover on reconnect. |

### Queued Action Sync

```typescript
// When offline, mutations are queued in IndexedDB
// When back online, queue is flushed in order

interface QueuedAction {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'PUT';
  payload: any;
  idempotencyKey: string;
  timestamp: number;
  retries: number;
}

// On reconnect:
// 1. Flush queue in chronological order
// 2. Skip if idempotency key already processed (server returns 409)
// 3. Show sync progress: "Syncing 3 pending actions..."
// 4. On complete: "All caught up ✓"
```

---

## 9. Order Flow Error Scenarios

### Scenario: Item becomes sold out during checkout

```
1. Customer adds Burger to cart (available: true)
2. Another customer orders the last Burger
3. Vendor marks Burger as sold out
4. Supabase Realtime fires menu.item.availability_changed
5. Customer app receives event:
   - Cart shows Burger with "Sold Out" badge and strikethrough
   - Toast: "Classic Burger is no longer available"
   - "Remove" button highlighted
   - Checkout blocked until sold-out items removed
```

### Scenario: Vendor goes offline after order placed

```
1. Customer orders from 3 vendors. Payment confirmed.
2. Vendor 2 goes offline (closes tablet, internet drops).
3. Order items for Vendor 2 stay in "pending" status.
4. After 2 minutes with no "accepted" status:
   - Admin gets alert: "Vendor 2 has not accepted order #047"
   - Customer status screen shows: "Pizza Palace — Waiting for confirmation"
5. After 5 minutes:
   - Admin can manually reassign or cancel those items
   - Customer gets updated notification
```

### Scenario: Kitchen rejects an item

```
1. Order #047 has: Burger (V1), Pizza (V2), Juice (V3)
2. Vendor 2 rejects Pizza: "Out of dough"
3. System:
   - Order item status → "rejected"
   - Customer notification: "Pizza Palace can't prepare Margherita Pizza — Reason: Out of dough"
   - Refund auto-initiated for Pizza amount ($15)
   - Payment split recalculated (Vendor 2 gets $0)
   - Other items continue normally
   - Admin sees refund in finance dashboard
```

---

## 10. Error Logging & Monitoring

### Logging Strategy

```typescript
// Structured JSON logging in NestJS

// Levels:
// ERROR — exceptions, failed operations (always logged)
// WARN — degraded state, retries, slow queries (always logged)
// INFO — successful operations, state changes (production)
// DEBUG — request/response details (staging only)

interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  requestId: string;
  userId?: string;
  vendorId?: string;
  traceId?: string;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  context: {
    service: string;        // 'order-service', 'payment-service'
    method: string;         // 'createOrder', 'processPayment'
    duration_ms?: number;
  };
  metadata?: Record<string, any>;
  timestamp: string;
}
```

### Monitoring Alerts

| Alert | Condition | Channel |
|-------|-----------|---------|
| Payment failure spike | >5 payment failures in 5 min | PagerDuty + Slack |
| Database connection pool exhausted | Available connections < 5 | PagerDuty |
| KDS screen offline | Any vendor KDS heartbeat missing > 3 min | Slack + Admin dashboard |
| Order stuck in pending | Order item "pending" > 5 min | Admin dashboard alert |
| API error rate spike | 5xx rate > 5% in 5 min | PagerDuty |
| Realtime disconnection wave | >3 clients disconnect simultaneously | Slack |
| Payment split retry exhausted | Split retry count > 10 | PagerDuty + Admin alert |
| Disk space low | <10% remaining | PagerDuty |

---

## 11. User-Facing Error Messages

### Message Tone Per Role

**Customer messages:** Friendly, non-technical, action-oriented
```
❌ "Something went wrong"
✅ "We couldn't process your order. Please try again or ask your waiter for help."
```

**Vendor messages:** Clear, actionable, include context
```
❌ "Error 500"
✅ "Couldn't update item status. Check your connection and try again. If the issue persists, contact support."
```

**Admin messages:** Technical, detailed, include error codes
```
✅ "Payment split failed for Vendor 2 (stripe_error: transfer_insufficient_funds). Retry queued. Reference: req_abc123"
```

### Common Messages

| Scenario | Customer | Vendor/Admin |
|----------|----------|-------------|
| Network down | "No internet connection. Please check your connection." | "Connection lost. Reconnecting..." |
| Server error | "We're having trouble right now. Please try again in a moment." | "Server error (500). Request ID: req_abc. Check logs." |
| Card declined | "Your card was declined. Please try another card or pay with cash." | N/A |
| Item sold out | "Sorry, Classic Burger is no longer available." | "Classic Burger marked as sold out." |
| Session expired | "Your session has expired. Let's start a new order." | "Session expired. Please log in again." |

---

## 12. Error Recovery Patterns

### Circuit Breaker

```typescript
// For external service calls (Stripe, SMS, printer)
// After N consecutive failures, stop trying for a cooldown period

class CircuitBreaker {
  private failureCount = 0;
  private lastFailure: Date | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  private readonly threshold = 5;           // Failures before opening
  private readonly cooldownMs = 30_000;     // 30s cooldown

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure!.getTime() > this.cooldownMs) {
        this.state = 'half-open';
      } else {
        throw new CircuitOpenError('Service temporarily unavailable');
      }
    }
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
}
```

### Retry with Exponential Backoff

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; baseDelay: number; maxDelay: number }
): Promise<T> {
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === options.maxRetries) throw error;
      if (!isRetryable(error)) throw error;

      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        options.maxDelay
      );
      await sleep(delay);
    }
  }
}

// Retryable: network errors, 502, 503, 429
// Not retryable: 400, 401, 403, 404, 409, 422
```

### Dead Letter Queue

```typescript
// For critical failed operations that can't be retried automatically
// Stored in database for manual admin resolution

interface DeadLetterEntry {
  id: string;
  type: 'payment_split' | 'refund' | 'notification' | 'payout';
  payload: any;
  error: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  lastAttemptAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Admin can view and manually resolve dead letter entries
// GET /api/admin/dead-letters
// POST /api/admin/dead-letters/{id}/retry
// POST /api/admin/dead-letters/{id}/resolve
```
