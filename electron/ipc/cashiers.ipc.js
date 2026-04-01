const { ipcMain } = require('electron');
const bcrypt = require('bcryptjs');
const log = require('electron-log');
const { setSession, clearSession, requireRole, getSession } = require('../utils/session');
const { writeAudit } = require('../utils/audit');
const { validate } = require('../utils/validate');

module.exports = function registerCashierHandlers(db) {
  // Authenticate cashier by PIN
  ipcMain.handle('cashiers:authenticate', async (_event, pin) => {
    try {
      if (!validate.pin(pin)) {
        return { success: false, error: 'Invalid PIN format' };
      }

      const cashiers = db.prepare('SELECT * FROM cashiers WHERE is_active = 1').all();

      for (const cashier of cashiers) {
        const match = await bcrypt.compare(pin, cashier.pin);
        if (match) {
          setSession({
            cashierId: cashier.id,
            name: cashier.name,
            role: cashier.role,
          });

          return {
            success: true,
            data: {
              cashierId: cashier.id,
              name: cashier.name,
              role: cashier.role,
            },
          };
        }
      }

      return { success: false, error: 'Invalid PIN' };
    } catch (err) {
      log.error('cashiers:authenticate failed', err);
      return { success: false, error: 'Authentication failed' };
    }
  });

  // Logout
  ipcMain.handle('session:logout', () => {
    const session = getSession();
    if (session) {
      writeAudit({
        cashierId: session.cashierId,
        action: 'session:logout',
        targetType: 'session',
        targetId: null,
      });
    }
    clearSession();
    return { success: true };
  });

  // Get all cashiers (admin/manager only)
  ipcMain.handle('cashiers:getAll', () => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      const cashiers = db.prepare(
        'SELECT id, name, role, is_active, created_at FROM cashiers ORDER BY name'
      ).all();

      return { success: true, data: cashiers };
    } catch (err) {
      log.error('cashiers:getAll failed', err);
      return { success: false, error: 'Failed to load cashiers' };
    }
  });

  // Create cashier (admin only)
  ipcMain.handle('cashiers:create', async (_event, data) => {
    try {
      const { authorized, session, error } = requireRole('admin');
      if (!authorized) return { success: false, error };

      if (!validate.text(data.name) || !validate.pin(data.pin) || !validate.role(data.role)) {
        return { success: false, error: 'Invalid input' };
      }

      const hashedPin = await bcrypt.hash(data.pin, 10);

      const result = db.prepare(
        'INSERT INTO cashiers (name, pin, role) VALUES (?, ?, ?)'
      ).run(data.name.trim(), hashedPin, data.role);

      writeAudit({
        cashierId: session.cashierId,
        action: 'cashier:create',
        targetType: 'cashier',
        targetId: result.lastInsertRowid,
        details: { name: data.name, role: data.role },
      });

      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (err) {
      log.error('cashiers:create failed', err);
      return { success: false, error: 'Failed to create cashier' };
    }
  });

  // Update cashier (admin only)
  ipcMain.handle('cashiers:update', (_event, id, data) => {
    try {
      const { authorized, session, error } = requireRole('admin');
      if (!authorized) return { success: false, error };

      if (!validate.id(id)) return { success: false, error: 'Invalid ID' };

      const updates = [];
      const params = [];

      if (data.name && validate.text(data.name)) {
        updates.push('name = ?');
        params.push(data.name.trim());
      }
      if (data.role && validate.role(data.role)) {
        updates.push('role = ?');
        params.push(data.role);
      }
      if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active ? 1 : 0);
      }

      if (updates.length === 0) return { success: false, error: 'No valid fields to update' };

      params.push(id);
      db.prepare(`UPDATE cashiers SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      writeAudit({
        cashierId: session.cashierId,
        action: 'cashier:update',
        targetType: 'cashier',
        targetId: id,
        details: data,
      });

      return { success: true };
    } catch (err) {
      log.error('cashiers:update failed', err);
      return { success: false, error: 'Failed to update cashier' };
    }
  });

  // Change PIN (admin only)
  ipcMain.handle('cashiers:changePin', async (_event, id, newPin) => {
    try {
      const { authorized, session, error } = requireRole('admin');
      if (!authorized) return { success: false, error };

      if (!validate.id(id) || !validate.pin(newPin)) {
        return { success: false, error: 'Invalid input' };
      }

      const hashedPin = await bcrypt.hash(newPin, 10);
      db.prepare('UPDATE cashiers SET pin = ? WHERE id = ?').run(hashedPin, id);

      writeAudit({
        cashierId: session.cashierId,
        action: 'cashier:changePin',
        targetType: 'cashier',
        targetId: id,
      });

      return { success: true };
    } catch (err) {
      log.error('cashiers:changePin failed', err);
      return { success: false, error: 'Failed to change PIN' };
    }
  });
};
