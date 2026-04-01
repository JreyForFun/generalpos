-- FlexPOS V1 Initial Schema
-- All tables as defined in ARCHITECTURE.md

CREATE TABLE IF NOT EXISTS stores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL DEFAULT 'My Store',
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  logo_path   TEXT,
  currency    TEXT DEFAULT 'PHP',
  receipt_note TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cashiers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  pin         TEXT NOT NULL,
  role        TEXT DEFAULT 'cashier',
  is_active   INTEGER DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  parent_id   INTEGER REFERENCES categories(id),
  sort_order  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
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

CREATE TABLE IF NOT EXISTS product_variants (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sku         TEXT,
  price       REAL,
  stock       INTEGER DEFAULT 0,
  is_available INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS product_barcodes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE,
  barcode     TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS customers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  points        REAL DEFAULT 0,
  ewallet       REAL DEFAULT 0,
  discount_type TEXT,
  discount_value REAL DEFAULT 0,
  discount_expiry DATE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number    TEXT NOT NULL UNIQUE,
  cashier_id      INTEGER REFERENCES cashiers(id),
  customer_id     INTEGER REFERENCES customers(id),
  status          TEXT DEFAULT 'completed',
  refund_for      INTEGER REFERENCES orders(id),
  subtotal        REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  tip_amount      REAL DEFAULT 0,
  total           REAL NOT NULL,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id),
  variant_id  INTEGER REFERENCES product_variants(id),
  name        TEXT NOT NULL,
  price       REAL NOT NULL,
  quantity    INTEGER NOT NULL,
  discount    REAL DEFAULT 0,
  total       REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  method      TEXT NOT NULL,
  amount      REAL NOT NULL,
  payer_name  TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cash_flows (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cashier_id  INTEGER REFERENCES cashiers(id),
  type        TEXT NOT NULL,
  amount      REAL NOT NULL,
  note        TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gift_cards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,
  balance     REAL NOT NULL,
  expiry_date DATE,
  is_active   INTEGER DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cashier_id  INTEGER REFERENCES cashiers(id),
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   INTEGER,
  details     TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default store record
INSERT OR IGNORE INTO stores (id, name) VALUES (1, 'My Store');
