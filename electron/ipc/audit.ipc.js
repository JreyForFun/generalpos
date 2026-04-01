const { ipcMain } = require('electron');
const log = require('electron-log');
const { requireRole } = require('../utils/session');

module.exports = function registerAuditHandlers(db) {
  ipcMain.handle('audit:getAll', (_event, filters = {}) => {
    try {
      const { authorized, error } = requireRole('admin');
      if (!authorized) return { success: false, error };

      let sql = 'SELECT al.*, c.name as cashier_name FROM audit_log al LEFT JOIN cashiers c ON al.cashier_id = c.id WHERE 1=1';
      const params = [];
      if (filters.date) { sql += ' AND DATE(al.created_at) = ?'; params.push(filters.date); }
      if (filters.action) { sql += ' AND al.action LIKE ?'; params.push(`%${filters.action}%`); }
      sql += ' ORDER BY al.created_at DESC LIMIT 200';

      return { success: true, data: db.prepare(sql).all(...params) };
    } catch (err) {
      log.error('audit:getAll failed', err);
      return { success: false, error: 'Failed to load audit log' };
    }
  });
};
