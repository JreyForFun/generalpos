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

  // Weekly sales — last 7 days of daily totals for chart
  ipcMain.handle('reports:weeklySales', (_event, endDate) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      const target = endDate || new Date().toISOString().slice(0, 10);
      const days = db.prepare(`
        WITH RECURSIVE dates(d) AS (
          SELECT DATE(?, '-6 days')
          UNION ALL
          SELECT DATE(d, '+1 day') FROM dates WHERE d < ?
        )
        SELECT dates.d as date,
          COALESCE(SUM(o.total), 0) as total_sales,
          COUNT(o.id) as total_orders
        FROM dates
        LEFT JOIN orders o ON DATE(o.created_at) = dates.d AND o.status = 'completed'
        GROUP BY dates.d
        ORDER BY dates.d
      `).all(target, target);

      return { success: true, data: days };
    } catch (err) {
      log.error('reports:weeklySales failed', err);
      return { success: false, error: 'Failed to load weekly sales' };
    }
  });

  // Cashier performance — orders and revenue per cashier for a given date
  ipcMain.handle('reports:cashierPerformance', (_event, date) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      const targetDate = date || new Date().toISOString().slice(0, 10);
      const performance = db.prepare(`
        SELECT c.id, c.name,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(o.total), 0) as total_sales,
          COALESCE(AVG(o.total), 0) as avg_order
        FROM cashiers c
        LEFT JOIN orders o ON o.cashier_id = c.id AND DATE(o.created_at) = ? AND o.status = 'completed'
        WHERE c.is_active = 1
        GROUP BY c.id
        ORDER BY total_sales DESC
      `).all(targetDate);

      return { success: true, data: performance };
    } catch (err) {
      log.error('reports:cashierPerformance failed', err);
      return { success: false, error: 'Failed to load cashier performance' };
    }
  });

  // PDF export using Electron's printToPDF
  ipcMain.handle('reports:exportPDF', async (_event, data) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      const { BrowserWindow, dialog } = require('electron');
      const fs = require('fs');
      const path = require('path');

      // Build HTML report
      const html = buildReportHTML(data);

      // Create hidden window for PDF generation
      const pdfWin = new BrowserWindow({ show: false, width: 800, height: 1100 });
      await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      // Wait for content to render
      await new Promise((r) => setTimeout(r, 500));

      const pdfBuffer = await pdfWin.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
      });

      pdfWin.close();

      // Save dialog
      const { filePath } = await dialog.showSaveDialog({
        title: 'Export Report as PDF',
        defaultPath: path.join(require('os').homedir(), `FlexPOS-Report-${data.date || 'today'}.pdf`),
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });

      if (!filePath) return { success: false, error: 'Export cancelled' };

      fs.writeFileSync(filePath, pdfBuffer);
      return { success: true, data: { path: filePath } };
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

  // ─── Database Backup ───
  ipcMain.handle('backup:export', async () => {
    try {
      const { authorized, error } = requireRole(['admin']);
      if (!authorized) return { success: false, error };

      const { dialog } = require('electron');
      const fs = require('fs');
      const path = require('path');

      const dbPath = db.name; // better-sqlite3 exposes the DB file path

      const { filePath } = await dialog.showSaveDialog({
        title: 'Export Database Backup',
        defaultPath: path.join(require('os').homedir(), `FlexPOS-Backup-${new Date().toISOString().slice(0, 10)}.db`),
        filters: [{ name: 'SQLite Database', extensions: ['db'] }],
      });

      if (!filePath) return { success: false, error: 'Export cancelled' };

      // Use better-sqlite3's backup API for safe copy
      await db.backup(filePath);

      return { success: true, data: { path: filePath } };
    } catch (err) {
      log.error('backup:export failed', err);
      return { success: false, error: 'Failed to export backup' };
    }
  });
};

// ─── PDF HTML Template ───
function buildReportHTML(data) {
  const { date, dailySales, salesByMethod, bestSellers, cashFlows, cashierPerformance } = data || {};

  const methodRows = (salesByMethod || []).map((m) =>
    `<tr><td style="text-transform:capitalize">${m.method}</td><td>${m.count}</td><td>₱${Number(m.total).toFixed(2)}</td></tr>`
  ).join('');

  const sellerRows = (bestSellers || []).map((s, i) =>
    `<tr><td>${i + 1}</td><td>${s.name}</td><td>${s.total_qty}</td><td>₱${Number(s.total_revenue).toFixed(2)}</td></tr>`
  ).join('');

  const perfRows = (cashierPerformance || []).map((c) =>
    `<tr><td>${c.name}</td><td>${c.total_orders}</td><td>₱${Number(c.total_sales).toFixed(2)}</td><td>₱${Number(c.avg_order).toFixed(2)}</td></tr>`
  ).join('');

  const cfOpen = (cashFlows || []).find((f) => f.type === 'open')?.amount || 0;
  const cfIn = (cashFlows || []).filter((f) => f.type === 'cash_in').reduce((s, f) => s + f.amount, 0);
  const cfOut = (cashFlows || []).filter((f) => f.type === 'cash_out').reduce((s, f) => s + f.amount, 0);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  h2 { margin: 24px 0 8px; font-size: 16px; border-bottom: 2px solid #00d4aa; padding-bottom: 4px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
  .stats { display: flex; gap: 16px; margin-bottom: 24px; }
  .stat { flex: 1; background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: center; }
  .stat .value { font-size: 24px; font-weight: bold; color: #00d4aa; }
  .stat .label { font-size: 11px; text-transform: uppercase; color: #888; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px; background: #f0f0f0; border-bottom: 2px solid #ddd; }
  td { padding: 8px; border-bottom: 1px solid #eee; }
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; }
</style>
</head>
<body>
  <h1>FlexPOS Daily Report</h1>
  <p class="subtitle">${date || 'Today'} • Generated ${new Date().toLocaleString('en-PH')}</p>

  <div class="stats">
    <div class="stat"><div class="value">₱${Number(dailySales?.total_sales || 0).toFixed(2)}</div><div class="label">Total Sales</div></div>
    <div class="stat"><div class="value">${dailySales?.total_orders || 0}</div><div class="label">Orders</div></div>
    <div class="stat"><div class="value">₱${Number(dailySales?.total_discounts || 0).toFixed(2)}</div><div class="label">Discounts</div></div>
    <div class="stat"><div class="value">₱${Number(dailySales?.total_tips || 0).toFixed(2)}</div><div class="label">Tips</div></div>
  </div>

  <h2>Sales by Payment Method</h2>
  <table><thead><tr><th>Method</th><th>Count</th><th>Total</th></tr></thead><tbody>${methodRows || '<tr><td colspan="3">No data</td></tr>'}</tbody></table>

  <h2>Best Selling Products</h2>
  <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead><tbody>${sellerRows || '<tr><td colspan="4">No data</td></tr>'}</tbody></table>

  ${perfRows ? `<h2>Cashier Performance</h2><table><thead><tr><th>Cashier</th><th>Orders</th><th>Sales</th><th>Avg Order</th></tr></thead><tbody>${perfRows}</tbody></table>` : ''}

  <h2>Cash Flow Summary</h2>
  <div class="stats">
    <div class="stat"><div class="value">₱${Number(cfOpen).toFixed(2)}</div><div class="label">Opening</div></div>
    <div class="stat"><div class="value">₱${Number(cfIn).toFixed(2)}</div><div class="label">Cash In</div></div>
    <div class="stat"><div class="value">₱${Number(cfOut).toFixed(2)}</div><div class="label">Cash Out</div></div>
  </div>

  <p class="footer">Generated by FlexPOS • ${new Date().getFullYear()}</p>
</body>
</html>`;
}
