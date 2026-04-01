# Design System
## FlexPOS — Obsidian Terminal Theme

---

## 1. Design Philosophy

FlexPOS uses the **Obsidian Terminal** theme — a dark, high-contrast, industrial aesthetic designed specifically for POS cashier environments.

### Why This Theme?
- **Low eye fatigue** — dark backgrounds reduce strain during 8+ hour shifts
- **Works in any lighting** — bright retail floors, dim cafes, outdoor stalls
- **Instant visual hierarchy** — neon accents guide the eye to prices, totals, and actions
- **Professional feel** — cashiers feel like they're operating a precision instrument, not a toy

### Design Principles
1. **Function over decoration** — every visual element serves a purpose
2. **Touch-first** — all interactive elements are large enough for fingertips (44px minimum)
3. **Scannable** — a cashier should find what they need in under 1 second
4. **Consistent** — same patterns everywhere, no surprises
5. **Fast** — animations are snappy (150-200ms), never slow or bouncy

---

## 2. Color Tokens

All colors are defined as CSS custom properties in `index.css` and mapped to TailwindCSS via `tailwind.config.js`.

### Core Palette

```css
:root {
  /* ─── Backgrounds ─── */
  --bg-primary:     #0D0F12;    /* Main app background */
  --bg-secondary:   #161A21;    /* Cards, panels, sidebar */
  --bg-tertiary:    #1E2330;    /* Elevated surfaces, modals */
  --bg-hover:       #252B3A;    /* Hover states on interactive elements */
  --bg-active:      #2C3344;    /* Active/selected states */
  --bg-input:       #141820;    /* Input field backgrounds */

  /* ─── Accent Colors ─── */
  --accent-primary:   #00D4AA;  /* Primary buttons, success, totals, key actions */
  --accent-secondary: #6C5CE7;  /* Secondary actions, badges, loyalty, held orders */
  --accent-danger:    #FF6B6B;  /* Delete, errors, voids, refunds */
  --accent-warning:   #FDCB6E;  /* Alerts, low stock, expiring items */
  --accent-info:      #74B9FF;  /* Informational, links, help text */

  /* ─── Accent Hover States ─── */
  --accent-primary-hover:   #00E4BB;
  --accent-secondary-hover: #7D6EF0;
  --accent-danger-hover:    #FF8787;
  --accent-warning-hover:   #FEDA8B;

  /* ─── Text ─── */
  --text-primary:   #F1F3F5;    /* Headings, prices, important content */
  --text-secondary: #8B95A5;    /* Labels, descriptions, metadata */
  --text-muted:     #4A5568;    /* Disabled states, placeholders */
  --text-inverse:   #0D0F12;    /* Text on accent-colored backgrounds */

  /* ─── Borders & Dividers ─── */
  --border-default:  #2D3748;   /* Card borders, dividers */
  --border-hover:    #3D4A5C;   /* Border hover state */
  --border-focus:    #00D4AA;   /* Input focus ring */
  --border-error:    #FF6B6B;   /* Input error state */

  /* ─── Shadows ─── */
  --shadow-sm:    0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md:    0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg:    0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow:  0 0 20px rgba(0, 212, 170, 0.15);  /* Subtle glow on primary elements */

  /* ─── Overlay ─── */
  --overlay:      rgba(0, 0, 0, 0.6);   /* Modal backdrop */
  --overlay-heavy: rgba(0, 0, 0, 0.8);  /* Lock screen backdrop */
}
```

### TailwindCSS Config Mapping

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary:  'var(--bg-tertiary)',
          hover:     'var(--bg-hover)',
          active:    'var(--bg-active)',
          input:     'var(--bg-input)',
        },
        accent: {
          primary:          'var(--accent-primary)',
          'primary-hover':  'var(--accent-primary-hover)',
          secondary:        'var(--accent-secondary)',
          'secondary-hover':'var(--accent-secondary-hover)',
          danger:           'var(--accent-danger)',
          'danger-hover':   'var(--accent-danger-hover)',
          warning:          'var(--accent-warning)',
          'warning-hover':  'var(--accent-warning-hover)',
          info:             'var(--accent-info)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          inverse:   'var(--text-inverse)',
        },
        border: {
          default: 'var(--border-default)',
          hover:   'var(--border-hover)',
          focus:   'var(--border-focus)',
          error:   'var(--border-error)',
        },
      },
      boxShadow: {
        sm:   'var(--shadow-sm)',
        md:   'var(--shadow-md)',
        lg:   'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
      },
    },
  },
};
```

---

## 3. Typography

### Font Stack

```css
:root {
  --font-heading: 'JetBrains Mono', 'Fira Code', monospace;
  --font-body:    'DM Sans', 'Inter', sans-serif;
}
```

**Load via Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

> **Note:** Since FlexPOS is offline-first, fonts must be bundled locally in `public/fonts/` and loaded via `@font-face` in `index.css` — never from Google CDN at runtime.

### Type Scale

| Token | Size | Weight | Font | Use |
|---|---|---|---|---|
| `text-display` | 36px / 2.25rem | 700 | JetBrains Mono | Large totals, change amount |
| `text-h1` | 24px / 1.5rem | 700 | JetBrains Mono | Page titles |
| `text-h2` | 20px / 1.25rem | 600 | JetBrains Mono | Section headings |
| `text-h3` | 16px / 1rem | 600 | JetBrains Mono | Card titles, category tabs |
| `text-body` | 14px / 0.875rem | 400 | DM Sans | Default body text |
| `text-body-semibold` | 14px / 0.875rem | 600 | DM Sans | Labels, emphasized body |
| `text-small` | 12px / 0.75rem | 400 | DM Sans | Timestamps, metadata |
| `text-tiny` | 10px / 0.625rem | 500 | DM Sans | Badges, status indicators |

### Numeric Display

All prices and monetary values use:
```css
font-variant-numeric: tabular-nums lining-nums;
```
This ensures digits are monospaced and columns align — critical for receipt layouts and cart totals.

### TailwindCSS Config

```js
// Add to tailwind.config.js theme.extend
fontSize: {
  'display': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
  'h1':      ['1.5rem',  { lineHeight: '2rem',   fontWeight: '700' }],
  'h2':      ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
  'h3':      ['1rem',    { lineHeight: '1.5rem',  fontWeight: '600' }],
  'body':    ['0.875rem',{ lineHeight: '1.25rem', fontWeight: '400' }],
  'small':   ['0.75rem', { lineHeight: '1rem',    fontWeight: '400' }],
  'tiny':    ['0.625rem',{ lineHeight: '0.875rem',fontWeight: '500' }],
},
fontFamily: {
  heading: ['JetBrains Mono', 'Fira Code', 'monospace'],
  body:    ['DM Sans', 'Inter', 'sans-serif'],
},
```

---

## 4. Spacing & Layout

### Spacing Scale

| Token | Value | Use |
|---|---|---|
| `space-1` | 4px | Minimal padding, badge internal |
| `space-2` | 8px | Tight gaps, inline elements |
| `space-3` | 12px | Icon-to-text gap, compact lists |
| `space-4` | 16px | Standard card padding, input padding |
| `space-5` | 20px | Section gaps |
| `space-6` | 24px | Panel padding, page margins |
| `space-8` | 32px | Large section separation |
| `space-10` | 40px | Major layout gaps |
| `space-12` | 48px | Page-level separation |

### Border Radius

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 4px | Small badges, tooltips |
| `rounded-md` | 8px | Buttons, inputs, cards |
| `rounded-lg` | 12px | Modals, panels, product cards |
| `rounded-xl` | 16px | Large cards, containers |
| `rounded-full` | 9999px | Circular buttons, avatars, pills |

### Layout Zones

```
┌─────────────────────────────────────────────────────────┐
│ TITLEBAR (40px height, bg-secondary)                    │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  SIDEBAR   │           MAIN CONTENT AREA                │
│  (240px    │           (flex-1, bg-primary)              │
│   width,   │                                            │
│   bg-      │                                            │
│   secondary)│                                           │
│            │                                            │
│            │                                            │
│            │                                            │
│            │                                            │
│            │                                            │
└────────────┴────────────────────────────────────────────┘
```

**Checkout Screen Layout:**
```
┌────────────┬──────────────────────────┬─────────────────┐
│  SIDEBAR   │    PRODUCT GRID          │   CART PANEL    │
│  (240px)   │    (flex-1)              │   (380px)       │
│            │                          │                 │
│            │  ┌─────┐ ┌─────┐ ┌────┐ │  ┌───────────┐  │
│            │  │ Prod│ │ Prod│ │Prod│ │  │ Item 1    │  │
│            │  │ Card│ │ Card│ │Card│ │  │ Item 2    │  │
│            │  └─────┘ └─────┘ └────┘ │  │ Item 3    │  │
│            │  ┌─────┐ ┌─────┐ ┌────┐ │  ├───────────┤  │
│            │  │ ...more cards...    │ │  │ Subtotal  │  │
│            │  │                     │ │  │ Discount  │  │
│            │  └─────┘ └─────┘ └────┘ │  │ TOTAL     │  │
│            │                          │  ├───────────┤  │
│            │  [Category Tabs]         │  │ [PAY BTN] │  │
│            │  [Search Bar]            │  └───────────┘  │
└────────────┴──────────────────────────┴─────────────────┘
```

---

## 5. Component Specifications

### 5.1 Buttons

#### Primary Button
```
Background: var(--accent-primary)
Text: var(--text-inverse)
Font: DM Sans 600, 14px
Padding: 12px 24px
Border Radius: 8px
Min Height: 44px (touch target)
Hover: var(--accent-primary-hover) + shadow-glow
Active: scale(0.98) transform
Transition: all 150ms ease
```

#### Secondary Button
```
Background: transparent
Border: 1px solid var(--border-default)
Text: var(--text-primary)
Font: DM Sans 600, 14px
Padding: 12px 24px
Border Radius: 8px
Min Height: 44px
Hover: var(--bg-hover) background + var(--border-hover)
Active: scale(0.98) transform
Transition: all 150ms ease
```

#### Danger Button
```
Background: var(--accent-danger)
Text: #FFFFFF
Font: DM Sans 600, 14px
Padding: 12px 24px
Border Radius: 8px
Min Height: 44px
Hover: var(--accent-danger-hover)
Active: scale(0.98) transform
```

#### Ghost Button
```
Background: transparent
Text: var(--text-secondary)
Padding: 8px 16px
Border Radius: 8px
Min Height: 44px
Hover: var(--bg-hover) background
```

#### Icon Button
```
Background: transparent
Size: 44px × 44px (fixed)
Border Radius: 8px
Icon Color: var(--text-secondary)
Hover: var(--bg-hover) bg, icon → var(--text-primary)
```

#### Pay Button (Checkout-specific)
```
Background: var(--accent-primary)
Text: var(--text-inverse)
Font: JetBrains Mono 700, 18px
Padding: 16px 32px
Height: 56px
Border Radius: 12px
Full width within cart panel
Shadow: var(--shadow-glow)
Hover: var(--accent-primary-hover) + enhanced glow
```

### 5.2 Inputs

#### Text Input
```
Background: var(--bg-input)
Border: 1px solid var(--border-default)
Text: var(--text-primary)
Placeholder: var(--text-muted)
Font: DM Sans 400, 14px
Padding: 12px 16px
Height: 44px
Border Radius: 8px
Focus: border-color → var(--border-focus) + shadow-glow
Error: border-color → var(--border-error)
Transition: border-color 150ms ease, box-shadow 150ms ease
```

#### Search Input
```
Same as Text Input, but with:
- Lucide Search icon (16px) at left, var(--text-muted)
- Left padding: 44px (icon space)
- On focus: icon color → var(--text-secondary)
- Keyboard shortcut hint "F2" badge at right edge
```

### 5.3 Cards

#### Product Card (Checkout Grid)
```
Background: var(--bg-secondary)
Border: 1px solid var(--border-default)
Border Radius: 12px
Padding: 12px
Width: flexible (grid auto-fill, minmax(140px, 1fr))
Min Height: 120px
Cursor: pointer

Content:
  - Product image or placeholder (80px × 80px, rounded-md, object-cover)
  - Product name (text-body-semibold, text-primary, 1 line, ellipsis)
  - Price (text-h3, font-heading, accent-primary, tabular-nums)

Hover: border → var(--accent-primary), bg → var(--bg-hover), shadow-md
Active: scale(0.97), transition 100ms
Out of Stock: opacity 0.4, cursor not-allowed, "Out of Stock" badge overlay
```

#### Cart Item Card
```
Background: var(--bg-tertiary)
Border Radius: 8px
Padding: 12px
Margin Bottom: 8px

Layout: flex row, space-between
  Left: name (text-body, text-primary) + variant (text-small, text-secondary)
  Right: qty controls (−/+) + line total (text-body-semibold, accent-primary)

Quantity controls:
  - Buttons: 32px × 32px, ghost style, rounded-full
  - Current qty: text-body-semibold, 32px wide, centered
  - Remove (×): ghost icon button, accent-danger on hover

Swipe left to delete (tablet): bg slides to reveal danger background
```

#### Stat Card (Dashboard/Reports)
```
Background: var(--bg-secondary)
Border: 1px solid var(--border-default)
Border Radius: 12px
Padding: 20px

Content:
  - Label (text-small, text-secondary, uppercase, letter-spacing 0.05em)
  - Value (text-display or text-h1, font-heading, text-primary, tabular-nums)
  - Trend indicator: ▲ accent-primary (up) or ▼ accent-danger (down) + percentage

Hover: shadow-md, border → var(--border-hover)
```

### 5.4 Modal

```
Backdrop: var(--overlay), blur(4px)
Container:
  Background: var(--bg-tertiary)
  Border: 1px solid var(--border-default)
  Border Radius: 16px
  Padding: 24px
  Max Width: 480px (standard), 640px (wide), 100% (full-screen payment)
  Shadow: var(--shadow-lg)

Header: flex row, space-between
  Title: text-h2, font-heading, text-primary
  Close: icon button (×), 44px

Animation:
  Enter: fade-in backdrop 150ms + scale-up content from 0.95 → 1.0 (200ms, ease-out)
  Exit: scale-down 0.95 (150ms) + fade-out 150ms
```

### 5.5 Toast Notifications

```
Position: top-right, 24px from edges
Width: 360px max
Background: var(--bg-tertiary)
Border: 1px solid var(--border-default)
Border Radius: 12px
Padding: 16px
Shadow: var(--shadow-lg)

Variants:
  Success: left border 3px solid var(--accent-primary) + check icon
  Error:   left border 3px solid var(--accent-danger) + x-circle icon
  Warning: left border 3px solid var(--accent-warning) + alert-triangle icon
  Info:    left border 3px solid var(--accent-info) + info icon

Animation:
  Enter: slide-in from right (200ms, ease-out)
  Exit: slide-out to right + fade (200ms, ease-in)
  Auto-dismiss: 3 seconds (success/info), 5 seconds (warning/error)

Text: text-body, text-primary (message) + text-small, text-secondary (detail)
```

### 5.6 Sidebar Navigation

```
Width: 240px (expanded), 64px (collapsed — optional V2)
Background: var(--bg-secondary)
Border Right: 1px solid var(--border-default)
Padding: 16px 12px

Nav Item:
  Height: 44px
  Padding: 10px 16px
  Border Radius: 8px
  Font: DM Sans 500, 14px
  Icon: Lucide, 20px, var(--text-secondary)
  Text: var(--text-secondary)

  Hover: bg → var(--bg-hover), text → var(--text-primary), icon → var(--text-primary)
  Active: bg → var(--bg-active), text → var(--accent-primary), icon → var(--accent-primary)
           left border 3px solid var(--accent-primary)

Section divider: 1px solid var(--border-default), margin 12px 0

Bottom section: cashier name + role badge + logout button
```

### 5.7 PinPad

```
Container:
  Centered on screen
  Background: var(--bg-tertiary)
  Border Radius: 16px
  Padding: 40px
  Shadow: var(--shadow-lg)

Display:
  4-6 dots (filled = entered, empty = remaining)
  Dot size: 16px, spacing 12px
  Filled: var(--accent-primary)
  Empty: var(--border-default)

Keys:
  Layout: 3×4 grid + backspace
  Button size: 72px × 72px (exceeds 64px minimum from AI_RULES)
  Font: JetBrains Mono 600, 24px
  Background: var(--bg-hover)
  Border Radius: 16px
  Text: var(--text-primary)

  Hover: bg → var(--bg-active)
  Active: scale(0.95), bg → var(--accent-primary), text → var(--text-inverse)
  Transition: all 100ms ease

Wrong PIN animation: shake keyframes (translateX ±10px, 3 cycles, 300ms)
Clear after wrong: all dots empty, 300ms delay
```

### 5.8 Confirmation Modal

```
Same base as Modal (§5.4), but:
  Max Width: 400px
  Icon: centered, 48px, var(--accent-danger) for destructive / var(--accent-warning) for warning
  Title: text-h2, centered
  Message: text-body, text-secondary, centered
  Actions: flex row, gap 12px, full-width buttons
    Cancel: secondary button
    Confirm: danger button (if destructive) or primary button
```

### 5.9 Table

```
Container: bg-secondary, rounded-lg, border 1px solid var(--border-default)

Header Row:
  Background: var(--bg-tertiary)
  Font: DM Sans 600, 12px, uppercase, letter-spacing 0.05em
  Text: var(--text-secondary)
  Padding: 12px 16px

Body Row:
  Font: DM Sans 400, 14px
  Text: var(--text-primary)
  Padding: 12px 16px
  Border Bottom: 1px solid var(--border-default)
  Hover: bg → var(--bg-hover)

  Monetary values: font-heading, tabular-nums, text-right
  Status badges: tiny text, rounded-full, 6px padding

Empty State:
  Centered illustration or icon (64px, text-muted)
  Message: text-body, text-secondary, centered
  Action button: primary or secondary
```

### 5.10 Badge / Pill

```
Variants:
  Success:  bg rgba(0,212,170,0.15), text var(--accent-primary)
  Warning:  bg rgba(253,203,110,0.15), text var(--accent-warning)
  Danger:   bg rgba(255,107,107,0.15), text var(--accent-danger)
  Info:     bg rgba(116,185,255,0.15), text var(--accent-info)
  Neutral:  bg var(--bg-hover), text var(--text-secondary)

Font: DM Sans 600, 10px (tiny) or 12px (small)
Padding: 2px 8px (tiny) or 4px 12px (small)
Border Radius: rounded-full
Text Transform: uppercase
Letter Spacing: 0.05em
```

---

## 6. Animations & Transitions

### Timing Tokens

| Token | Duration | Easing | Use |
|---|---|---|---|
| `transition-fast` | 100ms | ease | Button press, scale |
| `transition-base` | 150ms | ease | Color changes, borders |
| `transition-slow` | 200ms | ease-out | Modal enter, slide-in |
| `transition-spring` | 300ms | cubic-bezier(0.34, 1.56, 0.64, 1) | Bounce effects (use sparingly) |

### Key Animations

```css
/* Shake — wrong PIN */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

/* Fade In Up — modal content, toast entry */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Slide In Right — toast entry */
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(100%); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Scale In — modal entry */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

/* Pulse — low stock badge */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Skeleton loading shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Animation Rules
- **Never exceed 300ms** for UI feedback animations
- **Always use `prefers-reduced-motion`** media query to disable animations for accessibility
- **No scroll-jacking or parallax** — this is a POS, not a marketing site
- **Button press = 100ms**, modal = 200ms, page transition = none (instant view swap)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Iconography

### Icon Set: Lucide React

All icons come from [Lucide](https://lucide.dev/) — clean, consistent, MIT licensed.

### Icon Sizes

| Context | Size | Stroke Width |
|---|---|---|
| Sidebar navigation | 20px | 2px |
| Buttons (with text) | 16px | 2px |
| Icon buttons | 20px | 2px |
| Stat cards | 24px | 1.5px |
| Empty states | 48-64px | 1.5px |
| PinPad backspace | 24px | 2px |

### Key Icons

| Use | Icon Name |
|---|---|
| Checkout / POS | `ShoppingCart` |
| Products | `Package` |
| Orders | `ClipboardList` |
| Customers | `Users` |
| Reports | `BarChart3` |
| Inventory | `Boxes` |
| Cashiers | `UserCog` |
| Settings | `Settings` |
| Search | `Search` |
| Add to cart | `Plus` |
| Remove | `Trash2` |
| Edit | `Pencil` |
| Close | `X` |
| Back | `ArrowLeft` |
| Logout | `LogOut` |
| Lock | `Lock` |
| Success toast | `CheckCircle2` |
| Error toast | `XCircle` |
| Warning toast | `AlertTriangle` |
| Info toast | `Info` |
| Low stock | `AlertTriangle` |
| Cash | `Banknote` |
| Receipt | `Receipt` |
| Print | `Printer` |
| Hold order | `Pause` |
| Resume order | `Play` |

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Target |
|---|---|---|
| `desktop` | ≥ 1280px | Standard POS display |
| `tablet-landscape` | 1024px – 1279px | Tablet in landscape |
| `tablet-portrait` | 768px – 1023px | Tablet in portrait |

### Responsive Adjustments

**Tablet Portrait (< 1024px):**
- Sidebar collapses to 64px (icons only)
- Cart panel becomes a bottom sheet (swipe up to expand)
- Product grid: 2 columns instead of 3-4
- PinPad keys: 64px (from 72px)

**Tablet Landscape (1024px – 1279px):**
- Sidebar remains expanded
- Cart panel: 320px (from 380px)
- Product grid: 3 columns

---

## 9. Dark Mode Note

FlexPOS ships **dark mode only** in V1 (Obsidian Terminal). There is no light mode toggle.

Rationale:
- Reduces scope and complexity
- Single consistent brand identity
- Better for typical POS environments (varied lighting)
- Light mode can be added in V2 as a theme option via the same CSS variable system

---

## 10. Accessibility

Despite being a POS (not a public website), basic accessibility matters for cashier comfort:

- **Minimum contrast ratio:** 4.5:1 for body text, 3:1 for large text (WCAG AA)
- **Focus indicators:** 2px solid var(--border-focus) outline on all interactive elements
- **Keyboard navigation:** All actions reachable via keyboard (Tab, Enter, Escape)
- **`prefers-reduced-motion`:** Respected — all animations disabled
- **Touch targets:** 44px × 44px minimum (per AI_RULES)
- **Font sizes:** Never below 10px (badges) — body text is 14px
- **No color-only indicators:** Always pair color with icon or text (e.g., low stock = yellow + icon + text)
