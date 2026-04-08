const { ipcMain } = require('electron');
const log = require('electron-log');
const { getSession, requireRole } = require('../utils/session');
const { writeAudit } = require('../utils/audit');
const { validate } = require('../utils/validate');

module.exports = function registerOrderHandlers(db) {
  // Create order (any authenticated user)
  ipcMain.handle('orders:create', (_event, orderData) => {
    try {
      const session = getSession();
      if (!session) return { success: false, error: 'No active session' };

      const { items, payment, customerId, discount, tip, notes } = orderData;

      if (!items || items.length === 0) {
        return { success: false, error: 'Order must have at least one item' };
      }

      // Generate order number: ORD-YYYYMMDD-XXXX
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const countToday = db.prepare(
        "SELECT COUNT(*) as count FROM orders WHERE order_number LIKE ?"
      ).get(`ORD-${today}-%`);
      const seq = String((countToday?.count || 0) + 1).padStart(4, '0');
      const orderNumber = `ORD-${today}-${seq}`;

      // Calculate totals (toFixed(2) per AI_RULES §5 — no float drift)
      let subtotal = 0;
      for (const item of items) {
        const lineTotal = Number(((item.price * item.quantity) - (item.discount || 0)).toFixed(2));
        subtotal += lineTotal;
      }
      subtotal = Number(subtotal.toFixed(2));

      const discountAmount = Number(
        (discount?.type === 'percent'
          ? subtotal * (discount.value / 100)
          : (discount?.value || 0)
        ).toFixed(2)
      );

      const tipAmount = tip || 0;
      const total = Math.max(0, subtotal - discountAmount + tipAmount);

      // Round total based on settings
      const roundingSetting = db.prepare("SELECT value FROM app_settings WHERE key = 'currency_rounding'").get();
      const rounding = roundingSetting?.value || 'peso';
      const roundedTotal = applyRounding(total, rounding);

      // Transactional write: order + items + payment + stock deduction
      const createOrderTx = db.transaction(() => {
        const orderResult = db.prepare(`
          INSERT INTO orders (order_number, cashier_id, customer_id, status, subtotal, discount_amount, tip_amount, total, notes)
          VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?)
        `).run(orderNumber, session.cashierId, customerId || null, subtotal, discountAmount, tipAmount, roundedTotal, notes || null);

        const orderId = orderResult.lastInsertRowid;

        // Insert order items (snapshot name & price)
        const insertItem = db.prepare(`
          INSERT INTO order_items (order_id, product_id, variant_id, name, price, quantity, discount, total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
        const updateVariantStock = db.prepare('UPDATE product_variants SET stock = stock - ? WHERE id = ?');

        for (const item of items) {
          const lineTotal = (item.price * item.quantity) - (item.discount || 0);
          insertItem.run(orderId, item.productId, item.variantId || null, item.name, item.price, item.quantity, item.discount || 0, lineTotal);

          // Deduct stock
          if (item.variantId) {
            updateVariantStock.run(item.quantity, item.variantId);
          } else {
            updateStock.run(item.quantity, item.productId);
          }
        }

        // Insert payment record(s)
        if (payment) {
          const insertPayment = db.prepare(`
            INSERT INTO payments (order_id, method, amount, payer_name)
            VALUES (?, ?, ?, ?)
          `);

          // Split payments: insert one row per payer
          if (Array.isArray(orderData.splitPayments) && orderData.splitPayments.length > 0) {
            for (const sp of orderData.splitPayments) {
              insertPayment.run(orderId, sp.method, sp.amount, sp.name || null);
            }
          } else {
            insertPayment.run(orderId, payment.method, payment.amount, payment.payerName || null);
          }
        }

        // Award loyalty points if customer is set
        if (customerId) {
          const pointsRate = db.prepare("SELECT value FROM app_settings WHERE key = 'loyalty_points_per_peso'").get();
          const rate = parseFloat(pointsRate?.value || '1');
          const pointsEarned = roundedTotal * rate;

          db.prepare('UPDATE customers SET points = points + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(pointsEarned, customerId);
        }

        return { orderId, orderNumber, total: roundedTotal };
      });

      const result = createOrderTx();

      return { success: true, data: result };
    } catch (err) {
      log.error('orders:create failed', err);
      return { success: false, error: 'Failed to create order' };
    }
  });

  // Get all orders with filters
  ipcMain.handle('orders:getAll', (_event, filters = {}) => {
    try {
      const session = getSession();
      if (!session) return { success: false, error: 'No active session' };

      let sql = 'SELECT o.*, c.name as cashier_name, cu.name as customer_name FROM orders o LEFT JOIN cashiers c ON o.cashier_id = c.id LEFT JOIN customers cu ON o.customer_id = cu.id WHERE 1=1';
      const params = [];

      if (filters.date) {
        sql += " AND DATE(o.created_at) = ?";
        params.push(filters.date);
      }
      if (filters.cashierId) {
        sql += ' AND o.cashier_id = ?';
        params.push(filters.cashierId);
      }
      if (filters.customerId) {
        sql += ' AND o.customer_id = ?';
        params.push(filters.customerId);
      }
      if (filters.status) {
        sql += ' AND o.status = ?';
        params.push(filters.status);
      }

      sql += ' ORDER BY o.created_at DESC LIMIT 100';

      const orders = db.prepare(sql).all(...params);
      return { success: true, data: orders };
    } catch (err) {
      log.error('orders:getAll failed', err);
      return { success: false, error: 'Failed to load orders' };
    }
  });

  // Get single order with items and payments
  ipcMain.handle('orders:getById', (_event, id) => {
    try {
      if (!validate.id(id)) return { success: false, error: 'Invalid ID' };

      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      if (!order) return { success: false, error: 'Order not found' };

      order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
      order.payments = db.prepare('SELECT * FROM payments WHERE order_id = ?').all(id);

      return { success: true, data: order };
    } catch (err) {
      log.error('orders:getById failed', err);
      return { success: false, error: 'Failed to load order' };
    }
  });

  // Refund order (admin/manager only)
  ipcMain.handle('orders:refund', (_event, originalOrderId) => {
    try {
      const { authorized, session, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };
      if (!validate.id(originalOrderId)) return { success: false, error: 'Invalid ID' };

      const originalOrder = db.prepare('SELECT * FROM orders WHERE id = ? AND status = ?').get(originalOrderId, 'completed');
      if (!originalOrder) return { success: false, error: 'Order not found or already refunded' };

      const refundTx = db.transaction(() => {
        // Generate refund order number
        const refundNumber = `REF-${originalOrder.order_number}`;

        // Create refund order with negative amounts
        const refundResult = db.prepare(`
          INSERT INTO orders (order_number, cashier_id, customer_id, status, refund_for, subtotal, discount_amount, tip_amount, total, notes)
          VALUES (?, ?, ?, 'refunded', ?, ?, ?, ?, ?, ?)
        `).run(refundNumber, session.cashierId, originalOrder.customer_id, originalOrderId,
          -originalOrder.subtotal, -originalOrder.discount_amount, 0, -originalOrder.total, `Refund for ${originalOrder.order_number}`);

        // Mark original order as refunded
        db.prepare("UPDATE orders SET status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(originalOrderId);

        // Restore stock for all items
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(originalOrderId);
        for (const item of items) {
          if (item.variant_id) {
            db.prepare('UPDATE product_variants SET stock = stock + ? WHERE id = ?').run(item.quantity, item.variant_id);
          } else {
            db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
          }
        }

        writeAudit({
          cashierId: session.cashierId,
          action: 'order:refund',
          targetType: 'order',
          targetId: originalOrderId,
          details: { originalTotal: originalOrder.total, refundOrderId: refundResult.lastInsertRowid },
        });

        return { refundOrderId: refundResult.lastInsertRowid };
      });

      const result = refundTx();
      return { success: true, data: result };
    } catch (err) {
      log.error('orders:refund failed', err);
      return { success: false, error: 'Failed to refund order' };
    }
  });
};

// Currency rounding helper
function applyRounding(amount, mode) {
  switch (mode) {
    case 'peso':
      return Math.round(amount);
    case 'centavo_5':
      return Math.round(amount * 20) / 20;
    case 'none':
    default:
      return Math.round(amount * 100) / 100;
  }
}
