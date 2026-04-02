/**
 * Audit log writer.
 * Appends to the audit_log table — NEVER update or delete.
 * Used by IPC handlers for all sensitive/destructive actions.
 */

const log = require('electron-log');

let db = null;
let insertStmt = null;

/**
 * Initialize the audit logger with a database reference.
 * Called once during app startup.
 * @param {import('better-sqlite3').Database} database
 */
function initAudit(database) {
  db = database;
  insertStmt = db.prepare(`
    INSERT INTO audit_log (cashier_id, action, target_type, target_id, details)
    VALUES (?, ?, ?, ?, ?)
  `);
}

/**
 * Write an audit log entry.
 * @param {object} entry
 * @param {number|null} entry.cashierId - Who performed the action
 * @param {string} entry.action - What was done (e.g., 'product:delete')
 * @param {string} entry.targetType - What type of thing was affected (e.g., 'product')
 * @param {number|null} entry.targetId - ID of the affected record
 * @param {object|null} entry.details - Additional JSON context (before/after values, etc.)
 */
function writeAudit({ cashierId, action, targetType, targetId, details = null }) {
  try {
    if (!db || !insertStmt) {
      log.warn('Audit logger not initialized — skipping audit write');
      return;
    }

    insertStmt.run(
      cashierId || null,
      action,
      targetType,
      targetId || null,
      details ? JSON.stringify(details) : null
    );
  } catch (err) {
    // Audit log failure should never crash the app — log and continue
    log.error('Audit log write failed:', err);
  }
}

module.exports = { initAudit, writeAudit };
