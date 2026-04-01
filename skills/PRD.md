# Product Requirements Document (PRD)
## Freelancer POS System — V1

---

## 1. Overview

### Product Name
**FlexPOS** *(working title — customizable per client)*

### Product Type
Desktop Point of Sale (POS) application built with Electron, designed for single-store small to medium businesses.

### Target Users
- Small retail shops
- Cafes and food stalls
- Boutique stores
- Any single-location business needing a modern, affordable POS

### Problem Statement
Most POS solutions available (e.g., Odoo, Lightspeed) are either too expensive, too complex, or require constant internet connectivity. Small store owners need a **simple, reliable, offline-first POS** that covers their daily needs without bloated features or monthly subscription costs.

### Goal
Deliver a fully functional, installable desktop POS application that a store can use out of the box — with no internet dependency, no monthly fees, and a clean UI that any cashier can learn in minutes.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Electron (Stable) |
| Frontend | React + TailwindCSS |
| Backend / Logic | Node.js (Electron Main Process) |
| Database | SQLite (via better-sqlite3) |
| PDF/Invoice | electron-pdf or pdfkit |
| State Management | Zustand or Redux Toolkit |
| Offline Storage | SQLite (always local) |

---

## 3. User Roles

| Role | Description |
|---|---|
| **Admin / Owner** | Full access — manages products, staff, reports, settings |
| **Manager** | Access to reports, order history, inventory |
| **Cashier** | Checkout only — no access to settings or reports |

Authentication is PIN-based. No internet login required.

---

## 4. Feature Requirements

---

### 4.1 OVERVIEW

| ID | Feature | Description | Priority |
|---|---|---|---|
| OV-01 | Intuitive Display | Clean, minimal UI optimized for touch and mouse | High |
| OV-02 | Quick Search | Search products and customers from any screen | High |
| OV-03 | Browser/OS Compatibility | Runs on Windows, macOS, Linux via Electron | High |
| OV-04 | PC & Tablet Compatible | Responsive layout for different screen sizes | High |
| OV-05 | Offline Mode | App works fully without internet at all times | High |

---

### 4.2 PAYMENTS

| ID | Feature | Description | Priority |
|---|---|---|---|
| PAY-01 | Cash Payment | Input cash received, compute and display change | High |
| PAY-02 | Bill Splitting | Split one order across multiple payers/methods | Medium |
| PAY-03 | Currency Rounding | Round totals to smallest currency denomination | Medium |
| PAY-04 | Invoicing | Generate and print/export PDF invoices | High |
| PAY-05 | Customer Tips | Add tip as fixed amount or convert change to tip | Low |
| PAY-06 | Offline Payment Sync | Queue offline transactions, sync when online | Medium |

---

### 4.3 CHECKOUT

| ID | Feature | Description | Priority |
|---|---|---|---|
| CHK-01 | Prices & Discounts | Apply % or fixed discounts per item or whole order | High |
| CHK-02 | Parallel Orders | Hold active order, start a new one simultaneously | High |
| CHK-03 | Customized Receipts | Field-based receipt template (store name, promos, hours) — not WYSIWYG | Medium |
| CHK-04 | Sell on the Move | Works on tablet with touch-friendly UI | Medium |

---

### 4.4 STORE MANAGEMENT

| ID | Feature | Description | Priority |
|---|---|---|---|
| SM-01 | Order History | View, search, and filter all past orders | High |
| SM-02 | Daily Sales Report | Summary of sales, totals per payment type per day | High |
| SM-03 | Cashier Accounts | Multiple cashier profiles secured with PIN | High |
| SM-04 | Cash Flows | Track cash-in/cash-out, end-of-day cash reconciliation | High |
| SM-05 | Stock & Inventory | Basic stock tracking, low stock alerts, manual adjustments | High |

---

### 4.5 CUSTOMER LOYALTY

| ID | Feature | Description | Priority |
|---|---|---|---|
| CL-01 | Customer Registration | Add customer: name, email, contact number | High |
| CL-02 | Identify Customers | Search customer by name or phone at checkout | High |
| CL-03 | Customer Discounts | Assign permanent or time-limited discounts to a customer | Medium |
| CL-04 | Loyalty Points | Earn points per purchase, redeem for rewards/discounts | Medium |
| CL-05 | eWallet | Store credit balance per customer, deduct at checkout | Medium |

---

### 4.6 PRODUCTS

| ID | Feature | Description | Priority |
|---|---|---|---|
| PRD-01 | Product Categories | Hierarchical categories (e.g., Drinks > Hot Drinks) | High |
| PRD-02 | Product Search | Search by name or description | High |
| PRD-03 | Product Variants | Size, color, or config variants under one parent product | High |
| PRD-04 | Availability Toggle | Mark product as available or out of stock | High |
| PRD-05 | Gift Cards | Generate gift card codes with stored balance | Medium |
| PRD-06 | Multiple Barcodes | Assign multiple barcodes per product | Low |

---

## 5. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Performance** | Checkout screen must load in under 1 second |
| **Offline First** | 100% of core features work without internet |
| **Data Safety** | Auto-backup SQLite database daily to a local folder |
| **Security** | PIN-based auth (bcrypt hashed), role-based access control |
| **Input Validation** | All IPC inputs validated in Main process before processing |
| **Auto-Lock** | Screen locks after configurable idle timeout (default: 5min), PIN re-entry to unlock |
| **Audit Logging** | All sensitive actions logged to append-only `audit_log` table |
| **Dark Mode** | Obsidian Terminal dark theme as default — optimized for varied lighting |
| **Installable** | Single installer (.exe / .dmg / .deb) for easy deployment |
| **Printable** | Receipt and invoice printing via system printer |
| **Testable** | Unit tests (Vitest) for business logic, E2E test (Playwright) for critical checkout flow |

---

## 6. Out of Scope (V1)

- Barcode scanner / payment terminal hardware integration
- Credit/debit card terminal support
- Multi-branch / franchise management
- Self-service kiosk mode
- Kitchen display system (KDS)
- Accounting module integration
- B2B VAT computation
- Weight-based product pricing
- Dynamic barcodes

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Cashier can complete a transaction | Under 30 seconds |
| New cashier can learn the system | Under 1 hour |
| App uptime | 100% offline, no crashes |
| Data loss incidents | Zero |

---

## 8. Glossary

| Term | Meaning |
|---|---|
| POS | Point of Sale |
| SKU | Stock Keeping Unit |
| eWallet | Stored digital credit balance for a customer |
| Parallel Order | Holding one order while processing another |
| PIN | Personal Identification Number used for staff login |
