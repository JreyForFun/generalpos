/**
 * IPC Handler Registry
 * Registers all IPC handlers from individual resource files.
 */

const { initAudit } = require('../utils/audit');
const log = require('electron-log');

function registerAllIpcHandlers(db) {
  // Initialize audit logger with DB reference
  initAudit(db);

  // Register handlers by resource
  require('./cashiers.ipc')(db);
  require('./products.ipc')(db);
  require('./orders.ipc')(db);
  require('./customers.ipc')(db);
  require('./inventory.ipc')(db);
  require('./ingredients.ipc')(db);
  require('./reports.ipc')(db);
  require('./settings.ipc')(db);
  require('./audit.ipc')(db);

  log.info('All IPC handlers registered');
}

module.exports = { registerAllIpcHandlers };
