# Food Village POS — Design System & Colors

> **Platform:** iPad (customer), Tablet (vendor KDS), Desktop (admin dashboard), TV (display board)
> **Framework:** Next.js + Tailwind CSS
> **Design philosophy:** Fast-scan, high-contrast, touch-optimized. The UI must work in bright food court lighting, with greasy fingers, at arm's length.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Color Palette](#2-color-palette)
3. [Semantic Color Tokens](#3-semantic-color-tokens)
4. [Role-Based Theming](#4-role-based-theming)
5. [Typography System](#5-typography-system)
6. [Spacing & Layout](#6-spacing--layout)
7. [Elevation & Shadows](#7-elevation--shadows)
8. [Border Radius](#8-border-radius)
9. [Iconography](#9-iconography)
10. [Motion & Animation](#10-motion--animation)
11. [Dark Mode Strategy](#11-dark-mode-strategy)
12. [Touch Targets & iPad Optimization](#12-touch-targets--ipad-optimization)
13. [KDS-Specific Design Rules](#13-kds-specific-design-rules)
14. [Display Board Design Rules](#14-display-board-design-rules)
15. [Tailwind Configuration](#15-tailwind-configuration)

---

## 1. Design Principles

**1. Scannable in 2 seconds** — Every screen must communicate its primary information within 2 seconds of glancing. Use size hierarchy, color coding, and whitespace.

**2. Touch-first, always** — Minimum 48px touch targets. No hover-dependent interactions. No tiny buttons. Every interactive element must be comfortably tappable with a thumb.

**3. Context-aware contrast** — Food courts are bright. iPad screens get direct lighting. All text must meet WCAG AAA contrast on light backgrounds. KDS screens may be in dimmer kitchen areas — support high-contrast mode.

**4. Speed over beauty** — In a kitchen, speed kills (in a good way). KDS screens prioritize information density and action speed over visual polish. Animations are functional (draw attention to new orders), never decorative.

**5. Color = meaning** — Every color communicates status, role, or urgency. Never use color purely for decoration.

---

## 2. Color Palette

### 2.1 Brand Colors

```
Brand Primary:     #FF6B35    (Warm Orange — appetite-inducing, energetic)
Brand Secondary:   #1B2D45    (Deep Navy — trust, professionalism)
Brand Accent:      #00B4D8    (Bright Cyan — freshness, modernity)
```

**Why orange?** — Color psychology research shows warm oranges stimulate appetite and create urgency (fast ordering). It's the dominant color in food branding (think food delivery apps) but we pair it with navy for professionalism since this is a B2B SaaS, not just a consumer app.

### 2.2 Neutral Palette

```
Neutral 50:    #FAFBFC    (Page backgrounds)
Neutral 100:   #F1F3F5    (Card backgrounds, input backgrounds)
Neutral 200:   #E1E5EA    (Borders, dividers)
Neutral 300:   #C5CCD6    (Disabled states, placeholder text)
Neutral 400:   #8E99A8    (Secondary text, icons)
Neutral 500:   #6B7685    (Body text secondary)
Neutral 600:   #4A5568    (Body text primary)
Neutral 700:   #2D3748    (Headings)
Neutral 800:   #1A202C    (High emphasis text)
Neutral 900:   #0D1117    (Maximum contrast)
```

### 2.3 Status Colors

```
Success:
  50:   #ECFDF5
  100:  #D1FAE5
  500:  #10B981    (Primary success green)
  600:  #059669
  700:  #047857

Warning:
  50:   #FFFBEB
  100:  #FEF3C7
  500:  #F59E0B    (Primary warning amber)
  600:  #D97706
  700:  #B45309

Error:
  50:   #FEF2F2
  100:  #FEE2E2
  500:  #EF4444    (Primary error red)
  600:  #DC2626
  700:  #B91C1C

Info:
  50:   #EFF6FF
  100:  #DBEAFE
  500:  #3B82F6    (Primary info blue)
  600:  #2563EB
  700:  #1D4ED8
```

### 2.4 Order Status Colors (Critical for KDS)

These are the most important colors in the system. They must be instantly distinguishable on KDS screens.

```
Pending:      #F59E0B / bg: #FFFBEB    (Amber — needs attention)
Accepted:     #3B82F6 / bg: #EFF6FF    (Blue — acknowledged)
Preparing:    #8B5CF6 / bg: #F5F3FF    (Purple — in progress)
Ready:        #10B981 / bg: #ECFDF5    (Green — action: pick up)
Completed:    #6B7280 / bg: #F9FAFB    (Gray — archived)
Rejected:     #EF4444 / bg: #FEF2F2    (Red — problem)
Cancelled:    #9CA3AF / bg: #F3F4F6    (Dim gray — voided)
```

### 2.5 Vendor Identification Colors

Each of the 10 booths gets a unique color for visual identification across the system (in cart grouping, KDS routing, admin dashboards).

```
Booth 1:    #FF6B35    (Orange)
Booth 2:    #3B82F6    (Blue)
Booth 3:    #10B981    (Emerald)
Booth 4:    #8B5CF6    (Purple)
Booth 5:    #EC4899    (Pink)
Booth 6:    #F59E0B    (Amber)
Booth 7:    #14B8A6    (Teal)
Booth 8:    #EF4444    (Red)
Booth 9:    #6366F1    (Indigo)
Booth 10:   #84CC16    (Lime)
```

**Usage:** Vendor color appears as a left border on order cards, a dot badge on cart items, and a section header color on grouped displays.

---

## 3. Semantic Color Tokens

Use these tokens in code, never raw hex values. This enables theming and dark mode.

```css
/* CSS Custom Properties — set at :root */

/* Surfaces */
--color-surface-primary:        #FFFFFF;
--color-surface-secondary:      #FAFBFC;
--color-surface-tertiary:       #F1F3F5;
--color-surface-elevated:       #FFFFFF;
--color-surface-overlay:        rgba(0, 0, 0, 0.5);

/* Text */
--color-text-primary:           #1A202C;
--color-text-secondary:         #4A5568;
--color-text-tertiary:          #6B7685;
--color-text-disabled:          #C5CCD6;
--color-text-inverse:           #FFFFFF;
--color-text-link:              #2563EB;
--color-text-on-brand:          #FFFFFF;

/* Interactive */
--color-interactive-primary:    #FF6B35;
--color-interactive-hover:      #E85D2C;
--color-interactive-active:     #D14F1F;
--color-interactive-disabled:   #C5CCD6;
--color-interactive-focus-ring: rgba(255, 107, 53, 0.4);

/* Borders */
--color-border-primary:         #E1E5EA;
--color-border-secondary:       #C5CCD6;
--color-border-focus:           #FF6B35;
--color-border-error:           #EF4444;

/* Status (reused from palette) */
--color-status-success:         #10B981;
--color-status-warning:         #F59E0B;
--color-status-error:           #EF4444;
--color-status-info:            #3B82F6;

/* Order Status */
--color-order-pending:          #F59E0B;
--color-order-accepted:         #3B82F6;
--color-order-preparing:        #8B5CF6;
--color-order-ready:            #10B981;
--color-order-completed:        #6B7280;
--color-order-rejected:         #EF4444;
--color-order-cancelled:        #9CA3AF;
```

---

## 4. Role-Based Theming

Each role gets a distinct accent to prevent context confusion (vendor accidentally using admin, etc).

### Customer (iPad Ordering)

```
Primary accent:   #FF6B35 (Brand Orange)
Background:       #FFFFFF
Card background:  #FAFBFC
CTA buttons:      #FF6B35 → #E85D2C on press
```
**Vibe:** Warm, appetizing, inviting. Large food images. Generous whitespace.

### Vendor (Kitchen / Dashboard)

```
Primary accent:   #1B2D45 (Navy)
Background:       #F1F3F5
Card background:  #FFFFFF
CTA buttons:      #1B2D45 → #162436 on press
KDS background:   #0D1117 (Dark mode default for KDS)
```
**Vibe:** Professional, efficient, information-dense. Speed-optimized.

### Admin

```
Primary accent:   #00B4D8 (Cyan)
Background:       #FAFBFC
Card background:  #FFFFFF
CTA buttons:      #00B4D8 → #0096B7 on press
```
**Vibe:** Dashboard-oriented. Data-rich. Clean and organized.

---

## 5. Typography System

### Font Stack

```css
--font-primary:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono:       'JetBrains Mono', 'Fira Code', monospace;
--font-display:    'Plus Jakarta Sans', var(--font-primary);
```

**Why Inter?** — Optimized for screens, excellent readability at small sizes, distinguishable characters (important for order IDs and token numbers), and variable font support.

**Why Plus Jakarta Sans?** — For display/marketing text only (welcome screen, booth names). Adds warmth without sacrificing readability.

### Type Scale

```
Display XL:   48px / 1.1 / -0.02em / 700    (Token number on confirmation)
Display LG:   36px / 1.2 / -0.02em / 700    (Display board headers)
Display MD:   30px / 1.2 / -0.01em / 700    (Screen titles)

Heading 1:    24px / 1.3 / -0.01em / 600    (Section headers)
Heading 2:    20px / 1.3 / -0.01em / 600    (Card headers)
Heading 3:    18px / 1.4 / 0 / 600          (Sub-sections)

Body LG:      16px / 1.5 / 0 / 400          (Primary body text)
Body MD:      14px / 1.5 / 0 / 400          (Secondary body, table cells)
Body SM:      13px / 1.5 / 0.01em / 400     (Captions, timestamps)

Label LG:     14px / 1.0 / 0.02em / 600     (Button text, form labels)
Label MD:     12px / 1.0 / 0.02em / 600     (Badges, tags)
Label SM:     11px / 1.0 / 0.04em / 600     (Micro labels)

Mono:         14px / 1.4 / 0 / 400          (Order IDs, token numbers)
```

### iPad-Specific Adjustments

On iPad (customer ordering), scale up body text by 1 step:
```
Body LG → 18px (primary reading text on iPad)
Body MD → 16px
Button labels → 16px minimum
```

### KDS-Specific Adjustments

Kitchen screens prioritize scan speed:
```
Token Number:    64px / 800 weight (must be readable from 6 feet)
Item Name:       20px / 600 weight
Modifiers:       16px / 400 weight, color: Warning-500 (stand out)
Timer:           24px / 700 weight, monospace
```

---

## 6. Spacing & Layout

### Spacing Scale (Base: 4px)

```
space-0:    0px
space-1:    4px      (Tight gaps: between icon and label)
space-2:    8px      (Dense content: list item padding)
space-3:    12px     (Standard padding within components)
space-4:    16px     (Card padding, gap between items)
space-5:    20px     (Section spacing)
space-6:    24px     (Major section gaps)
space-8:    32px     (Screen-level padding)
space-10:   40px     (Between major sections)
space-12:   48px     (Screen margins on iPad)
space-16:   64px     (Hero spacing)
```

### Layout Grid

**iPad (Customer):**
```
Columns: 12
Gutter: 16px
Margin: 24px (safe area)
Content max-width: none (full bleed for food images)
```

**Vendor Dashboard (Tablet):**
```
Columns: 12
Gutter: 16px
Margin: 16px
Sidebar: 240px fixed
```

**Admin Dashboard (Desktop):**
```
Columns: 12
Gutter: 24px
Margin: 32px
Sidebar: 260px fixed (collapsible to 72px)
Content max-width: 1440px
```

**KDS Screen:**
```
Columns: 3 (New | Preparing | Ready)
Gap: 12px
Margin: 12px
Cards: full-width within column
```

**Display Board (TV):**
```
Columns: dynamic (based on active vendor count)
Full-screen, no margins
Card padding: 24px
```

---

## 7. Elevation & Shadows

```css
--shadow-xs:    0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm:    0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md:    0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04);
--shadow-lg:    0 10px 15px rgba(0, 0, 0, 0.06), 0 4px 6px rgba(0, 0, 0, 0.04);
--shadow-xl:    0 20px 25px rgba(0, 0, 0, 0.08), 0 8px 10px rgba(0, 0, 0, 0.04);
--shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.04);
```

**Usage:**
- `xs` — Input fields, subtle card borders
- `sm` — Cards at rest, dropdown menus
- `md` — Cards on hover/focus, modals
- `lg` — Floating action buttons, popover panels
- `xl` — Full-screen modals, drawer panels

---

## 8. Border Radius

```css
--radius-none:  0px;
--radius-sm:    4px;     (Badges, tags, small buttons)
--radius-md:    8px;     (Cards, inputs, standard buttons)
--radius-lg:    12px;    (Large cards, image containers)
--radius-xl:    16px;    (Modal containers, feature cards)
--radius-2xl:   24px;    (Pill buttons, search bars)
--radius-full:  9999px;  (Avatars, circular buttons)
```

---

## 9. Iconography

### Icon System

**Library:** Lucide React (consistent, clean, MIT licensed)

**Sizes:**
```
Icon SM:   16px  (inline with body text)
Icon MD:   20px  (standard UI icons)
Icon LG:   24px  (navigation, action buttons)
Icon XL:   32px  (feature icons, empty states)
Icon 2XL:  48px  (dashboard widgets, display board)
```

**Stroke width:** 2px default, 1.5px for larger sizes (32px+)

### Key Icons Mapping

```
Navigation:
  Home          → LayoutDashboard
  Orders        → ClipboardList
  Menu          → UtensilsCrossed
  Analytics     → BarChart3
  Settings      → Settings
  Finance       → Wallet

Actions:
  Add to Cart   → Plus
  Remove        → Trash2
  Edit          → Pencil
  Search        → Search
  Filter        → SlidersHorizontal
  Refresh       → RefreshCw

Order Status:
  Pending       → Clock
  Accepted      → CheckCircle
  Preparing     → ChefHat (custom) or Flame
  Ready         → Bell
  Completed     → CircleCheckBig
  Rejected      → XCircle
  Cancelled     → Ban

Vendor:
  Booth/Store   → Store
  Kitchen       → CookingPot
  Staff         → Users
  Reports       → FileBarChart
```

---

## 10. Motion & Animation

### Timing Tokens

```css
--duration-instant:   75ms;    (Micro-interactions: button press, toggle)
--duration-fast:      150ms;   (Hover states, focus rings)
--duration-normal:    250ms;   (Panels, modals entering)
--duration-slow:      350ms;   (Complex transitions, page changes)
--duration-emphasis:  500ms;   (Attention-drawing: new order flash)

--easing-default:     cubic-bezier(0.4, 0, 0.2, 1);
--easing-in:          cubic-bezier(0.4, 0, 1, 1);
--easing-out:         cubic-bezier(0, 0, 0.2, 1);
--easing-spring:      cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Key Animations

**New Order (KDS):**
```css
@keyframes new-order-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(245, 158, 11, 0); }
}
/* Applied for 3 seconds on new order card, with audio chime */
```

**Cart Item Added:**
```css
@keyframes cart-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
/* Applied to cart badge count */
```

**Status Change:**
```css
@keyframes status-transition {
  0% { background-color: var(--from-color); }
  100% { background-color: var(--to-color); }
}
/* Smooth color shift when order status changes */
```

**Display Board "Ready" Flash:**
```css
@keyframes ready-flash {
  0%, 50% { opacity: 1; }
  25%, 75% { opacity: 0.4; }
  100% { opacity: 1; }
}
/* Token number flashes when status changes to "Ready" */
```

### Animation Rules

1. **KDS screens:** Animations must not block interaction. No animation should delay a tap action.
2. **Customer iPad:** Smooth, delightful transitions. Cart additions should feel satisfying.
3. **Admin dashboard:** Minimal animation. Data should update without jarring transitions.
4. **Display board:** Bold, attention-grabbing status changes. Readability from 15+ feet.

---

## 11. Dark Mode Strategy

### Who Gets Dark Mode

| Surface | Default | Dark Mode Available |
|---------|---------|-------------------|
| Customer iPad | Light | No (brand consistency) |
| Vendor KDS | **Dark** (default) | Light toggle available |
| Vendor Dashboard | Light | Yes |
| Admin Dashboard | Light | Yes |
| Display Board | **Dark** (default) | No (readability on TV) |

### Dark Mode Tokens

```css
[data-theme="dark"] {
  --color-surface-primary:      #0D1117;
  --color-surface-secondary:    #161B22;
  --color-surface-tertiary:     #21262D;
  --color-surface-elevated:     #1C2128;

  --color-text-primary:         #F0F6FC;
  --color-text-secondary:       #8B949E;
  --color-text-tertiary:        #6E7681;

  --color-border-primary:       #30363D;
  --color-border-secondary:     #21262D;

  /* Status colors stay vibrant but adjusted for dark backgrounds */
  --color-order-pending:        #FBB040;
  --color-order-preparing:      #A78BFA;
  --color-order-ready:          #34D399;
}
```

### KDS Dark Mode Rationale

Kitchen screens default to dark mode because:
- Reduces eye strain in kitchen lighting conditions
- Status colors pop more against dark backgrounds
- Lower screen brightness in dim prep areas
- Reduces screen glare on stainless steel surfaces

---

## 12. Touch Targets & iPad Optimization

### Minimum Touch Targets

```
Primary actions (CTA buttons):     56px height, 100% width on mobile
Secondary actions:                  48px height
List items (tappable rows):         56px height minimum
Icon buttons:                       44px × 44px minimum
Toggle switches:                    52px × 28px
Modifier checkboxes:                44px × 44px tap area
Quantity stepper (+/-):             44px × 44px per button
```

### iPad-Specific Rules

- **No hover states as primary interaction** — everything must work with tap only
- **Swipe gestures as shortcuts only** — never as the only way to perform an action
- **Bottom-anchored CTAs** — primary action buttons pinned to bottom of viewport (thumb-reachable)
- **Split view support** — vendor dashboard should support iPad split view
- **Keyboard avoidance** — forms must scroll to keep active input visible above software keyboard
- **Safe area respect** — content must not overlap with iPad home indicator or camera housing

### Cart Interaction Design

```
┌─────────────────────────────────────────┐
│  [Vendor Cards — scrollable grid]       │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  🛒 3 items · $32.00    [ View Cart → ] │  ← Persistent bottom bar
└─────────────────────────────────────────┘    56px height, always visible
```

---

## 13. KDS-Specific Design Rules

### Card Design

```
┌─ vendor-color (4px left border) ──────────┐
│                                            │
│  #047                    ⏱️ 4:32           │
│  Table 5                                   │
│                                            │
│  ──────────────────────────────────         │
│  Classic Burger x1                         │
│  + Extra Cheese                            │
│  + NO PICKLES ← (red text, uppercase)      │
│                                            │
│  ──────────────────────────────────         │
│                                            │
│  [ Accept ]  or  [ Ready ✓ ]               │
│                                            │
└────────────────────────────────────────────┘
```

### KDS Color Rules

- **New orders:** Amber left border, pulsing glow animation
- **Timer > estimated prep time:** Card border turns red, timer text turns red
- **"REMOVE" modifiers** (No pickles, No onions): Red text, uppercase, bold — kitchen staff must see these instantly
- **"ADD" modifiers** (Extra cheese, Add bacon): Green text, normal case
- **Special instructions:** Yellow background strip, italic text

### KDS Typography Priorities (largest to smallest)

1. Token number (64px) — identify which order
2. Item name (20px) — what to cook
3. Modifiers (16px) — how to cook it
4. Timer (24px, monospace) — how long it's been
5. Table number (14px) — where it goes

---

## 14. Display Board Design Rules

### Layout Principles

- **Dark background** (#0D1117) for TV readability
- **High contrast text** (#F0F6FC on dark)
- **Vendor sections** with booth color header bars
- **Token numbers are HUGE** (min 48px on 1080p TV)
- **"Ready" tokens flash** with green highlight animation
- **Auto-scroll** if content exceeds viewport (slow, smooth scroll)
- **No user interaction** — display-only, data-driven via Realtime
- **Current time** displayed in corner
- **Vendor logo** in each section header

### Display Board Color Coding

```
Preparing tokens:  White text on dark card
Ready tokens:      Green (#10B981) background, white text, gentle pulse
```

---

## 15. Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B35',
          secondary: '#1B2D45',
          accent: '#00B4D8',
        },
        surface: {
          primary: 'var(--color-surface-primary)',
          secondary: 'var(--color-surface-secondary)',
          tertiary: 'var(--color-surface-tertiary)',
          elevated: 'var(--color-surface-elevated)',
        },
        order: {
          pending: '#F59E0B',
          accepted: '#3B82F6',
          preparing: '#8B5CF6',
          ready: '#10B981',
          completed: '#6B7280',
          rejected: '#EF4444',
          cancelled: '#9CA3AF',
        },
        booth: {
          1: '#FF6B35',
          2: '#3B82F6',
          3: '#10B981',
          4: '#8B5CF6',
          5: '#EC4899',
          6: '#F59E0B',
          7: '#14B8A6',
          8: '#EF4444',
          9: '#6366F1',
          10: '#84CC16',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display-xl': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['36px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-md': ['30px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        'order-new': '0 0 0 3px rgba(245, 158, 11, 0.4)',
        'order-ready': '0 0 0 3px rgba(16, 185, 129, 0.4)',
      },
      animation: {
        'order-pulse': 'new-order-pulse 1.5s ease-in-out 3',
        'cart-bounce': 'cart-bounce 0.3s ease-out',
        'ready-flash': 'ready-flash 2s ease-in-out 3',
        'status-fade': 'status-transition 0.25s ease-out',
      },
      keyframes: {
        'new-order-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(245, 158, 11, 0)' },
        },
        'cart-bounce': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        'ready-flash': {
          '0%, 50%': { opacity: '1' },
          '25%, 75%': { opacity: '0.4' },
          '100%': { opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        'touch': '48px',
        'touch-lg': '56px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```
