const { ipcMain } = require('electron');
const log = require('electron-log');
const { requireRole } = require('../utils/session');
const { writeAudit } = require('../utils/audit');
const { validate, validateFields } = require('../utils/validate');

module.exports = function registerProductHandlers(db) {
  // Get all products with optional filters
  ipcMain.handle('products:getAll', (_event, filters = {}) => {
    try {
      let sql = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
      const params = [];

      if (filters.categoryId) {
        sql += ' AND p.category_id = ?';
        params.push(filters.categoryId);
      }
      if (filters.availableOnly) {
        sql += ' AND p.is_available = 1';
      }
      if (filters.search) {
        sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      sql += ' ORDER BY p.name';
      const products = db.prepare(sql).all(...params);
      return { success: true, data: products };
    } catch (err) {
      log.error('products:getAll failed', err);
      return { success: false, error: 'Failed to load products' };
    }
  });

  // Get single product by ID with variants and barcodes
  ipcMain.handle('products:getById', (_event, id) => {
    try {
      if (!validate.id(id)) return { success: false, error: 'Invalid ID' };

      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
      if (!product) return { success: false, error: 'Product not found' };

      product.variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(id);
      product.barcodes = db.prepare('SELECT * FROM product_barcodes WHERE product_id = ?').all(id);

      return { success: true, data: product };
    } catch (err) {
      log.error('products:getById failed', err);
      return { success: false, error: 'Failed to load product' };
    }
  });

  // Create product (admin/manager only)
  ipcMain.handle('products:create', (_event, data) => {
    try {
      const { authorized, session, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      const { valid, errors } = validateFields(data, { name: 'text', price: 'amount' });
      if (!valid) return { success: false, error: errors.join(', ') };

      const result = db.prepare(`
        INSERT INTO products (name, description, category_id, price, cost, stock, low_stock_alert, is_available, image_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.name.trim(),
        data.description || null,
        data.category_id || null,
        data.price,
        data.cost || 0,
        data.stock || 0,
        data.low_stock_alert || 5,
        data.is_available !== undefined ? (data.is_available ? 1 : 0) : 1,
        data.image_path || null
      );

      writeAudit({
        cashierId: session.cashierId,
        action: 'product:create',
        targetType: 'product',
        targetId: result.lastInsertRowid,
        details: { name: data.name, price: data.price },
      });

      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (err) {
      log.error('products:create failed', err);
      return { success: false, error: 'Failed to create product' };
    }
  });

  // Update product (admin/manager only)
  ipcMain.handle('products:update', (_event, id, data) => {
    try {
      const { authorized, session, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };
      if (!validate.id(id)) return { success: false, error: 'Invalid ID' };

      const updates = [];
      const params = [];

      const fieldMap = {
        name: { col: 'name', transform: (v) => v.trim() },
        description: { col: 'description' },
        category_id: { col: 'category_id' },
        price: { col: 'price' },
        cost: { col: 'cost' },
        stock: { col: 'stock' },
        low_stock_alert: { col: 'low_stock_alert' },
        is_available: { col: 'is_available', transform: (v) => v ? 1 : 0 },
        image_path: { col: 'image_path' },
      };

      for (const [key, config] of Object.entries(fieldMap)) {
        if (data[key] !== undefined) {
          updates.push(`${config.col} = ?`);
          params.push(config.transform ? config.transform(data[key]) : data[key]);
        }
      }

      if (updates.length === 0) return { success: false, error: 'No fields to update' };

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      writeAudit({
        cashierId: session.cashierId,
        action: 'product:update',
        targetType: 'product',
        targetId: id,
        details: data,
      });

      return { success: true };
    } catch (err) {
      log.error('products:update failed', err);
      return { success: false, error: 'Failed to update product' };
    }
  });

  // Delete product (admin only)
  ipcMain.handle('products:delete', (_event, id) => {
    try {
      const { authorized, session, error } = requireRole('admin');
      if (!authorized) return { success: false, error };
      if (!validate.id(id)) return { success: false, error: 'Invalid ID' };

      const product = db.prepare('SELECT name FROM products WHERE id = ?').get(id);
      db.prepare('DELETE FROM products WHERE id = ?').run(id);

      writeAudit({
        cashierId: session.cashierId,
        action: 'product:delete',
        targetType: 'product',
        targetId: id,
        details: { name: product?.name },
      });

      return { success: true };
    } catch (err) {
      log.error('products:delete failed', err);
      return { success: false, error: 'Failed to delete product' };
    }
  });

  // ─── Categories ───
  ipcMain.handle('categories:getAll', () => {
    try {
      const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all();
      return { success: true, data: categories };
    } catch (err) {
      log.error('categories:getAll failed', err);
      return { success: false, error: 'Failed to load categories' };
    }
  });

  ipcMain.handle('categories:create', (_event, data) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };
      if (!validate.text(data.name)) return { success: false, error: 'Invalid name' };

      const result = db.prepare('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)').run(
        data.name.trim(), data.parent_id || null, data.sort_order || 0
      );
      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (err) {
      log.error('categories:create failed', err);
      return { success: false, error: 'Failed to create category' };
    }
  });

  ipcMain.handle('categories:update', (_event, id, data) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };
      if (!validate.id(id)) return { success: false, error: 'Invalid ID' };

      db.prepare('UPDATE categories SET name = ?, sort_order = ? WHERE id = ?').run(
        data.name?.trim() || '', data.sort_order || 0, id
      );
      return { success: true };
    } catch (err) {
      log.error('categories:update failed', err);
      return { success: false, error: 'Failed to update category' };
    }
  });

  ipcMain.handle('categories:delete', (_event, id) => {
    try {
      const { authorized, error } = requireRole('admin');
      if (!authorized) return { success: false, error };
      if (!validate.id(id)) return { success: false, error: 'Invalid ID' };

      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      return { success: true };
    } catch (err) {
      log.error('categories:delete failed', err);
      return { success: false, error: 'Failed to delete category' };
    }
  });
};
