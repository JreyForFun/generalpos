/**
 * Centralized currency formatting utility.
 * Replaces all instances of `₱${Number(x).toFixed(2)}` throughout the app.
 *
 * @module formatCurrency
 */

/**
 * Format a number as Philippine Peso currency.
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted currency string, e.g. "₱1,234.56"
 */
export function formatCurrency(amount) {
  const num = Number(amount || 0);
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a number as compact currency (no decimals) for charts/badges.
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted string, e.g. "₱1,235"
 */
export function formatCurrencyShort(amount) {
  const num = Number(amount || 0);
  return `₱${Math.round(num).toLocaleString('en-PH')}`;
}

/**
 * Format a number as raw decimal currency WITHOUT locale commas.
 * Use for inputs, tabular data, and computation displays.
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted string, e.g. "₱1234.56"
 */
export function formatCurrencyRaw(amount) {
  const num = Number(amount || 0);
  return `₱${num.toFixed(2)}`;
}
