/**
 * Currency formatting utilities.
 * DRYs up the ₱ formatting pattern used across the app.
 */

/**
 * Format a number as Philippine Peso currency.
 * @param {number} amount - The amount to format
 * @param {boolean} [showSymbol=true] - Whether to include the ₱ symbol
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, showSymbol = true) {
  const num = Number(amount || 0);
  const formatted = Math.abs(num).toFixed(2);
  const prefix = num < 0 ? '-' : '';
  return showSymbol ? `${prefix}₱${formatted}` : `${prefix}${formatted}`;
}

/**
 * Format a number with comma separators (e.g. 1,234.56)
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrencyFull(amount) {
  const num = Number(amount || 0);
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Safely convert a value to a 2-decimal number to avoid float drift.
 * @param {number} value
 * @returns {number}
 */
export function toSafeAmount(value) {
  return Number(Number(value || 0).toFixed(2));
}
