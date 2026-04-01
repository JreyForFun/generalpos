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
│   ├── utils/
│   │   ├── validate.js          # Input validation helpers
│   │   ├── audit.js             # Audit log writer
│   │   └── session.js           # In-memory session manager (Main process)
│   └── ipc/
│       ├── products.ipc.js      # Product CRUD handlers
│       ├── orders.ipc.js        # Order/checkout handlers
│       ├── customers.ipc.js     # Customer handlers
│       ├── cashiers.ipc.js      # Cashier auth handlers
│       ├── reports.ipc.js       # Sales report handlers
│       ├── inventory.ipc.js     # Stock handlers
│       ├── settings.ipc.js      # Store settings handlers
│       └── audit.ipc.js         # Audit log query handlers
│
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Root component + view switching
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
│   │   │   ├── Layout.jsx       # Main layout wrapper
│   │   │   └── IdleLock.jsx     # Auto-lock overlay on idle timeout
│   │   ├── checkout/
│   │   │   ├── Cart.jsx         # Active cart/order
│   │   │   ├── ProductGrid.jsx  # Product selection grid
│   │   │   ├── PaymentModal.jsx # Payment screen
│   │   │   ├── ReceiptModal.jsx # Receipt preview/print
│   │   │   ├── HeldOrders.jsx   # Parallel/held orders
│   │   │   └── CustomerSelect.jsx # Customer search & selection
│   │   ├── shared/
│   │   │   ├── SearchBar.jsx    # Global search
│   │   │   ├── Modal.jsx        # Reusable modal
│   │   │   ├── ConfirmModal.jsx # Destructive action confirmation
│   │   │   ├── Toast.jsx        # Toast notification system
│   │   │   ├── Table.jsx        # Reusable data table
│   │   │   └── PinPad.jsx       # PIN entry keypad
│   ├── hooks/
│   │   ├── useIdleLock.js       # Idle timeout detection hook
│   │   ├── useIpc.js            # IPC call wrapper with error handling
│   │   └── useKeyboardShortcuts.js # Global keyboard shortcuts
│   ├── store/
│   │   ├── viewStore.js         # Zustand view navigation state
│   │   ├── checkoutStore.js     # Zustand checkout/cart state
│   │   ├── sessionStore.js      # Active cashier session
│   │   └── settingsStore.js     # App settings state
│   ├── constants/
│   │   ├── ipc-channels.js      # All IPC channel name constants
│   │   ├── roles.js             # User role constants
│   │   └── order-status.js      # Order status constants
│   └── lib/
│       └── cn.js                # clsx + tailwind-merge helper
│
├── database/
│   ├── db.js                    # SQLite connection + migration runner
│   ├── migrations/
│   │   ├── 001_initial.sql      # V1.0 schema (all tables)
│   │   └── 002_indexes.sql      # Performance indexes
│   └── seeds/
│       └── demo_data.sql        # Demo data for testing
│
├── tests/
│   ├── unit/
│   │   ├── cart.test.js         # Cart calculation tests
│   │   ├── rounding.test.js     # Currency rounding tests
│   │   ├── validate.test.js     # Input validation tests
│   │   └── loyalty.test.js      # Loyalty points tests
│   └── e2e/
│       └── checkout-flow.spec.js # Critical path E2E test
│
├── public/
│   └── icons/                   # App icons
│
├── vite.config.js
├── vitest.config.js             # Test runner config
├── electron-builder.yml         # Build/installer config
└── package.json
```

---

## 5. Database Schema (SQLite)

### Migration System

On app startup, `db.js` reads all `.sql` files in `database/migrations/`, checks the `_migrations` tracker table, and runs any unapplied migrations in filename order. This ensures safe schema evolution across versions.

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  filename    TEXT NOT NULL UNIQUE,
  applied_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

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
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
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
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
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
  refund_for      INTEGER REFERENCES orders(id), -- links refund to original order
  subtotal        REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  tip_amount      REAL DEFAULT 0,
  total           REAL NOT NULL,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
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

### app_settings
```sql
-- Replaces single-row loyalty_rules table.
-- Key-value store for all configurable settings.
CREATE TABLE app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default settings inserted on first run:
-- loyalty_points_per_peso  = '1'
-- loyalty_peso_per_point   = '0.1'
-- auto_lock_minutes        = '5'
-- pin_length               = '4'
-- currency_rounding         = 'peso'   (none | centavo_5 | peso)
-- receipt_auto_print       = '0'
```

### audit_log
```sql
CREATE TABLE audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cashier_id  INTEGER REFERENCES cashiers(id),
  action      TEXT NOT NULL,        -- e.g., 'product:delete', 'order:refund'
  target_type TEXT NOT NULL,        -- e.g., 'product', 'order', 'cashier'
  target_id   INTEGER,
  details     TEXT,                 -- JSON string with context
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_cashier_id ON orders(cashier_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_product_barcodes_barcode ON product_barcodes(barcode);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_cash_flows_cashier_id ON cash_flows(cashier_id);
CREATE INDEX idx_cash_flows_created_at ON cash_flows(created_at);
CREATE INDEX idx_audit_log_cashier_id ON audit_log(cashier_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
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

### 6.1 Session Management (Memory-Only)

**Renderer Process (Zustand `sessionStore`):**
- Holds: `{ cashierId, name, role, loginTime }`
- Cleared on logout or window close
- Never written to localStorage or IndexedDB

**Main Process (in-memory variable in `electron/utils/session.js`):**
- `activeSession` object: `{ cashierId, name, role }`
- Set via `cashiers:authenticate` IPC handler
- Checked by every sensitive IPC handler before execution
- Cleared on `session:logout` IPC call or app quit

**Sync:** On successful PIN auth, Main process sets its session AND returns the data to Renderer. Both sides always have the same session — no drift possible.

### 6.2 Auto-Lock / Idle Timeout

- App auto-locks after configurable idle timeout (default: 5 minutes, stored in `app_settings`)
- Lock screen shows PIN pad — same component as login
- Idle detection tracks mouse movement, keyboard, and touch events via `useIdleLock` hook
- Timer resets on any user interaction
- Cashier session is preserved — no logout, just lock overlay
- Implemented as `<IdleLock>` wrapper component around the main layout

### 6.3 Input Validation

- All IPC handlers validate inputs via `electron/utils/validate.js` before processing
- Validation rules:
  - `quantity` → positive integer, max 9999
  - `price` / `amount` → non-negative number, max 2 decimal places, max 999999.99
  - `name` / `text` → string, trimmed, max 255 characters
  - `id` → positive integer
  - `pin` → string, digits only, length 4-6
- Invalid input returns `{ success: false, error: 'Invalid input' }`

### 6.4 Audit Logging

- Every destructive or sensitive action writes to `audit_log` table
- Actions logged: product CRUD, order refund, cashier management, customer delete, cash flows, settings changes
- Audit log is **append-only** — never UPDATE or DELETE
- Written via `electron/utils/audit.js` helper

### 6.5 SQLite Encryption — V1 Decision

> **Accepted Risk:** SQLite database is stored unencrypted on disk for V1.
>
> **Rationale:**
> - FlexPOS is a local, single-device app with no network exposure
> - DB file is only accessible to users with OS-level machine access
> - Adding `sqlcipher` introduces native build complexity and CI issues
>
> **V2 Consideration:** Offer optional encryption for stores with sensitive customer data.

---

## 7. View Navigation (Zustand-Based)

FlexPOS uses Zustand state-based view switching instead of React Router. There is no URL bar, browser history, or deep linking in an Electron app — a simple view state is cleaner and faster.

```js
// store/viewStore.js
const useViewStore = create((set) => ({
  currentView: 'login',       // login | checkout | products | orders | inventory
                               // | customers | reports | cashiers | settings
  previousView: null,
  navigate: (view) => set((state) => ({
    currentView: view,
    previousView: state.currentView,
  })),
  goBack: () => set((state) => ({
    currentView: state.previousView || 'checkout',
    previousView: null,
  })),
}));
```

`App.jsx` renders the active view based on `currentView`:
```jsx
const App = () => {
  const { currentView } = useViewStore();
  const views = {
    login: <Login />,
    checkout: <Checkout />,
    products: <Products />,
    orders: <Orders />,
    // ... etc
  };
  return <IdleLock><Layout>{views[currentView]}</Layout></IdleLock>;
};
```

---

## 8. Checkout State Machine

The checkout screen is the most complex view. Its state is managed by `checkoutStore.js`:

```js
// store/checkoutStore.js
{
  // Cart
  items: [],                    // { productId, variantId, name, price, qty, discount, total }

  // Customer
  selectedCustomer: null,       // { id, name, discount, points, ewallet }

  // Discounts
  orderDiscount: { type: null, value: 0 },  // 'percent' | 'fixed'

  // Totals (computed via derived getters)
  subtotal: 0,
  discountAmount: 0,
  tipAmount: 0,
  total: 0,

  // Held orders
  heldOrders: [],               // Array of full cart snapshots

  // UI state
  paymentModalOpen: false,
  receiptModalOpen: false,
  selectedCategory: 'all',
  searchQuery: '',
}
```

**State Flow:**
```
Browsing → Add item → Cart has items
  → (optional) Select customer → auto-apply discount
  → (optional) Apply order discount
  → Click Pay → Payment modal opens
  → Enter cash → Compute change → Confirm
  → Order written to SQLite (transaction: order + items + payment + stock deduction)
  → Receipt preview → Print/Close
  → Cart cleared → Ready for next order

At any point:
  → Hold order → Cart snapshot saved → New empty cart
  → Resume held order → Restore snapshot → Continue
```

---

## 9. Offline Architecture

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

## 10. Build & Deployment

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
