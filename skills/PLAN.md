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
- [ ] Create initial SQLite migration (all tables from schema)
- [ ] Set up TailwindCSS
- [ ] Set up Zustand for state management
- [ ] Set up `electron-log` for error logging
- [ ] Create IPC channel constants file
- [ ] Set up custom window (frameless + custom titlebar)
- [ ] Configure `electron-builder.yml` for Windows/macOS/Linux output
- [ ] Create basic folder structure as per ARCHITECTURE.md

### Deliverable
A running Electron app that opens, shows a blank screen, and can read/write to SQLite.

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
- [ ] Customizable footer (store message)

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
- [ ] Stock auto-deducted on order completion

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
