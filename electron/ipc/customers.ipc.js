const { ipcMain } = require('electron');
const log = require('electron-log');
const { getSession, requireRole } = require('../utils/session');
const { writeAudit } = require('../utils/audit');
const { validate } = require('../utils/validate');

module.exports = function registerCustomerHandlers(db) {
  ipcMain.handle('customers:getAll', (_event, filters = {}) => {
    try {
      let sql = 'SELECT * FROM customers WHERE 1=1';
      const params = [];
      if (filters.search) {
        sql += ' AND (name LIKE ? OR phone LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      sql += ' ORDER BY name';
      return { success: true, data: db.prepare(sql).all(...params) };
    } catch (err) {
      log.error('customers:getAll failed', err);
      return { success: false, error: 'Failed to load customers' };
    }
  });

  ipcMain.handle('customers:getById', (_event, id) => {
    try {
      if (!validate.id(id)) return { success: false, error: 'Invalid ID' };
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      if (!customer) return { success: false, error: 'Customer not found' };
      customer.orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20').all(id);
      return { success: true, data: customer };
    } catch (err) {
      log.error('customers:getById failed', err);
      return { success: false, error: 'Failed to load customer' };
    }
  });

  ipcMain.handle('customers:create', (_event, data) => {
    try {
      const session = getSession();
      if (!session) return { success: false, error: 'No active session' };
      if (!validate.text(data.name)) return { success: false, error: 'Invalid name' };

      const result = db.prepare(`
        INSERT INTO customers (name, phone, email, discount_type, discount_value, discount_expiry)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(data.name.trim(), data.phone || null, data.email || null,
        data.discount_type || null, data.discount_value || 0, data.discount_expiry || null);

      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (err) {
      log.error('customers:create failed', err);
      return { success: false, error: 'Failed to create customer' };
    }
  });

  ipcMain.handle('customers:update', (_event, id, data) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };
      if (!validate.id(id)) return { success: false, error: 'Invalid ID' };

      db.prepare(`
        UPDATE customers SET name = ?, phone = ?, email = ?, discount_type = ?, discount_value = ?, discount_expiry = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(data.name?.trim(), data.phone || null, data.email || null,
        data.discount_type || null, data.discount_value || 0, data.discount_expiry || null, id);

      return { success: true };
    } catch (err) {
      log.error('customers:update failed', err);
      return { success: false, error: 'Failed to update customer' };
    }
  });

  ipcMain.handle('customers:delete', (_event, id) => {
    try {
      const { authorized, session, error } = requireRole('admin');
      if (!authorized) return { success: false, error };
      if (!validate.id(id)) return { success: false, error: 'Invalid ID' };

      const customer = db.prepare('SELECT name FROM customers WHERE id = ?').get(id);
      db.prepare('DELETE FROM customers WHERE id = ?').run(id);

      writeAudit({ cashierId: session.cashierId, action: 'customer:delete', targetType: 'customer', targetId: id, details: { name: customer?.name } });
      return { success: true };
    } catch (err) {
      log.error('customers:delete failed', err);
      return { success: false, error: 'Failed to delete customer' };
    }
  });
};
