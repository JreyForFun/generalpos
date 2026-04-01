const { ipcMain } = require('electron');
const log = require('electron-log');
const { getSession, requireRole } = require('../utils/session');

module.exports = function registerReportHandlers(db) {
  ipcMain.handle('reports:dailySales', (_event, date) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      const targetDate = date || new Date().toISOString().slice(0, 10);
      const summary = db.prepare(`
        SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_sales, COALESCE(SUM(discount_amount), 0) as total_discounts, COALESCE(SUM(tip_amount), 0) as total_tips
        FROM orders WHERE DATE(created_at) = ? AND status = 'completed'
      `).get(targetDate);

      return { success: true, data: { ...summary, date: targetDate } };
    } catch (err) {
      log.error('reports:dailySales failed', err);
      return { success: false, error: 'Failed to load sales report' };
    }
  });

  ipcMain.handle('reports:salesByMethod', (_event, date) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };
      const targetDate = date || new Date().toISOString().slice(0, 10);

      const methods = db.prepare(`
        SELECT p.method, COUNT(*) as count, SUM(p.amount) as total
        FROM payments p JOIN orders o ON p.order_id = o.id
        WHERE DATE(o.created_at) = ? AND o.status = 'completed'
        GROUP BY p.method
      `).all(targetDate);

      return { success: true, data: methods };
    } catch (err) {
      log.error('reports:salesByMethod failed', err);
      return { success: false, error: 'Failed to load payment methods' };
    }
  });

  ipcMain.handle('reports:bestSellers', (_event, date) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };
      const targetDate = date || new Date().toISOString().slice(0, 10);

      const bestSellers = db.prepare(`
        SELECT oi.name, SUM(oi.quantity) as total_qty, SUM(oi.total) as total_revenue
        FROM order_items oi JOIN orders o ON oi.order_id = o.id
        WHERE DATE(o.created_at) = ? AND o.status = 'completed'
        GROUP BY oi.product_id ORDER BY total_qty DESC LIMIT 10
      `).all(targetDate);

      return { success: true, data: bestSellers };
    } catch (err) {
      log.error('reports:bestSellers failed', err);
      return { success: false, error: 'Failed to load best sellers' };
    }
  });

  ipcMain.handle('reports:exportPDF', (_event, data) => {
    try {
      // PDF export will be implemented in Phase 4
      return { success: false, error: 'PDF export not yet implemented' };
    } catch (err) {
      log.error('reports:exportPDF failed', err);
      return { success: false, error: 'Failed to export PDF' };
    }
  });

  // ─── Cash Flows ───
  ipcMain.handle('cashflows:open', (_event, amount) => {
    try {
      const session = getSession();
      if (!session) return { success: false, error: 'No active session' };

      db.prepare('INSERT INTO cash_flows (cashier_id, type, amount, note) VALUES (?, ?, ?, ?)').run(
        session.cashierId, 'open', amount, 'Drawer opened'
      );
      return { success: true };
    } catch (err) {
      log.error('cashflows:open failed', err);
      return { success: false, error: 'Failed to open drawer' };
    }
  });

  ipcMain.handle('cashflows:add', (_event, data) => {
    try {
      const session = getSession();
      if (!session) return { success: false, error: 'No active session' };

      db.prepare('INSERT INTO cash_flows (cashier_id, type, amount, note) VALUES (?, ?, ?, ?)').run(
        session.cashierId, data.type, data.amount, data.note || null
      );
      return { success: true };
    } catch (err) {
      log.error('cashflows:add failed', err);
      return { success: false, error: 'Failed to add cash flow' };
    }
  });

  ipcMain.handle('cashflows:close', (_event, data) => {
    try {
      const session = getSession();
      if (!session) return { success: false, error: 'No active session' };

      db.prepare('INSERT INTO cash_flows (cashier_id, type, amount, note) VALUES (?, ?, ?, ?)').run(
        session.cashierId, 'close', data.amount, data.note || 'Drawer closed'
      );
      return { success: true };
    } catch (err) {
      log.error('cashflows:close failed', err);
      return { success: false, error: 'Failed to close drawer' };
    }
  });

  ipcMain.handle('cashflows:getAll', (_event, filters = {}) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      let sql = 'SELECT cf.*, c.name as cashier_name FROM cash_flows cf LEFT JOIN cashiers c ON cf.cashier_id = c.id WHERE 1=1';
      const params = [];
      if (filters.date) { sql += ' AND DATE(cf.created_at) = ?'; params.push(filters.date); }
      sql += ' ORDER BY cf.created_at DESC';

      return { success: true, data: db.prepare(sql).all(...params) };
    } catch (err) {
      log.error('cashflows:getAll failed', err);
      return { success: false, error: 'Failed to load cash flows' };
    }
  });
};
