const { contextBridge, ipcRenderer } = require('electron');

/**
 * contextBridge exposes specific IPC functions to the Renderer process.
 * The Renderer (React) can ONLY call these functions — no direct DB or FS access.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ─── Window Controls ───
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow:    () => ipcRenderer.send('window:close'),
  isMaximized:    () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizedChange: (callback) => {
    ipcRenderer.on('window:maximized-change', (_event, isMaximized) => callback(isMaximized));
  },

  // ─── Session ───
  authenticate:   (pin) => ipcRenderer.invoke('cashiers:authenticate', pin),
  logout:         ()    => ipcRenderer.invoke('session:logout'),

  // ─── Products ───
  getProducts:    (filters) => ipcRenderer.invoke('products:getAll', filters),
  getProduct:     (id)      => ipcRenderer.invoke('products:getById', id),
  createProduct:  (data)    => ipcRenderer.invoke('products:create', data),
  updateProduct:  (id, data) => ipcRenderer.invoke('products:update', id, data),
  deleteProduct:  (id)      => ipcRenderer.invoke('products:delete', id),
  findByBarcode:  (barcode) => ipcRenderer.invoke('products:findByBarcode', barcode),

  // ─── Categories ───
  getCategories:  () => ipcRenderer.invoke('categories:getAll'),
  createCategory: (data) => ipcRenderer.invoke('categories:create', data),
  updateCategory: (id, data) => ipcRenderer.invoke('categories:update', id, data),
  deleteCategory: (id)   => ipcRenderer.invoke('categories:delete', id),

  // ─── Orders ───
  createOrder:    (orderData) => ipcRenderer.invoke('orders:create', orderData),
  getOrders:      (filters)   => ipcRenderer.invoke('orders:getAll', filters),
  getOrder:       (id)        => ipcRenderer.invoke('orders:getById', id),
  refundOrder:    (id)        => ipcRenderer.invoke('orders:refund', id),

  // ─── Customers ───
  getCustomers:   (filters) => ipcRenderer.invoke('customers:getAll', filters),
  getCustomer:    (id)      => ipcRenderer.invoke('customers:getById', id),
  createCustomer: (data)    => ipcRenderer.invoke('customers:create', data),
  updateCustomer: (id, data) => ipcRenderer.invoke('customers:update', id, data),
  deleteCustomer: (id)      => ipcRenderer.invoke('customers:delete', id),
  ewalletDeduct:  (id, amount) => ipcRenderer.invoke('customers:ewalletDeduct', id, amount),
  ewalletTopup:   (id, amount) => ipcRenderer.invoke('customers:ewalletTopup', id, amount),
  redeemPoints:   (id, points) => ipcRenderer.invoke('customers:redeemPoints', id, points),

  // ─── Cashiers ───
  getCashiers:    ()         => ipcRenderer.invoke('cashiers:getAll'),
  createCashier:  (data)     => ipcRenderer.invoke('cashiers:create', data),
  updateCashier:  (id, data) => ipcRenderer.invoke('cashiers:update', id, data),
  changePIN:      (id, pin)  => ipcRenderer.invoke('cashiers:changePin', id, pin),

  // ─── Inventory ───
  adjustStock:    (productId, adjustment) => ipcRenderer.invoke('inventory:adjust', productId, adjustment),
  getLowStock:    () => ipcRenderer.invoke('inventory:getLowStock'),

  // ─── Cash Flows ───
  openDrawer:     (amount) => ipcRenderer.invoke('cashflows:open', amount),
  addCashFlow:    (data)   => ipcRenderer.invoke('cashflows:add', data),
  closeDrawer:    (data)   => ipcRenderer.invoke('cashflows:close', data),
  getCashFlows:   (filters) => ipcRenderer.invoke('cashflows:getAll', filters),

  // ─── Reports ───
  getDailySales:    (date)   => ipcRenderer.invoke('reports:dailySales', date),
  getSalesByMethod: (date)   => ipcRenderer.invoke('reports:salesByMethod', date),
  getBestSellers:   (date)   => ipcRenderer.invoke('reports:bestSellers', date),
  getWeeklySales:   (date)   => ipcRenderer.invoke('reports:weeklySales', date),
  getCashierPerformance: (date) => ipcRenderer.invoke('reports:cashierPerformance', date),
  exportReportPDF:  (data)   => ipcRenderer.invoke('reports:exportPDF', data),

  // ─── Backup ───
  exportBackup:     ()       => ipcRenderer.invoke('backup:export'),

  // ─── Settings ───
  getSettings:    ()          => ipcRenderer.invoke('settings:getAll'),
  getSetting:     (key)       => ipcRenderer.invoke('settings:get', key),
  updateSetting:  (key, value) => ipcRenderer.invoke('settings:update', key, value),
  getStoreInfo:   ()          => ipcRenderer.invoke('settings:getStore'),
  updateStoreInfo: (data)     => ipcRenderer.invoke('settings:updateStore', data),

  // ─── Gift Cards ───
  getGiftCards:   ()     => ipcRenderer.invoke('giftcards:getAll'),
  createGiftCard: (data) => ipcRenderer.invoke('giftcards:create', data),
  redeemGiftCard: (code, amount) => ipcRenderer.invoke('giftcards:redeem', code, amount),

  // ─── Image Upload ───
  uploadImage: () => ipcRenderer.invoke('dialog:uploadImage'),
});
