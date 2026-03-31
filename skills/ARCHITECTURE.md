# Architecture Document
## FlexPOS — Electron + SQLite + React

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  ELECTRON APP                        │
│                                                     │
│  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │   RENDERER PROCESS  │  │    MAIN PROCESS      │  │
│  │   (React Frontend)  │◄─►  (Node.js Backend)   │  │
│  │                     │  │                      │  │
│  │  - Checkout UI      │  │  - Business Logic    │  │
│  │  - Dashboard        │  │  - Database Queries  │  │
│  │  - Reports          │  │  - PDF Generation    │  │
│  │  - Settings         │  │  - File System       │  │
│  └─────────────────────┘  └──────────┬───────────┘  │
│                                      │              │
│                            ┌─────────▼────────┐     │
│                            │   SQLite DB      │     │
│                            │  (local file)    │     │
│                            └──────────────────┘     │
└─────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Desktop Shell | Electron (Stable) | Cross-platform, web tech for desktop |
| UI Framework | React 18 | Component-based, fast rendering |
| Styling | TailwindCSS | Rapid UI, responsive by default |
| State Management | Zustand | Lightweight, simple for POS state |
| Database | SQLite (better-sqlite3) | Embedded, offline-first, zero config |
| IPC Bridge | Electron contextBridge | Secure renderer ↔ main communication |
| PDF Generation | pdfkit | Node.js-native PDF for invoices/receipts |
| Build Tool | Vite + electron-builder | Fast dev, production installer output |
| Icons | Lucide React | Clean, consistent icon set |

---

## 3. Electron Process Architecture

### Main Process (`main/`)
Runs in Node.js. Has full system access.
- Opens the app window
- Handles all SQLite database operations
- Generates PDFs
- Manages file system (backups, exports)
- Listens for IPC calls from Renderer

### Renderer Process (`renderer/`)
Runs in Chromium (like a browser). No direct DB access.
- Displays all UI (React)
- Sends IPC calls to Main for data
- Handles local UI state (cart, active order)

### IPC Communication (contextBridge)
```
Renderer                     Main Process
   │                              │
   │  ipcRenderer.invoke(         │
   │    'get-products',           │
   │    { category: 'drinks' }    │
   │  )                           │
   │ ────────────────────────────►│
   │                              │ query SQLite
   │                              │ return rows
   │◄────────────────────────────│
   │  returns product list        │
```

---

## 4. Folder Structure

```
flexpos/
├── electron/
│   ├── main.js                  # Electron entry point
│   ├── preload.js               # contextBridge API exposure
│   └── ipc/
│       ├── products.ipc.js      # Product CRUD handlers
│       ├── orders.ipc.js        # Order/checkout handlers
│       ├── customers.ipc.js     # Customer handlers
│       ├── cashiers.ipc.js      # Cashier auth handlers
│       ├── reports.ipc.js       # Sales report handlers
│       ├── inventory.ipc.js     # Stock handlers
│       └── settings.ipc.js      # Store settings handlers
│
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Root component + routing
│   ├── pages/
│   │   ├── Checkout.jsx         # Main POS checkout screen
│   │   ├── Orders.jsx           # Order history
│   │   ├── Products.jsx         # Product management
│   │   ├── Inventory.jsx        # Stock management
│   │   ├── Customers.jsx        # Customer management
│   │   ├── Reports.jsx          # Sales reports & dashboard
│   │   ├── Cashiers.jsx         # Staff management
│   │   ├── Settings.jsx         # Store settings
│   │   └── Login.jsx            # PIN login screen
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Titlebar.jsx     # Custom window title bar
│   │   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   │   └── Layout.jsx       # Main layout wrapper
│   │   ├── checkout/
│   │   │   ├── Cart.jsx         # Active cart/order
│   │   │   ├── ProductGrid.jsx  # Product selection grid
│   │   │   ├── PaymentModal.jsx # Payment screen
│   │   │   ├── ReceiptModal.jsx # Receipt preview/print
│   │   │   └── HeldOrders.jsx   # Parallel/held orders
│   │   ├── shared/
│   │   │   ├── SearchBar.jsx    # Global search
│   │   │   ├── Modal.jsx        # Reusable modal
│   │   │   ├── Table.jsx        # Reusable data table
│   │   │   └── PinPad.jsx       # PIN entry keypad
│   └── store/
│       ├── cartStore.js         # Zustand cart state
│       ├── sessionStore.js      # Active cashier session
│       └── settingsStore.js     # App settings state
│
├── database/
│   ├── db.js                    # SQLite connection + init
│   ├── migrations/
│   │   └── 001_initial.sql      # Initial schema
│   └── seeds/
│       └── demo_data.sql        # Demo data for testing
│
├── public/
│   └── icons/                   # App icons
│
├── vite.config.js
├── electron-builder.yml         # Build/installer config
└── package.json
```

---

## 5. Database Schema (SQLite)

### stores
```sql
CREATE TABLE stores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  logo_path   TEXT,
  currency    TEXT DEFAULT 'PHP',
  receipt_note TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### cashiers
```sql
CREATE TABLE cashiers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  pin         TEXT NOT NULL,
  role        TEXT DEFAULT 'cashier', -- cashier | manager | admin
  is_active   INTEGER DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### categories
```sql
CREATE TABLE categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  parent_id   INTEGER REFERENCES categories(id),
  sort_order  INTEGER DEFAULT 0
);
```

### products
```sql
CREATE TABLE products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  description   TEXT,
  category_id   INTEGER REFERENCES categories(id),
  price         REAL NOT NULL DEFAULT 0,
  cost          REAL DEFAULT 0,
  stock         INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  is_available  INTEGER DEFAULT 1,
  image_path    TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### product_variants
```sql
CREATE TABLE product_variants (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,      -- e.g., "Large", "Red"
  sku         TEXT,
  price       REAL,               -- override parent price if set
  stock       INTEGER DEFAULT 0,
  is_available INTEGER DEFAULT 1
);
```

### product_barcodes
```sql
CREATE TABLE product_barcodes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE,
  barcode     TEXT NOT NULL UNIQUE
);
```

### customers
```sql
CREATE TABLE customers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  points        REAL DEFAULT 0,
  ewallet       REAL DEFAULT 0,
  discount_type TEXT,             -- percent | fixed
  discount_value REAL DEFAULT 0,
  discount_expiry DATE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### orders
```sql
CREATE TABLE orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number    TEXT NOT NULL UNIQUE,
  cashier_id      INTEGER REFERENCES cashiers(id),
  customer_id     INTEGER REFERENCES customers(id),
  status          TEXT DEFAULT 'completed', -- completed | held | refunded
  subtotal        REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  tip_amount      REAL DEFAULT 0,
  total           REAL NOT NULL,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### order_items
```sql
CREATE TABLE order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id),
  variant_id  INTEGER REFERENCES product_variants(id),
  name        TEXT NOT NULL,       -- snapshot of name at time of sale
  price       REAL NOT NULL,       -- snapshot of price at time of sale
  quantity    INTEGER NOT NULL,
  discount    REAL DEFAULT 0,
  total       REAL NOT NULL
);
```

### payments
```sql
CREATE TABLE payments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  method      TEXT NOT NULL,       -- cash | ewallet | split
  amount      REAL NOT NULL,
  payer_name  TEXT,                -- for bill splitting
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### cash_flows
```sql
CREATE TABLE cash_flows (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cashier_id  INTEGER REFERENCES cashiers(id),
  type        TEXT NOT NULL,       -- open | in | out | close
  amount      REAL NOT NULL,
  note        TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### gift_cards
```sql
CREATE TABLE gift_cards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,
  balance     REAL NOT NULL,
  expiry_date DATE,
  is_active   INTEGER DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### loyalty_rules
```sql
CREATE TABLE loyalty_rules (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  points_per_peso REAL DEFAULT 1,   -- 1 point per ₱1 spent
  peso_per_point  REAL DEFAULT 0.1  -- ₱0.10 per point redeemed
);
```

---

## 6. Security Architecture

```
PIN Login
    ↓
PIN hashed with bcrypt before storing
    ↓
Session stored in memory only (Zustand)
    ↓
Role checked before every sensitive IPC call
    ↓
Session cleared on logout or app close
```

- All DB queries use **parameterized statements** (no SQL injection)
- Renderer process has **no direct DB access** — all via IPC
- contextBridge exposes only specific allowed functions

---

## 7. Offline Architecture

Since Electron + SQLite is **always local**, the app is inherently offline.

```
No internet needed for:
  ✅ Checkout & payments
  ✅ Product management
  ✅ Customer lookup
  ✅ Reports
  ✅ Inventory updates

Optional (when internet available):
  📤 Cloud backup of SQLite .db file
  📧 Email invoice to customer
```

---

## 8. Build & Deployment

```
Development:
  npm run dev   → Vite + Electron in dev mode

Production Build:
  npm run build → React build + Electron packaged

Output:
  dist/
  ├── FlexPOS-Setup-1.0.0.exe    (Windows)
  ├── FlexPOS-1.0.0.dmg          (macOS)
  └── FlexPOS-1.0.0.AppImage     (Linux)
```

Single installer file delivered to the store. No server. No config. Just install and run.
