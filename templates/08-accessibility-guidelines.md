# Food Village POS — Accessibility Guidelines

> **Standard:** WCAG 2.1 Level AA (minimum), Level AAA for critical flows (ordering, payment)
> **Context:** A public-facing food court system used by diverse customers — including elderly diners, people with motor impairments, low-vision users, and non-native English speakers. Accessibility is not optional; it's a legal requirement under ADA for public accommodations.

---

## Table of Contents

1. [Accessibility Philosophy](#1-accessibility-philosophy)
2. [WCAG 2.1 Compliance Matrix](#2-wcag-21-compliance-matrix)
3. [Visual Accessibility](#3-visual-accessibility)
4. [Motor & Touch Accessibility](#4-motor--touch-accessibility)
5. [Screen Reader Support](#5-screen-reader-support)
6. [Keyboard Navigation](#6-keyboard-navigation)
7. [Cognitive Accessibility](#7-cognitive-accessibility)
8. [Multi-Language Support](#8-multi-language-support)
9. [Assistive Technology Compatibility](#9-assistive-technology-compatibility)
10. [Surface-Specific Guidelines](#10-surface-specific-guidelines)
11. [Testing & Audit Checklist](#11-testing--audit-checklist)
12. [Developer Implementation Guide](#12-developer-implementation-guide)

---

## 1. Accessibility Philosophy

**1. Inclusive by default** — Accessibility is baked into component design, not bolted on. Every component in the library ships with ARIA attributes, keyboard support, and contrast-safe colors.

**2. Multiple modalities** — Every piece of information is conveyed through at least two channels: visual + text, color + shape, sound + visual. Never rely on color alone.

**3. Graceful degradation** — If JavaScript fails, core content (menu, prices) remains readable. If CSS fails, semantic HTML provides structure. If images fail, alt text conveys the information.

**4. Real-world context** — Customers are in a bright, noisy food court. They may have greasy fingers, be holding a child, or be standing. The UI must work under sub-optimal conditions.

---

## 2. WCAG 2.1 Compliance Matrix

### Level A (Must Meet)

| Criterion | Description | Our Implementation |
|-----------|-------------|-------------------|
| 1.1.1 Non-text Content | All images have alt text | Menu item images: descriptive alt. Decorative images: `alt=""` |
| 1.3.1 Info and Relationships | Structure conveyed semantically | Proper heading hierarchy, form labels, table headers |
| 1.3.2 Meaningful Sequence | Reading order matches visual order | DOM order matches tab order and visual layout |
| 1.4.1 Use of Color | Color not sole means of conveying info | Status uses color + icon + text label always |
| 2.1.1 Keyboard | All functionality via keyboard | All interactive elements focusable and operable |
| 2.4.1 Bypass Blocks | Skip to main content | Skip-nav link on every page |
| 2.4.2 Page Titled | Pages have descriptive titles | "Menu — Burger Booth — Food Village" |
| 3.1.1 Language of Page | Page language declared | `<html lang="en">` |
| 3.3.1 Error Identification | Errors identified to user | Form errors linked to fields, described in text |
| 4.1.1 Parsing | Valid HTML | Clean semantic HTML, no duplicate IDs |
| 4.1.2 Name, Role, Value | Custom controls have ARIA | All custom components have appropriate roles |

### Level AA (Target)

| Criterion | Description | Our Implementation |
|-----------|-------------|-------------------|
| 1.4.3 Contrast (Minimum) | 4.5:1 text, 3:1 large text | All color combinations tested. See Color Contrast table |
| 1.4.4 Resize Text | Content usable at 200% zoom | Responsive layout, no horizontal scroll at 200% |
| 1.4.11 Non-text Contrast | 3:1 for UI components | Buttons, inputs, icons all meet 3:1 against background |
| 2.4.3 Focus Order | Focus order matches content flow | Tab order follows visual reading order |
| 2.4.6 Headings and Labels | Headings describe content | Descriptive, hierarchical headings on every page |
| 2.4.7 Focus Visible | Keyboard focus is visible | Custom focus ring: 3px orange outline with offset |
| 3.2.3 Consistent Navigation | Navigation consistent across pages | Same sidebar/header on all pages within a role |
| 3.3.2 Labels or Instructions | Inputs have labels | All form inputs have visible labels |
| 3.3.3 Error Suggestion | Error messages suggest fix | "Price must be a number greater than 0" |

---

## 3. Visual Accessibility

### Color Contrast Requirements

All text-on-background combinations must meet these minimums:

| Text Type | Minimum Ratio | Example |
|-----------|:------------:|---------|
| Body text (< 18px) | 4.5:1 | Neutral-800 on white = 15.4:1 ✅ |
| Large text (≥ 18px bold or ≥ 24px) | 3:1 | Neutral-600 on white = 7.0:1 ✅ |
| Interactive elements | 3:1 | Brand orange on white = 3.1:1 ✅ (barely passes — use on large text only) |
| Disabled text | N/A (exempt) | Neutral-300 on white |
| Placeholder text | 4.5:1 | Neutral-500 on Neutral-100 = 4.6:1 ✅ |

### Color Contrast Audit for Status Colors

| Status | Foreground | Background | Ratio | Meets AA |
|--------|-----------|------------|:-----:|:--------:|
| Pending (text) | #92400E | #FFFBEB | 6.2:1 | ✅ |
| Accepted (text) | #1E40AF | #EFF6FF | 8.1:1 | ✅ |
| Preparing (text) | #5B21B6 | #F5F3FF | 7.3:1 | ✅ |
| Ready (text) | #065F46 | #ECFDF5 | 7.9:1 | ✅ |
| Rejected (text) | #991B1B | #FEF2F2 | 7.1:1 | ✅ |

**Important:** Status badge colors (#F59E0B, #10B981, etc.) are NEVER used alone. They always pair with a text label and icon.

### Never Rely on Color Alone

```
Order Status Communication:
✅ CORRECT:
  [🟡 ⏱️ Pending]    — Color + icon + text
  [🟢 ✅ Ready]       — Color + icon + text

❌ WRONG:
  [🟡]                — Color only, no meaning without vision
  [●]                 — Dot color only
```

### Focus Indicators

```css
/* All interactive elements get a visible focus ring */
:focus-visible {
  outline: 3px solid var(--color-interactive-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* High contrast mode: thicker outline */
@media (forced-colors: active) {
  :focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }
}

/* Focus ring must be visible on all backgrounds */
/* On dark backgrounds (KDS, display board): */
[data-theme="dark"] :focus-visible {
  outline-color: #FFA861;     /* Lighter orange for visibility */
}
```

### Text Sizing & Readability

```
Minimum body text:          14px (admin), 16px (vendor), 18px (customer iPad)
Minimum button label:       14px
Minimum touch target label: 16px
Line height:               ≥ 1.5 for body text
Letter spacing:            ≥ 0 for body text (no negative tracking)
Max line length:           80 characters (optimal: 60-70)
Paragraph spacing:         ≥ 1.5× font size
```

### High Contrast Mode Support

```css
@media (prefers-contrast: high) {
  :root {
    --color-text-primary: #000000;
    --color-text-secondary: #1A1A1A;
    --color-border-primary: #000000;
    --color-surface-primary: #FFFFFF;
    --color-interactive-primary: #0000CC;
  }
}

@media (forced-colors: active) {
  /* Let the OS handle colors */
  .badge, .status-indicator {
    forced-color-adjust: none;     /* Preserve our status colors */
    border: 2px solid ButtonText;  /* Add border for shape distinction */
  }
}
```

---

## 4. Motor & Touch Accessibility

### Touch Target Sizes

```
Minimum touch target:         44px × 44px (WCAG 2.1)
Recommended touch target:     48px × 48px (Material Design)
Our standard (iPad customer):  56px × 56px (exceeds both)
Spacing between targets:      ≥ 8px (prevents accidental taps)
```

### Touch Target Audit

| Component | Target Size | Meets WCAG | Notes |
|-----------|:-----------:|:----------:|-------|
| CTA Button (customer) | 56px tall | ✅ AAA | Full-width on mobile |
| Menu item card | 100% width, 80px tall | ✅ AAA | Large tap area |
| Quantity +/- buttons | 48px × 48px | ✅ AA | Spaced 8px apart |
| Modifier checkbox | 44px × 44px | ✅ AA | Tap area extends to label |
| Cart remove button | 44px × 44px | ✅ AA | Swipe to reveal + tap |
| KDS accept button | 56px tall, 120px wide | ✅ AAA | Kitchen staff tap speed |
| Admin table row | 100% width, 48px tall | ✅ AA | |
| Sidebar nav item | 48px tall | ✅ AA | |
| Close (X) button | 44px × 44px | ✅ AA | Includes padding as target |

### Gesture Alternatives

Every gesture-based action has a button alternative:

| Gesture | Alternative | Where |
|---------|------------|-------|
| Swipe left to delete cart item | "Remove" button | Cart view |
| Swipe down to dismiss modal | "X" close button | All modals |
| Pull to refresh | "Refresh" button in header | Vendor dashboard |
| Pinch to zoom | Not supported (fixed layout) | iPad customer app |
| Long press | Not used | System-wide policy |

### Motor Impairment Accommodations

```
- No time-limited interactions (except payment timeout, which has a generous 5-minute window)
- No drag-and-drop as sole interaction method
- Double-tap prevention: debounce all buttons by 300ms
- Accidental touch protection: confirm before destructive actions
- Large spacing between opposite actions ("Confirm" and "Cancel" are never adjacent)
```

---

## 5. Screen Reader Support

### ARIA Implementation

```tsx
// Menu item card
<article
  role="listitem"
  aria-label={`${item.name}, ${formatPrice(item.price)}, from ${vendor.name}`}
>
  <img src={item.imageUrl} alt={`Photo of ${item.name}`} />
  <h3>{item.name}</h3>
  <p aria-label={`Price: ${formatPrice(item.price)}`}>{formatPrice(item.price)}</p>
  {item.isSoldOut && (
    <span role="status" aria-live="polite">Sold out</span>
  )}
  <div aria-label="Dietary information" role="list">
    {item.dietaryTags.map(tag => (
      <span role="listitem" key={tag}>{DIETARY_LABELS[tag]}</span>
    ))}
  </div>
</article>

// Cart summary (updates announce to screen readers)
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  aria-label={`Cart: ${itemCount} items, total ${formatPrice(total)}`}
>
  🛒 {itemCount} items · {formatPrice(total)}
</div>

// Order status (live region for real-time updates)
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="false"
>
  {statusChange && `${item.name} from ${vendor.name} is now ${statusLabel}`}
</div>

// KDS order card
<article
  role="article"
  aria-label={`Order ${tokenNumber}, table ${tableNumber}, ${itemName}, status: ${status}`}
>
  ...
</article>
```

### Live Regions for Real-Time Updates

```tsx
// Customer order tracking — polite announcements
<div role="status" aria-live="polite">
  {/* Announces when item status changes */}
  Your Margherita Pizza from Pizza Palace is now ready for pickup!
</div>

// KDS new order — assertive announcement
<div role="alert" aria-live="assertive">
  {/* Immediately announces new order */}
  New order: Token 47, Table 5. Classic Burger with Extra Cheese.
</div>

// Error messages — assertive
<div role="alert" aria-live="assertive" aria-atomic="true">
  Your card was declined. Please try another card or pay with cash.
</div>
```

### Screen Reader Navigation Landmarks

```html
<!-- Customer page structure -->
<header role="banner">Food Village — Table 5</header>
<nav role="navigation" aria-label="Vendor categories">...</nav>
<main role="main" aria-label="Menu items">...</main>
<footer role="contentinfo">
  <div role="status" aria-label="Cart summary">...</div>
</footer>

<!-- Vendor dashboard -->
<nav role="navigation" aria-label="Vendor navigation">...</nav>
<main role="main">
  <h1>Dashboard</h1>
  <section aria-label="Today's statistics">...</section>
  <section aria-label="Active orders">...</section>
</main>
```

---

## 6. Keyboard Navigation

### Tab Order

```
Customer ordering flow:
1. Skip to main content link (hidden until focused)
2. Vendor category filter chips (left → right)
3. Vendor cards / menu items (left → right, top → bottom)
4. Active modal content (when open, focus trapped inside)
5. Cart summary bar (always accessible)

Vendor KDS:
1. Column tabs (New → Preparing → Ready)
2. Order cards within active column (top → bottom)
3. Action button on focused card (Enter to activate)

Admin dashboard:
1. Sidebar navigation (top → bottom)
2. Main content area
3. Filter/search controls
4. Data table (rows navigable with arrow keys)
```

### Keyboard Shortcuts

```
Global:
  / or Cmd+K      → Focus search bar
  Escape           → Close modal/drawer, deselect

Customer iPad (with keyboard attached):
  Tab              → Next interactive element
  Enter/Space      → Activate button, select item
  Escape           → Close modal, go back

Vendor KDS:
  A                → Accept focused order
  P                → Start preparing
  R                → Mark ready
  C                → Complete/picked up
  Arrow Up/Down    → Navigate orders in column
  Arrow Left/Right → Switch columns

Admin:
  G then D         → Go to Dashboard
  G then O         → Go to Orders
  G then V         → Go to Vendors
  G then F         → Go to Finance
```

### Focus Management

```typescript
// Modal focus trap
const ModifierModal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // 1. Save previously focused element
      const previousFocus = document.activeElement;

      // 2. Move focus into modal
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (firstFocusable as HTMLElement)?.focus();

      // 3. Trap focus within modal (Tab cycles inside)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') trapFocus(e, modalRef.current!);
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // 4. Restore focus on close
        (previousFocus as HTMLElement)?.focus();
      };
    }
  }, [isOpen]);
};
```

---

## 7. Cognitive Accessibility

### Clear Language

```
Principles:
- Use plain, direct language (6th grade reading level)
- Avoid jargon: "Your order is being prepared" not "Order status: processing"
- Use consistent terminology: always "cart" (never "basket" or "bag")
- Action labels describe the outcome: "Place Order" not "Submit"
- Error messages explain what to do: "Enter a valid email address" not "Invalid input"
```

### Predictable Behavior

```
- Navigation is consistent across all pages (same sidebar, same header)
- Buttons that look the same do the same thing everywhere
- No unexpected context changes (page navigations, popup windows)
- Confirmation before destructive actions (removing items, canceling orders)
- "Back" always goes to the previous step, never skips
```

### Visual Hierarchy & Scannability

```
- One primary action per screen (single CTA button, visually dominant)
- Maximum 3 levels of information hierarchy per screen
- Group related information visually (Gestalt proximity)
- Use progressive disclosure: basic info visible, details expandable
- Modifier modal: required selections clearly marked with asterisk + "(Required)"
```

### Reduce Cognitive Load

```
- Cart shows running total at all times (no mental math)
- Token number is prominently displayed (no need to remember)
- Status uses consistent iconography across all surfaces
- Maximum 7 ± 2 items visible per category before scrolling
- Search/filter available on all list views
```

---

## 8. Multi-Language Support

### i18n Architecture

```typescript
// next-intl for internationalization
// All user-facing strings in translation files, never hardcoded

// File structure:
// messages/en.json
// messages/es.json
// messages/zh.json
// messages/vi.json    (Vietnamese — significant US food court demographic)
// messages/ko.json    (Korean)

// Locale detection: browser language → default to English
// Admin can set default locale per food village
// Customer can switch language on welcome screen
```

### Translation Guidelines

```
- Menu item names remain in original language (vendor controls these)
- UI labels, buttons, status messages are all translated
- Error messages translated
- Currency formatting follows locale (but always USD amount)
- Date/time formatting follows locale
- Numbers follow locale (1,000.00 vs 1.000,00)
- Right-to-left (RTL) layout support for Arabic (future)
```

### Language Selector

```
Welcome screen shows language option:
[English] [Español] [中文] [Tiếng Việt] [한국어]

- Icons with language names in their own script (not flags — flags represent countries, not languages)
- Selection persisted in session
- All subsequent screens render in chosen language
- Vendor-specific content (menu items, descriptions) stays in vendor's original language
  with optional translation overlay
```

---

## 9. Assistive Technology Compatibility

### VoiceOver (iPad)

```
Testing requirements:
- All menu items navigable with VoiceOver swipe gestures
- Item price announced with item name
- Sold-out status announced
- Cart additions confirmed via announcement
- Modifier selection announced ("Selected: Extra Cheese, plus two dollars")
- Payment flow fully navigable
- Token number clearly announced on confirmation
```

### Switch Control (iPad)

```
- All interactive elements reachable via switch scanning
- Focus order is logical and efficient
- No time-sensitive interactions that can't be paused
- Auto-scanning speed adjustable (system setting)
```

### Reduce Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

  /* Keep functional animations but reduce them */
  .new-order-pulse {
    animation: none;
    /* Replace with static highlight border instead */
    border: 3px solid var(--color-order-pending);
  }

  .cart-bounce {
    animation: none;
  }

  .ready-flash {
    animation: none;
    /* Static green background instead of flashing */
    background-color: var(--color-order-ready);
  }
}
```

---

## 10. Surface-Specific Guidelines

### Customer iPad

| Requirement | Implementation |
|-------------|---------------|
| Large touch targets | All CTAs ≥ 56px height |
| Clear visual hierarchy | Single primary CTA per screen |
| Cart accessibility | Running total always announced, item count in aria-live |
| Modifier selection | Radio groups with proper ARIA, required fields marked |
| Payment flow | Step indicator with aria-current, clear error states |
| Session timeout | Warning 30s before timeout, option to extend |
| Font size | Minimum 18px body text |
| Language support | Language selector on welcome screen |

### Vendor KDS

| Requirement | Implementation |
|-------------|---------------|
| High contrast | Dark mode default with AA+ contrast ratios |
| Audio alerts | Configurable chime volume, visual flash as backup |
| Quick actions | Large buttons (56px+), keyboard shortcuts |
| Timer visibility | Large monospace timer, color changes at thresholds |
| Modifier emphasis | Special instructions in high-contrast yellow banner |
| Screen reader | Order cards announce token, table, items, modifiers |

### Admin Dashboard

| Requirement | Implementation |
|-------------|---------------|
| Data table accessibility | Column headers, sortable indicators, row selection announced |
| Chart accessibility | All charts have tabular data alternative |
| Complex forms | Fieldset/legend grouping, clear error messages |
| Keyboard navigation | Full keyboard operability, shortcuts for common actions |

### Display Board (TV)

| Requirement | Implementation |
|-------------|---------------|
| Readability from distance | Token numbers ≥ 48px at 1080p |
| High contrast | Dark background, white/green text |
| No reliance on audio | All information visual (screen in noisy food court) |
| Auto-scroll | Smooth, predictable scrolling for overflow content |
| Color coding + shape | Ready tokens have both green color AND checkmark icon |

---

## 11. Testing & Audit Checklist

### Automated Testing

```
- [ ] axe-core integration in unit tests (catches ~57% of WCAG issues)
- [ ] jest-axe for component-level accessibility assertions
- [ ] Lighthouse accessibility audit score ≥ 95 for all pages
- [ ] ESLint plugin jsx-a11y for compile-time checks
- [ ] Storybook a11y addon for component-level testing
- [ ] CI pipeline blocks on new accessibility violations
```

### Manual Testing Checklist

```
Keyboard-only navigation:
- [ ] Can complete full ordering flow without mouse/touch
- [ ] Can navigate KDS and change order statuses
- [ ] Can navigate admin dashboard and all sub-pages
- [ ] Focus visible on every interactive element
- [ ] No focus traps (except modals)
- [ ] Escape closes all modals and drawers
- [ ] Tab order matches visual reading order

Screen reader (VoiceOver on iPad):
- [ ] All menu items announced with name, price, vendor
- [ ] Sold-out items announced as unavailable
- [ ] Cart changes announced via live region
- [ ] Order status updates announced
- [ ] Form errors announced when they appear
- [ ] Modal content read on open, focus returned on close
- [ ] Token number clearly announced on confirmation

Visual:
- [ ] All text meets 4.5:1 contrast (AA)
- [ ] UI components meet 3:1 contrast (AA)
- [ ] Content readable at 200% zoom
- [ ] No information conveyed by color alone
- [ ] Focus indicators visible on all backgrounds
- [ ] Reduced motion respected

Touch/Motor:
- [ ] All touch targets ≥ 44px
- [ ] No gestures required without button alternative
- [ ] No time-limited interactions
- [ ] Sufficient spacing between destructive and constructive actions
```

### Testing Tools

```
Automated:
- axe DevTools (browser extension)
- Lighthouse (built into Chrome)
- WAVE (web accessibility evaluation)
- Pa11y (CLI for CI integration)

Manual:
- VoiceOver (iPad, macOS)
- NVDA (Windows, if admin dashboard)
- Keyboard-only testing (unplug mouse)
- Color contrast analyzers (WebAIM)
- Screen magnification testing (200%, 400%)
```

---

## 12. Developer Implementation Guide

### Component Accessibility Patterns

```tsx
// Pattern: Interactive card with image
<article
  role="listitem"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label={`${item.name}, ${formatPrice(item.price)}, tap to view details`}
>
  <img src={item.imageUrl} alt={`${item.name}`} loading="lazy" />
  <div>
    <h3 id={`item-${item.id}-name`}>{item.name}</h3>
    <p aria-label={`Price: ${formatPrice(item.price)}`}>
      {formatPrice(item.price)}
    </p>
  </div>
</article>

// Pattern: Form with validation
<form onSubmit={handleSubmit} noValidate aria-label="Create menu item">
  <fieldset>
    <legend>Basic Information</legend>
    <div>
      <label htmlFor="item-name">
        Item Name <span aria-label="required">*</span>
      </label>
      <input
        id="item-name"
        type="text"
        required
        aria-required="true"
        aria-invalid={!!errors.name}
        aria-describedby={errors.name ? 'name-error' : undefined}
      />
      {errors.name && (
        <p id="name-error" role="alert" className="error">
          {errors.name.message}
        </p>
      )}
    </div>
  </fieldset>
</form>

// Pattern: Status badge (color + icon + text)
<span
  className={`badge badge-${status}`}
  role="status"
  aria-label={`Order status: ${STATUS_LABELS[status]}`}
>
  <StatusIcon status={status} aria-hidden="true" />
  <span>{STATUS_LABELS[status]}</span>
</span>
```

### Accessibility CI Requirements

```yaml
# In CI pipeline:
accessibility-check:
  - Run axe-core on all page routes
  - Run pa11y on critical user flows:
    - Customer: welcome → browse → cart → payment → confirmation
    - Vendor: login → KDS → accept order → mark ready
    - Admin: login → dashboard → orders → refund
  - Fail build if any WCAG AA violations detected
  - Warning (non-blocking) for AAA violations
  - Generate accessibility report artifact
```
