const { ipcMain } = require('electron');
const log = require('electron-log');
const { requireRole } = require('../utils/session');
const { writeAudit } = require('../utils/audit');

/**
 * Ingredients IPC handlers — standalone supplies/raw materials inventory.
 */
module.exports = function registerIngredientHandlers(db) {
  ipcMain.handle('ingredients:getAll', () => {
    try {
      return { success: true, data: db.prepare('SELECT * FROM ingredients ORDER BY name ASC').all() };
    } catch (err) {
      log.error('ingredients:getAll failed', err);
      return { success: false, error: 'Failed to load ingredients' };
    }
  });

  ipcMain.handle('ingredients:create', (_event, data) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      const result = db.prepare(`
        INSERT INTO ingredients (name, unit, stock, low_stock_alert, cost_per_unit, supplier)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        data.name, data.unit || 'pcs', data.stock || 0,
        data.low_stock_alert || 5, data.cost_per_unit || 0, data.supplier || null
      );

      writeAudit(db, 'ingredient_create', 'ingredient', result.lastInsertRowid);
      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (err) {
      log.error('ingredients:create failed', err);
      return { success: false, error: 'Failed to create ingredient' };
    }
  });

  ipcMain.handle('ingredients:update', (_event, id, data) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      db.prepare(`
        UPDATE ingredients SET name = ?, unit = ?, low_stock_alert = ?, cost_per_unit = ?, supplier = ?
        WHERE id = ?
      `).run(data.name, data.unit, data.low_stock_alert, data.cost_per_unit, data.supplier || null, id);

      writeAudit(db, 'ingredient_update', 'ingredient', id);
      return { success: true };
    } catch (err) {
      log.error('ingredients:update failed', err);
      return { success: false, error: 'Failed to update ingredient' };
    }
  });

  ipcMain.handle('ingredients:delete', (_event, id) => {
    try {
      const { authorized, error } = requireRole('admin');
      if (!authorized) return { success: false, error };

      db.prepare('DELETE FROM ingredients WHERE id = ?').run(id);
      writeAudit(db, 'ingredient_delete', 'ingredient', id);
      return { success: true };
    } catch (err) {
      log.error('ingredients:delete failed', err);
      return { success: false, error: 'Failed to delete ingredient' };
    }
  });

  ipcMain.handle('ingredients:adjust', (_event, id, data) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      db.prepare('UPDATE ingredients SET stock = stock + ? WHERE id = ?').run(data.quantity, id);
      const updated = db.prepare('SELECT stock FROM ingredients WHERE id = ?').get(id);

      writeAudit(db, 'ingredient_adjust', 'ingredient', id, `qty: ${data.quantity}`);
      return { success: true, data: { newStock: updated.stock } };
    } catch (err) {
      log.error('ingredients:adjust failed', err);
      return { success: false, error: 'Failed to adjust ingredient stock' };
    }
  });
};
