const { ipcMain } = require('electron');
const log = require('electron-log');
const { requireRole } = require('../utils/session');
const { writeAudit } = require('../utils/audit');

module.exports = function registerSettingsHandlers(db) {
  ipcMain.handle('settings:getAll', () => {
    try {
      const settings = db.prepare('SELECT * FROM app_settings').all();
      const map = {};
      for (const s of settings) map[s.key] = s.value;
      return { success: true, data: map };
    } catch (err) {
      log.error('settings:getAll failed', err);
      return { success: false, error: 'Failed to load settings' };
    }
  });

  ipcMain.handle('settings:get', (_event, key) => {
    try {
      const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
      return { success: true, data: row?.value || null };
    } catch (err) {
      log.error('settings:get failed', err);
      return { success: false, error: 'Failed to load setting' };
    }
  });

  ipcMain.handle('settings:update', (_event, key, value) => {
    try {
      const { authorized, session, error } = requireRole('admin');
      if (!authorized) return { success: false, error };

      db.prepare('INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(key, String(value));

      writeAudit({ cashierId: session.cashierId, action: 'settings:update', targetType: 'settings', targetId: null, details: { key, value } });
      return { success: true };
    } catch (err) {
      log.error('settings:update failed', err);
      return { success: false, error: 'Failed to update setting' };
    }
  });

  ipcMain.handle('settings:getStore', () => {
    try {
      const store = db.prepare('SELECT * FROM stores WHERE id = 1').get();
      return { success: true, data: store };
    } catch (err) {
      log.error('settings:getStore failed', err);
      return { success: false, error: 'Failed to load store info' };
    }
  });

  ipcMain.handle('settings:updateStore', (_event, data) => {
    try {
      const { authorized, session, error } = requireRole('admin');
      if (!authorized) return { success: false, error };

      db.prepare(`
        UPDATE stores SET name = ?, address = ?, phone = ?, email = ?, logo_path = ?, currency = ?, receipt_note = ? WHERE id = 1
      `).run(data.name, data.address || null, data.phone || null, data.email || null, data.logo_path || null, data.currency || 'PHP', data.receipt_note || null);

      writeAudit({ cashierId: session.cashierId, action: 'store:update', targetType: 'store', targetId: 1, details: data });
      return { success: true };
    } catch (err) {
      log.error('settings:updateStore failed', err);
      return { success: false, error: 'Failed to update store info' };
    }
  });

  // ─── Gift Cards ───
  ipcMain.handle('giftcards:getAll', () => {
    try {
      return { success: true, data: db.prepare('SELECT * FROM gift_cards ORDER BY created_at DESC').all() };
    } catch (err) {
      log.error('giftcards:getAll failed', err);
      return { success: false, error: 'Failed to load gift cards' };
    }
  });

  ipcMain.handle('giftcards:create', (_event, data) => {
    try {
      const { authorized, error } = requireRole(['admin', 'manager']);
      if (!authorized) return { success: false, error };

      const code = data.code || `GC-${Date.now().toString(36).toUpperCase()}`;
      const result = db.prepare('INSERT INTO gift_cards (code, balance, expiry_date) VALUES (?, ?, ?)').run(
        code, data.balance, data.expiry_date || null
      );
      return { success: true, data: { id: result.lastInsertRowid, code } };
    } catch (err) {
      log.error('giftcards:create failed', err);
      return { success: false, error: 'Failed to create gift card' };
    }
  });

  ipcMain.handle('giftcards:redeem', (_event, code, amount) => {
    try {
      const card = db.prepare('SELECT * FROM gift_cards WHERE code = ? AND is_active = 1').get(code);
      if (!card) return { success: false, error: 'Gift card not found or inactive' };
      if (card.expiry_date && new Date(card.expiry_date) < new Date()) return { success: false, error: 'Gift card expired' };
      if (card.balance < amount) return { success: false, error: 'Insufficient gift card balance' };

      db.prepare('UPDATE gift_cards SET balance = balance - ? WHERE id = ?').run(amount, card.id);
      if (card.balance - amount <= 0) db.prepare('UPDATE gift_cards SET is_active = 0 WHERE id = ?').run(card.id);

      return { success: true, data: { remainingBalance: card.balance - amount } };
    } catch (err) {
      log.error('giftcards:redeem failed', err);
      return { success: false, error: 'Failed to redeem gift card' };
    }
  });
};
