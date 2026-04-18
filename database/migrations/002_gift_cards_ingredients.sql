-- Gift Card enhancements: usage limits
ALTER TABLE gift_cards ADD COLUMN max_uses INTEGER DEFAULT 0;
ALTER TABLE gift_cards ADD COLUMN times_used INTEGER DEFAULT 0;

-- Ingredients / Supplies table (standalone inventory)
CREATE TABLE IF NOT EXISTS ingredients (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  unit            TEXT NOT NULL DEFAULT 'pcs',
  stock           REAL DEFAULT 0,
  low_stock_alert REAL DEFAULT 5,
  cost_per_unit   REAL DEFAULT 0,
  supplier        TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
