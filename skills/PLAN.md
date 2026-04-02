# Development Plan
## FlexPOS V1 — Build Roadmap

---

## Overview

| Item | Detail |
|---|---|
| **Stack** | Electron + React + TailwindCSS + SQLite |
| **Target** | Single store, single device, fully offline |
| **Phases** | 5 phases |
| **Estimated Duration** | 10–14 weeks solo |

---

## Phase 0 — Project Setup
**Duration: 3–5 days**

### Goal
Get the development environment running with Electron + React + SQLite working end-to-end.

### Tasks
- [ ] Initialize project with Vite + React
- [ ] Configure Electron with `electron-builder`
- [ ] Set up `contextBridge` + `ipcMain` / `ipcRenderer` bridge
- [ ] Install and configure `better-sqlite3`
- [ ] Create initial SQLite migration (`001_initial.sql` — all tables from ARCHITECTURE.md)
- [ ] Create indexes migration (`002_indexes.sql`)
- [ ] Implement migration runner in `db.js`
- [ ] Set up TailwindCSS with theme tokens from DESIGN_SYSTEM.md
- [ ] Create `index.css` with CSS variables for Obsidian Terminal theme
- [ ] Set up Zustand — create `viewStore`, `sessionStore`, `checkoutStore`, `settingsStore`
- [ ] Create `src/constants/` — `ipc-channels.js`, `roles.js`, `order-status.js`
- [ ] Create `src/lib/cn.js` — clsx + tailwind-merge helper
- [ ] Create `electron/utils/validate.js` — input validation
- [ ] Create `electron/utils/audit.js` — audit log writer
- [ ] Create `electron/utils/session.js` — in-memory session manager
- [ ] Set up `electron-log` for error logging
- [ ] Set up custom window (frameless + custom titlebar)
- [ ] Configure `electron-builder.yml` for Windows/macOS/Linux output
- [ ] Create basic folder structure as per ARCHITECTURE.md
- [ ] Set up Vitest + create first smoke test
- [ ] Install Playwright for future E2E tests

### Acceptance Criteria
- Electron app opens without crash on Windows
- SQLite DB is created with all tables and indexes from ARCHITECTURE.md
- Migration runner applies `001_initial.sql` and `002_indexes.sql` successfully
- IPC round-trip works: renderer calls main, gets response
- TailwindCSS compiles with theme tokens — verify with a test `<div>`
- `npm test` runs Vitest and passes the smoke test

### QA Checklist
- [ ] App opens without crash on Windows
- [ ] SQLite DB created with all tables (count: 13 tables + `_migrations`)
- [ ] All indexes exist in DB
- [ ] IPC round-trip works (call from renderer → response from main)
- [ ] TailwindCSS theme tokens render correctly
- [ ] `npm test` passes

### Deliverable
A running Electron app that opens, shows a blank screen with the correct theme, and can read/write to SQLite.

---

## Phase 1 — Core POS (Checkout)
**Duration: 2–3 weeks**

### Goal
A working checkout flow from product selection to payment and receipt.

### Features Covered
- OV-01 Intuitive display
- OV-02 Quick search
- OV-04 PC & tablet compatible
- PAY-01 Cash payment
- PAY-03 Currency rounding
- PAY-04 Invoicing / receipt
- CHK-01 Prices & discounts
- CHK-03 Customized receipts
- PRD-01 Product categories
- PRD-02 Product search
- PRD-04 Availability toggle

### Tasks

#### Database
- [ ] Seed demo products, categories, and one admin cashier

#### Login Screen
- [ ] PIN pad UI with large buttons
- [ ] bcrypt PIN verification via IPC
- [ ] Role-based session stored in Zustand
- [ ] Fullscreen trigger on successful login

#### Custom Titlebar
- [ ] Frameless Electron window
- [ ] Custom minimize, maximize, close buttons
- [ ] Store name + active cashier display

#### Checkout Screen
- [ ] Product grid with category filter tabs
- [ ] Product search bar
- [ ] Add to cart on product click
- [ ] Cart panel — item list, quantity adjust, remove item
- [ ] Per-item discount (% or fixed)
- [ ] Order-level discount
- [ ] Subtotal, discount, total calculation
- [ ] Currency rounding

#### Payment Flow
- [ ] Cash payment modal
- [ ] Change computation display
- [ ] Tip input (fixed or change-to-tip)
- [ ] Complete order → write to SQLite (order + order_items + payment)

#### Receipt
- [ ] Receipt preview modal
- [ ] Print via system printer
- [ ] Customizable footer (store message — field-based, not WYSIWYG)

### Acceptance Criteria
- Cashier can complete a full transaction (browse → cart → pay → receipt) in under 30 seconds
- All currency math is correct — no floating-point drift
- Receipt displays all required fields (store name, date, cashier, items, totals, change)
- No state leaks between consecutive orders

### QA Checklist
- [ ] Cashier can log in with correct PIN
- [ ] Wrong PIN shows shake animation, does NOT reveal PIN length
- [ ] Product grid loads in < 1 second
- [ ] Add 5 items, adjust quantities, remove 1 — totals are correct
- [ ] Apply 10% discount — math is correct (e.g., ₱100 → ₱90)
- [ ] Apply ₱50 fixed discount — math is correct
- [ ] Pay with ₱500 cash on ₱347 order — change shows ₱153
- [ ] Currency rounding works (₱45.43 → ₱45 with peso rounding)
- [ ] Receipt preview shows all line items, totals, and change
- [ ] Order appears in SQLite `orders` table after completion
- [ ] `order_items` has snapshot of product name & price (not references)
- [ ] Floating point edge case: `0.1 + 0.2` handled correctly
- [ ] Process 10 consecutive orders — no state leakage between them
- [ ] Auto-lock triggers after 5 minutes idle — PIN re-entry unlocks
- [ ] Unit tests pass: `npm test` (cart totals, rounding, validation)

### Deliverable
Fully working checkout — cashier can select products, apply discounts, take cash, and print receipt.

---

## Phase 2 — Products & Inventory
**Duration: 1–2 weeks**

### Goal
Admin can manage products, variants, barcodes, and monitor stock.

### Features Covered
- PRD-03 Product variants
- PRD-05 Gift cards
- PRD-06 Multiple barcodes
- SM-05 Stock & Inventory
- OV-05 Offline mode (inherent, validate here)

### Tasks

#### Product Management (Admin)
- [ ] Product list page with search and category filter
- [ ] Add/edit/delete product form
- [ ] Image upload (stored locally)
- [ ] Product variant management (size, color, etc.)
- [ ] Multiple barcode assignment per product
- [ ] Availability toggle

#### Gift Cards
- [ ] Generate gift card with code + balance + optional expiry
- [ ] List and manage gift cards
- [ ] Apply gift card at checkout (deduct from balance)

#### Inventory
- [ ] Stock level display per product
- [ ] Manual stock adjustment (add/remove with reason)
- [ ] Low stock alert badge on dashboard
- [ ] Stock auto-deducted on order completion (in same transaction)

### Acceptance Criteria
- Admin can create a product with variants and see it in the checkout grid
- Stock decreases correctly on order completion and restores on refund
- Low stock alert appears when stock ≤ threshold
- Gift card can be created, used at checkout, and balance decreases correctly
- All product CRUD operations are logged in `audit_log`

### QA Checklist
- [ ] Admin can add product with name, price, category, image
- [ ] Product appears in checkout grid after creation
- [ ] Add 3 variants to a product — each has independent price and stock
- [ ] Assign 2 barcodes to a product — both resolve to the same product
- [ ] Toggle product availability — hidden from checkout grid when unavailable
- [ ] Stock decreases by correct quantity on order completion
- [ ] Low stock alert badge appears when stock ≤ threshold
- [ ] Manual stock adjustment: add 10, verify new total
- [ ] Gift card: create with ₱500 balance, use ₱200 at checkout, verify ₱300 remaining
- [ ] Gift card with ₱0 balance cannot be used
- [ ] Expired gift card cannot be used
- [ ] Product image uploads and displays correctly
- [ ] All create/update/delete actions appear in `audit_log`

### Deliverable
Admin can add/manage products and variants, view stock, and gift cards work at checkout.

---

## Phase 3 — Customers & Loyalty
**Duration: 1 week**

### Goal
Cashiers can look up customers and apply loyalty benefits at checkout.

### Features Covered
- CL-01 Customer registration
- CL-02 Identify customers
- CL-03 Customer discounts
- CL-04 Loyalty points
- CL-05 eWallet

### Tasks

#### Customer Management
- [ ] Customer list page with search (name, phone)
- [ ] Add/edit customer form (name, phone, email)
- [ ] Customer profile page (purchase history, points, eWallet balance)

#### At Checkout
- [ ] Customer search panel in checkout screen
- [ ] Auto-apply customer discount on selection
- [ ] eWallet payment option — deduct from balance
- [ ] Points calculation on order completion
- [ ] Points display + redeem points at checkout

### Acceptance Criteria
- Customer discount auto-applies when customer is selected at checkout
- eWallet balance decreases correctly on payment
- Loyalty points are earned proportionally and can be redeemed
- Customer purchase history is viewable from their profile

### QA Checklist
- [ ] Add customer with name, phone, email — appears in customer list
- [ ] Search customer by name — found
- [ ] Search customer by phone — found
- [ ] Select customer at checkout — their discount auto-applies to total
- [ ] Customer with 10% discount: ₱200 order → ₱180 total
- [ ] Customer with expired discount — discount NOT applied
- [ ] eWallet: customer has ₱500 balance, pay ₱300, verify ₱200 remaining
- [ ] eWallet: customer has ₱100 balance, try to pay ₱300 — error shown
- [ ] Loyalty: complete ₱500 order, verify points earned (500 × points_per_peso)
- [ ] Loyalty: redeem 100 points at checkout, verify discount applied
- [ ] Customer profile page shows purchase history

### Deliverable
Cashier can identify a customer, apply their discount, use eWallet, and earn/redeem loyalty points.

---

## Phase 4 — Store Management & Reports
**Duration: 1–2 weeks**

### Goal
Owner/manager can view sales data, manage cashiers, and reconcile cash.

### Features Covered
- SM-01 Order history
- SM-02 Daily sales report
- SM-03 Cashier accounts
- SM-04 Cash flows
- CHK-02 Parallel orders (held orders)
- PAY-02 Bill splitting
- PAY-06 Offline payment sync

### Tasks

#### Order Management
- [ ] Held orders panel (parallel orders)
- [ ] Resume a held order
- [ ] Order history page — filterable by cashier, date, customer
- [ ] Order detail view

#### Bill Splitting
- [ ] Split payment modal — add multiple payers/amounts
- [ ] Validate split totals equal order total

#### Cash Flow Management
- [ ] Open drawer (enter starting cash)
- [ ] Cash in / cash out log
- [ ] End-of-day cash count + reconciliation summary

#### Reports Dashboard
- [ ] Today's total sales
- [ ] Sales by payment method
- [ ] Best-selling products
- [ ] Daily sales chart (last 7 days)
- [ ] Cashier performance summary
- [ ] Export report as PDF

#### Cashier Management (Admin)
- [ ] Add/edit/deactivate cashier
- [ ] Assign role (admin, manager, cashier)
- [ ] Change PIN

#### Offline Sync (Validation)
- [ ] Confirm all operations work without internet
- [ ] Implement optional cloud backup trigger (SQLite file upload)

### Acceptance Criteria
- Held orders can be resumed with full cart state intact
- Bill split validates that payer amounts equal order total
- Cash flow reconciliation (open → close) produces correct summary
- Daily sales report matches sum of all completed orders for the day
- Report exports as readable PDF

### QA Checklist
- [ ] Hold order with 3 items → start new order → resume held order — all 3 items + quantities intact
- [ ] Hold 3 orders simultaneously — all 3 visible in held orders panel
- [ ] Resume held order — it is removed from held list
- [ ] Bill split: 2 payers, amounts equal total — order completes
- [ ] Bill split: amounts DON'T equal total — error shown, order blocked
- [ ] Bill split: one payer uses cash, another uses eWallet — both recorded
- [ ] Order history: filter by today's date — shows only today's orders
- [ ] Order history: filter by cashier — shows only that cashier's orders
- [ ] Order history: filter by customer — shows only that customer's orders
- [ ] Order detail view shows all items, discount, payment method
- [ ] Refund: select completed order → refund → new refund order created with `refund_for` reference
- [ ] Refund: stock is restored for refunded items
- [ ] Cash flow: open drawer with ₱1000 → process sales → cash out ₱200 → close drawer — summary correct
- [ ] Daily sales report total matches sum of order totals
- [ ] Sales by payment method pie chart renders correctly
- [ ] Best-selling products list is accurate
- [ ] Report exports as PDF — opens correctly
- [ ] Admin can add/deactivate cashier
- [ ] Admin can change cashier role
- [ ] Admin can reset cashier PIN
- [ ] All cashier management actions logged in `audit_log`

### Deliverable
Full reporting, cashier management, cash reconciliation, and parallel orders working.

---

## Phase 5 — Polish & Deployment
**Duration: 1 week**

### Goal
App is stable, tested, looks professional, and can be installed on a store's machine.

### Tasks

#### UI Polish
- [ ] Loading states and skeleton screens where needed
- [ ] Toast notifications for all success/error actions
- [ ] Confirmation modals for all destructive actions
- [ ] Empty states for all list pages
- [ ] Responsive layout tested on tablet screen size

#### Settings Page
- [ ] Store name, address, phone, logo
- [ ] Receipt footer message
- [ ] Currency and rounding settings
- [ ] Loyalty points rate configuration

#### Security Review
- [ ] Verify all IPC handlers check role before executing
- [ ] Verify no plain-text PINs in database
- [ ] Verify no SQL injection vulnerabilities

#### Build & Install
- [ ] Test Windows installer (.exe)
- [ ] Test macOS build (.dmg)
- [ ] Test Linux build (.AppImage)
- [ ] Auto-backup SQLite DB on app close (copy to backup folder)
- [ ] App icon and branding

#### Demo Prep
- [ ] Load realistic demo data (products, customers, orders)
- [ ] Create a demo cashier account (PIN: 1234)
- [ ] Write a 1-page Quick Start Guide for store owner

### Acceptance Criteria
- Windows installer produces a working `.exe` that installs and runs on a clean machine
- Auto-backup creates a timestamped DB copy on app close
- All flows feel polished — no raw errors, broken layouts, or missing feedback
- New user can complete first transaction within 5 minutes of opening the app

### QA Checklist
- [ ] Every list page has an empty state (not blank screen)
- [ ] Loading skeletons show for DB queries > 300ms
- [ ] All success actions show toast notification
- [ ] All error actions show toast notification with friendly message
- [ ] Delete product → confirmation modal → confirm → product deleted + toast
- [ ] Auto-lock triggers after configurable timeout
- [ ] PIN re-entry on lock screen — session preserved (cart state intact)
- [ ] Responsive layout: test on 1024px wide viewport (tablet)
- [ ] Settings page: change store name → receipt shows new name
- [ ] Settings page: change currency rounding → checkout uses new rounding
- [ ] Settings page: change loyalty rates → points calculation uses new rates
- [ ] All IPC handlers validate role before sensitive operations
- [ ] No plain-text PINs in database (bcrypt hashes only)
- [ ] No SQL injection possible (parameterized queries only)
- [ ] Windows installer (.exe) installs and runs on clean machine
- [ ] Auto-backup creates DB copy on app close → file exists in backup folder
- [ ] E2E test passes: `npm run test:e2e`
- [ ] All unit tests pass: `npm test`

### Deliverable
Installable, demo-ready POS that can be shown to any store.

---

## Timeline Summary

| Phase | Description | Duration |
|---|---|---|
| Phase 0 | Project Setup | 3–5 days |
| Phase 1 | Core POS & Checkout | 2–3 weeks |
| Phase 2 | Products & Inventory | 1–2 weeks |
| Phase 3 | Customers & Loyalty | 1 week |
| Phase 4 | Store Management & Reports | 1–2 weeks |
| Phase 5 | Polish & Deployment | 1 week |
| **Total** | | **10–14 weeks** |

---

## Build Priority Order

If you need to demo to a client early, build in this order:

```
1. Login with PIN
2. Product grid + search
3. Add to cart + checkout
4. Cash payment + receipt
5. Basic reports

→ This alone is enough to demo and close a client deal.
```

Everything else is an enhancement on top of a working foundation.
