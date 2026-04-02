/**
 * SQLite database initialization and migration runner.
 * Uses better-sqlite3 (synchronous) — not async sqlite3.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const bcrypt = require('bcryptjs');
const { app } = require('electron');

let db = null;

/**
 * Initialize the database connection and run pending migrations.
 * Called once during app startup from main.js.
 * @returns {import('better-sqlite3').Database}
 */
function initDatabase() {
  const dbPath = app
    ? path.join(app.getPath('userData'), 'flexpos.db')
    : path.join(__dirname, '..', 'flexpos.db'); // fallback for tests

  log.info(`Database path: ${dbPath}`);

  db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create migrations tracker table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      filename    TEXT NOT NULL UNIQUE,
      applied_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Run pending migrations
  runMigrations();

  // Seed defaults, admin cashier, and demo data
  seedDefaults();
  seedAdminCashier();
  seedDemoData();

  return db;
}

/**
 * Run all pending migration files in order.
 * Reads .sql files from database/migrations/ and applies any that
 * haven't been recorded in the _migrations table.
 */
function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    log.warn('Migrations directory not found:', migrationsDir);
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied = db.prepare('SELECT filename FROM _migrations').all()
    .map((row) => row.filename);

  const pending = files.filter((f) => !applied.includes(f));

  if (pending.length === 0) {
    log.info('No pending migrations');
    return;
  }

  const insertMigration = db.prepare('INSERT INTO _migrations (filename) VALUES (?)');

  const runAll = db.transaction(() => {
    for (const filename of pending) {
      const filePath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(filePath, 'utf-8');

      log.info(`Running migration: ${filename}`);
      db.exec(sql);
      insertMigration.run(filename);
    }
  });

  runAll();
  log.info(`Applied ${pending.length} migration(s)`);
}

/**
 * Insert default app_settings if the table is empty.
 */
function seedDefaults() {
  const count = db.prepare('SELECT COUNT(*) as count FROM app_settings').get();
  if (count && count.count > 0) return;

  const defaults = {
    loyalty_points_per_peso: '1',
    loyalty_peso_per_point: '0.1',
    auto_lock_minutes: '5',
    pin_length: '4',
    currency_rounding: 'peso',
    receipt_auto_print: '0',
  };

  const insert = db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)');
  const seedAll = db.transaction(() => {
    for (const [key, value] of Object.entries(defaults)) {
      insert.run(key, value);
    }
  });

  seedAll();
  log.info('Default settings seeded');
}

/**
 * Seed an admin cashier if none exist.
 * Default PIN: 1234 (bcrypt hashed — cannot be done in raw SQL)
 */
function seedAdminCashier() {
  const cashierCount = db.prepare('SELECT COUNT(*) as count FROM cashiers').get();
  if (cashierCount && cashierCount.count > 0) return;

  const hashedPin = bcrypt.hashSync('1234', 10);
  db.prepare('INSERT INTO cashiers (name, pin, role) VALUES (?, ?, ?)').run(
    'Admin', hashedPin, 'admin'
  );
  log.info('Default admin cashier seeded (PIN: 1234)');
}

/**
 * Seed demo categories and products if products table is empty.
 */
function seedDemoData() {
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount && productCount.count > 0) return;

  const seedPath = path.join(__dirname, 'seeds', 'demo_data.sql');
  if (!fs.existsSync(seedPath)) {
    log.warn('Demo data seed file not found');
    return;
  }

  const sql = fs.readFileSync(seedPath, 'utf-8');
  db.exec(sql);
  log.info('Demo data seeded (categories + products)');
}

/**
 * Get the database instance (for use in IPC handlers).
 * @returns {import('better-sqlite3').Database}
 */
function getDatabase() {
  return db;
}

module.exports = { initDatabase, getDatabase };
