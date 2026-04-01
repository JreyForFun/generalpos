/**
 * Input validation utilities for IPC handlers.
 * All IPC inputs must pass validation before processing.
 * Returns { valid: boolean, error: string|null }
 */

const validate = {
  /** Positive integer, max 9999 */
  id: (v) => Number.isInteger(v) && v > 0,

  /** Positive integer between 1-9999 */
  quantity: (v) => Number.isInteger(v) && v > 0 && v <= 9999,

  /** Non-negative number, max 999999.99 */
  amount: (v) => typeof v === 'number' && v >= 0 && v <= 999999.99 && isFinite(v),

  /** Non-empty string, trimmed, max 255 characters */
  text: (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 255,

  /** Optional text — empty string or null allowed */
  optionalText: (v) => v === null || v === undefined || v === '' || (typeof v === 'string' && v.length <= 255),

  /** PIN — string, digits only, length 4-6 */
  pin: (v) => typeof v === 'string' && /^\d{4,6}$/.test(v),

  /** Email — basic format check or empty */
  email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),

  /** Phone — optional, allow digits, spaces, dashes, parens, plus */
  phone: (v) => !v || /^[0-9\s\-\(\)\+]+$/.test(v),

  /** Discount type */
  discountType: (v) => v === null || v === 'percent' || v === 'fixed',

  /** Order status */
  orderStatus: (v) => ['completed', 'held', 'refunded'].includes(v),

  /** Role */
  role: (v) => ['admin', 'manager', 'cashier'].includes(v),

  /** Payment method */
  paymentMethod: (v) => ['cash', 'ewallet', 'split', 'giftcard', 'points'].includes(v),

  /** Cash flow type */
  cashFlowType: (v) => ['open', 'in', 'out', 'close'].includes(v),
};

/**
 * Validate an object of fields against rules.
 * @param {object} data - Object with field values
 * @param {object} rules - Object mapping field names to validator names
 * @returns {{ valid: boolean, errors: string[] }}
 *
 * Example:
 *   validateFields(
 *     { name: 'Coffee', price: 120 },
 *     { name: 'text', price: 'amount' }
 *   )
 */
function validateFields(data, rules) {
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const validator = validate[rule];
    if (!validator) {
      errors.push(`Unknown validation rule: ${rule}`);
      continue;
    }
    if (!validator(data[field])) {
      errors.push(`Invalid ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = { validate, validateFields };
