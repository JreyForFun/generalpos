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

  // Create product with variants and barcodes (admin/manager only)
  ipcMain.handle('products:create', (_event, data) => {
    try {
      const { authorized, session, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      const { valid, errors } = validateFields(data, { name: 'text', price: 'amount' });
      if (!valid) return { success: false, error: errors.join(', ') };

      const createTx = db.transaction(() => {
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

        const productId = result.lastInsertRowid;

        // Insert variants
        if (Array.isArray(data.variants) && data.variants.length > 0) {
          const insertVariant = db.prepare(
            'INSERT INTO product_variants (product_id, name, sku, price, stock, is_available) VALUES (?, ?, ?, ?, ?, ?)'
          );
          for (const v of data.variants) {
            if (v.name?.trim()) {
              insertVariant.run(productId, v.name.trim(), v.sku || null, v.price || 0, v.stock || 0, v.is_available ? 1 : 0);
            }
          }
        }

        // Insert barcodes
        if (Array.isArray(data.barcodes) && data.barcodes.length > 0) {
          const insertBarcode = db.prepare(
            'INSERT OR IGNORE INTO product_barcodes (product_id, barcode) VALUES (?, ?)'
          );
          for (const code of data.barcodes) {
            if (typeof code === 'string' && code.trim()) {
              insertBarcode.run(productId, code.trim());
            }
          }
        }

        return productId;
      });

      const productId = createTx();

      writeAudit({
        cashierId: session.cashierId,
        action: 'product:create',
        targetType: 'product',
        targetId: productId,
        details: { name: data.name, price: data.price, variantCount: data.variants?.length || 0, barcodeCount: data.barcodes?.length || 0 },
      });

      return { success: true, data: { id: productId } };
    } catch (err) {
      log.error('products:create failed', err);
      return { success: false, error: 'Failed to create product' };
    }
  });

  // Update product with variants and barcodes (admin/manager only)
  ipcMain.handle('products:update', (_event, id, data) => {
    try {
      const { authorized, session, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };
      if (!validate.id(id)) return { success: false, error: 'Invalid ID' };

      const updateTx = db.transaction(() => {
        // Update product fields
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

        if (updates.length > 0) {
          updates.push('updated_at = CURRENT_TIMESTAMP');
          params.push(id);
          db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        }

        // Sync variants (delete-and-reinsert strategy)
        if (Array.isArray(data.variants)) {
          db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(id);
          const insertVariant = db.prepare(
            'INSERT INTO product_variants (product_id, name, sku, price, stock, is_available) VALUES (?, ?, ?, ?, ?, ?)'
          );
          for (const v of data.variants) {
            if (v.name?.trim()) {
              insertVariant.run(id, v.name.trim(), v.sku || null, v.price || 0, v.stock || 0, v.is_available ? 1 : 0);
            }
          }
        }

        // Sync barcodes (delete-and-reinsert strategy)
        if (Array.isArray(data.barcodes)) {
          db.prepare('DELETE FROM product_barcodes WHERE product_id = ?').run(id);
          const insertBarcode = db.prepare(
            'INSERT OR IGNORE INTO product_barcodes (product_id, barcode) VALUES (?, ?)'
          );
          for (const code of data.barcodes) {
            if (typeof code === 'string' && code.trim()) {
              insertBarcode.run(id, code.trim());
            }
          }
        }
      });

      updateTx();

      writeAudit({
        cashierId: session.cashierId,
        action: 'product:update',
        targetType: 'product',
        targetId: id,
        details: { ...data, variantCount: data.variants?.length, barcodeCount: data.barcodes?.length },
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

  // ─── Barcode Lookup ───
  ipcMain.handle('products:findByBarcode', (_event, barcode) => {
    try {
      if (!barcode || typeof barcode !== 'string') return { success: false, error: 'Invalid barcode' };

      const barcodeEntry = db.prepare(
        'SELECT pb.product_id, p.name, p.price, p.stock, p.is_available FROM product_barcodes pb JOIN products p ON pb.product_id = p.id WHERE pb.barcode = ?'
      ).get(barcode.trim());

      if (!barcodeEntry) return { success: false, error: 'No product found for this barcode' };

      return { success: true, data: barcodeEntry };
    } catch (err) {
      log.error('products:findByBarcode failed', err);
      return { success: false, error: 'Failed to look up barcode' };
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
