# AI Rules
## FlexPOS — Coding Assistant Guidelines

These rules are for any AI coding assistant (Cursor, Copilot, Claude, etc.) working on this project.
Read this before writing or suggesting any code.

---

## 1. Project Identity

- **App Name:** FlexPOS
- **Type:** Electron desktop POS application
- **Stack:** Electron + React + TailwindCSS + SQLite (better-sqlite3)
- **Stage:** V1 — single store, single device
- **Target Users:** Store cashiers and owners — non-technical users

---

## 2. Core Principles

1. **Offline First** — Every feature must work without internet. Never assume network availability.
2. **Simple Over Clever** — Write readable code. This is a freelancer project, not a startup.
3. **Fast UI** — Checkout screen must feel instant. No unnecessary loading states.
4. **Role Aware** — Always check the user's role before allowing sensitive operations.
5. **Data Safety** — Never mutate order data after it's been completed. Refunds create new records.

---

## 3. Electron Rules

### DO
- Use `contextBridge` + `ipcRenderer.invoke` for all Renderer → Main communication
- Define all IPC channel names as constants in a shared `ipc-channels.js` file
- Handle all database operations exclusively in the Main process
- Use `better-sqlite3` (synchronous) — not `sqlite3` (async)

### DON'T
- Never use `nodeIntegration: true` in the renderer
- Never use `remote` module (deprecated)
- Never access the file system or database directly from a React component
- Never use `shell.openExternal` without sanitizing the URL first

### IPC Channel Naming Convention
```
[resource]:[action]

Examples:
  products:getAll
  products:create
  orders:complete
  cashiers:authenticate
  reports:dailySales
```

---

## 4. React Rules

### Component Rules
- Use **functional components only** — no class components
- Use `const` arrow functions for components: `const MyComponent = () => {}`
- One component per file
- File names use **PascalCase**: `CheckoutPage.jsx`, `ProductCard.jsx`

### Hooks Rules
- Custom hooks go in `src/hooks/` and are prefixed with `use`: `useCart.js`
- Keep `useEffect` dependencies accurate — no empty arrays unless truly mount-only
- Never call hooks conditionally

### State Rules
- **Cart state** → Zustand `cartStore`
- **Active cashier session** → Zustand `sessionStore`
- **Server/DB data** → local component state via IPC calls
- **UI state** (modals open/close, input values) → `useState` in component

### Styling Rules
- Use **TailwindCSS utility classes only** — no custom CSS files unless absolutely necessary
- Use `cn()` helper (clsx + twMerge) for conditional class names
- Touch targets must be minimum **44x44px** for tablet compatibility
- Never use inline `style={{}}` except for dynamic values that Tailwind cannot handle

---

## 5. Database Rules

### Query Rules
- Always use **parameterized queries** — never string-concatenate user input into SQL
- Always wrap multi-step operations in a **transaction**
- Always **snapshot** product name and price into `order_items` at time of sale — never reference live product price from a historical order

### Data Mutation Rules
- Completed orders are **immutable** — never UPDATE an order after status = 'completed'
- Refunds create a **new order** with negative amounts
- Stock deductions happen **inside the same transaction** as order creation

### Naming Conventions
- Table names: **snake_case plural** → `order_items`, `product_variants`
- Column names: **snake_case** → `created_at`, `cashier_id`
- Boolean columns: stored as INTEGER (0/1) in SQLite

### Example Pattern
```js
// CORRECT — parameterized, transactional
const createOrder = db.transaction((order, items) => {
  const orderResult = db.prepare(`
    INSERT INTO orders (order_number, cashier_id, subtotal, total)
    VALUES (?, ?, ?, ?)
  `).run(order.number, order.cashierId, order.subtotal, order.total);

  for (const item of items) {
    db.prepare(`
      INSERT INTO order_items (order_id, product_id, name, price, quantity, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderResult.lastInsertRowid, item.productId, item.name, item.price, item.qty, item.total);

    db.prepare(`UPDATE products SET stock = stock - ? WHERE id = ?`)
      .run(item.qty, item.productId);
  }
});

// WRONG — never do this
db.exec(`INSERT INTO orders VALUES ('${userInput}')`);
```

---

## 6. UI / UX Rules

### Checkout Screen
- Product grid is the **primary focus** — large tap targets, clear images/names
- Cart is always visible on the right side (desktop) or bottom sheet (tablet)
- Payment modal opens full-screen — no distractions
- Always show change amount in large font after cash payment

### PIN Login
- PIN pad uses large buttons — minimum 64x64px
- Mask input with dots immediately on key press
- Auto-submit after 4 or 6 digits (configurable in settings)
- On wrong PIN: shake animation + clear input — no error text that reveals PIN length

### Feedback Rules
- Every action that modifies data must show a **success or error toast**
- Destructive actions (delete product, void order) require a **confirmation modal**
- Loading states only for operations that genuinely take > 300ms

### Receipt
- Always preview receipt before printing
- Include: store name, date/time, cashier name, itemized list, subtotal, discount, total, payment method, change
- Optional footer: store message, social media, promo

---

## 7. Security Rules

- Store PINs as **bcrypt hashes** — never plain text
- Session data (active cashier, role) lives in **memory only** — never in SQLite or localStorage
- Role must be validated in the **Main process IPC handler** — not just in the UI
- Admin-only routes must check role server-side (Main process), not just hide UI elements

```js
// CORRECT — role check in Main process
ipcMain.handle('products:delete', (event, id) => {
  const session = getActiveSession(); // memory-based session
  if (session.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  // proceed with delete
});
```

---

## 8. File & Folder Rules

- Pages go in `src/pages/` — one file per page
- Reusable components go in `src/components/`
- IPC handlers go in `electron/ipc/` — one file per resource
- Database queries stay in `electron/ipc/` or a `database/queries/` folder — never in React components
- Constants (IPC channels, roles, order status) go in `src/constants/`

---

## 9. Error Handling

- All IPC handlers must be wrapped in try/catch
- Return structured responses: `{ success: true, data: {} }` or `{ success: false, error: 'message' }`
- Log errors to a local log file using `electron-log`
- Never show raw error stack traces to the cashier — show friendly messages

```js
// Standard IPC response pattern
ipcMain.handle('products:getAll', async () => {
  try {
    const products = db.prepare('SELECT * FROM products WHERE is_available = 1').all();
    return { success: true, data: products };
  } catch (err) {
    log.error('products:getAll failed', err);
    return { success: false, error: 'Failed to load products.' };
  }
});
```

---

## 10. What NOT to Build in V1

Do not add, suggest, or scaffold any of the following unless explicitly asked:

- ❌ Multi-branch / franchise support
- ❌ Hardware SDK (barcode scanner, payment terminal, cash drawer)
- ❌ Accounting module
- ❌ VAT / tax computation
- ❌ Kitchen Display System (KDS)
- ❌ Self-service kiosk mode
- ❌ Weight-based pricing
- ❌ Dynamic barcodes
- ❌ Online payment gateway (GCash, PayMongo, Stripe)
- ❌ User-facing customer login portal
- ❌ Multi-device sync / real-time collaboration
