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
- Use **TailwindCSS utility classes only** — reference DESIGN_SYSTEM.md for color tokens, spacing, and component patterns
- Use CSS variables defined in `index.css` for theme tokens — all components consume variables, not hard-coded colors
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
- Refunds create a **new order** with `refund_for` referencing the original order ID, and negative amounts
- Stock deductions happen **inside the same transaction** as order creation
- Stock is **restored** in the same transaction when a refund is processed

### Currency Precision Rules
- All monetary calculations use **integer centavos internally** (multiply by 100, divide on display)
- OR use `toFixed(2)` on every arithmetic result — never trust raw float math
- Currency rounding mode is stored in `app_settings` key `currency_rounding`: `'none'` | `'centavo_5'` | `'peso'`
- Always round **after** all discounts and subtotals are computed — never round intermediates

### Audit Logging Rules
- Every destructive or sensitive action must write to `audit_log` via `electron/utils/audit.js`
- Actions that require logging:
  - Product create / update / delete
  - Order refund
  - Cashier create / deactivate / PIN change
  - Customer delete
  - Cash flow entries (open, in, out, close)
  - Settings changes
- Audit log is **append-only** — never UPDATE or DELETE from `audit_log`
- Log entry format: `{ cashier_id, action, target_type, target_id, details (JSON) }`

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
- Destructive actions (delete product, void order) require a **confirmation modal** (`ConfirmModal.jsx`)
- Loading states only for operations that genuinely take > 300ms

### Auto-Lock
- App auto-locks after configurable idle timeout (default: 5 minutes, stored in `app_settings`)
- Lock screen shows PIN pad — same `PinPad.jsx` component as login
- Idle detection based on mouse movement, keyboard, and touch events (via `useIdleLock` hook)
- Timer resets on any user interaction
- Cashier session is **preserved** — no logout, just lock overlay
- Implemented as `<IdleLock>` wrapper component around the main layout

### Keyboard Shortcuts
- `F2` — Focus search bar
- `F9` — Open payment modal (when cart has items)
- `F4` — Hold current order
- `Escape` — Close active modal / clear search
- Managed via `useKeyboardShortcuts` hook — never attach raw `keydown` listeners in components

### Receipt
- Always preview receipt before printing
- Include: store name, date/time, cashier name, itemized list, subtotal, discount, total, payment method, change
- Optional footer: store message, social media, promo
- Receipt template customization is field-based (Settings page) — not a WYSIWYG editor

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

### Input Validation (Main Process)
- All IPC handlers must validate input types via `electron/utils/validate.js` before processing
- Validation rules:
  - `quantity` → positive integer, max 9,999
  - `price` / `amount` → non-negative number, ≤ 2 decimal places, max 999,999.99
  - `name` / `text` → string, trimmed, max 255 characters
  - `id` → positive integer
  - `pin` → string, digits only, length 4-6
- Reject invalid input immediately: `{ success: false, error: 'Invalid input' }`
- Never trust renderer-side validation alone — always validate in Main process

```js
// electron/utils/validate.js pattern
const validate = {
  id: (v) => Number.isInteger(v) && v > 0,
  quantity: (v) => Number.isInteger(v) && v > 0 && v <= 9999,
  amount: (v) => typeof v === 'number' && v >= 0 && v <= 999999.99,
  text: (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 255,
  pin: (v) => typeof v === 'string' && /^\d{4,6}$/.test(v),
};
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
- ❌ SQLite encryption (accepted risk for V1 — see ARCHITECTURE.md §6.5)
- ❌ WYSIWYG receipt template editor (field-based only)

---

## 11. Testing Conventions

### Framework
- **Unit tests:** Vitest — for business logic, utilities, store logic
- **E2E tests:** Playwright — for Electron app critical flows only
- Test files live in `tests/unit/` and `tests/e2e/`

### What Must Be Unit Tested
- All currency/rounding calculations
- Cart total computation (subtotal, discounts, tips, final total)
- Bill split validation (split amounts must equal order total)
- Stock deduction logic
- Loyalty points calculation (earn and redeem)
- Input validation functions (`validate.js`)
- Order number generation

### Unit Test Style
```js
// Use describe + it blocks, no test IDs or database needed
import { describe, it, expect } from 'vitest';

describe('cart totals', () => {
  it('applies percentage discount correctly', () => {
    const subtotal = 100;
    const discount = applyDiscount(subtotal, { type: 'percent', value: 10 });
    expect(discount).toBe(10);
  });

  it('handles floating point edge case', () => {
    expect(addMoney(0.1, 0.2)).toBe(0.3); // not 0.30000000000000004
  });
});
```

### E2E Test Scope
- **One critical path only:** Login → Browse → Add to cart → Pay → Receipt → Order history
- Run after each phase completion
- Do not E2E test admin/settings flows — manual QA for those

### Running Tests
```bash
npm test          # Runs Vitest unit tests
npm run test:e2e  # Runs Playwright E2E tests
```
