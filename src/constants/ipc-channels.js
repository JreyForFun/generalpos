/**
 * IPC Channel Constants
 * Single source of truth for all channel names.
 * Used in preload.js and IPC handlers.
 */
export const IPC = {
  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // Session
  AUTHENTICATE: 'cashiers:authenticate',
  LOGOUT: 'session:logout',

  // Products
  PRODUCTS_GET_ALL: 'products:getAll',
  PRODUCTS_GET_BY_ID: 'products:getById',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',

  // Categories
  CATEGORIES_GET_ALL: 'categories:getAll',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',

  // Orders
  ORDERS_CREATE: 'orders:create',
  ORDERS_GET_ALL: 'orders:getAll',
  ORDERS_GET_BY_ID: 'orders:getById',
  ORDERS_REFUND: 'orders:refund',

  // Customers
  CUSTOMERS_GET_ALL: 'customers:getAll',
  CUSTOMERS_GET_BY_ID: 'customers:getById',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',

  // Cashiers
  CASHIERS_GET_ALL: 'cashiers:getAll',
  CASHIERS_CREATE: 'cashiers:create',
  CASHIERS_UPDATE: 'cashiers:update',
  CASHIERS_CHANGE_PIN: 'cashiers:changePin',

  // Inventory
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_LOW_STOCK: 'inventory:getLowStock',

  // Reports
  REPORTS_DAILY_SALES: 'reports:dailySales',
  REPORTS_SALES_BY_METHOD: 'reports:salesByMethod',
  REPORTS_BEST_SELLERS: 'reports:bestSellers',
  REPORTS_EXPORT_PDF: 'reports:exportPDF',

  // Cash Flows
  CASHFLOWS_OPEN: 'cashflows:open',
  CASHFLOWS_ADD: 'cashflows:add',
  CASHFLOWS_CLOSE: 'cashflows:close',
  CASHFLOWS_GET_ALL: 'cashflows:getAll',

  // Settings
  SETTINGS_GET_ALL: 'settings:getAll',
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_GET_STORE: 'settings:getStore',
  SETTINGS_UPDATE_STORE: 'settings:updateStore',

  // Gift Cards
  GIFTCARDS_GET_ALL: 'giftcards:getAll',
  GIFTCARDS_CREATE: 'giftcards:create',
  GIFTCARDS_REDEEM: 'giftcards:redeem',
};
