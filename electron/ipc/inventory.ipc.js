const { ipcMain } = require('electron');
const log = require('electron-log');
const { getSession, requireRole } = require('../utils/session');
const { validate } = require('../utils/validate');

module.exports = function registerInventoryHandlers(db) {
  ipcMain.handle('inventory:adjust', (_event, productId, adjustment) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };
      if (!validate.id(productId)) return { success: false, error: 'Invalid product ID' };

      const { quantity, reason } = adjustment;
      if (!Number.isInteger(quantity) || quantity === 0) return { success: false, error: 'Invalid quantity' };

      db.prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(quantity, productId);
      return { success: true };
    } catch (err) {
      log.error('inventory:adjust failed', err);
      return { success: false, error: 'Failed to adjust stock' };
    }
  });

  ipcMain.handle('inventory:getLowStock', () => {
    try {
      const products = db.prepare('SELECT * FROM products WHERE stock <= low_stock_alert AND is_available = 1 ORDER BY stock ASC').all();
      return { success: true, data: products };
    } catch (err) {
      log.error('inventory:getLowStock failed', err);
      return { success: false, error: 'Failed to load low stock items' };
    }
  });
};
