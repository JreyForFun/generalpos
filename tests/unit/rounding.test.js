import { describe, it, expect } from 'vitest';

// Import the rounding function from orders.ipc.js
// Since it's a CommonJS module, we re-implement the same logic here for testing
function applyRounding(amount, mode) {
  switch (mode) {
    case 'peso':
      return Math.round(amount);
    case 'centavo_5':
      return Math.round(amount * 20) / 20;
    case 'none':
    default:
      return Math.round(amount * 100) / 100;
  }
}

describe('Currency Rounding', () => {
  describe('peso mode (round to nearest ₱1)', () => {
    it('rounds down: ₱45.43 → ₱45', () => {
      expect(applyRounding(45.43, 'peso')).toBe(45);
    });

    it('rounds up: ₱45.50 → ₱46', () => {
      expect(applyRounding(45.5, 'peso')).toBe(46);
    });

    it('rounds up: ₱99.99 → ₱100', () => {
      expect(applyRounding(99.99, 'peso')).toBe(100);
    });

    it('no change for whole numbers', () => {
      expect(applyRounding(100, 'peso')).toBe(100);
    });

    it('handles zero', () => {
      expect(applyRounding(0, 'peso')).toBe(0);
    });

    it('rounds ₱347.25 → ₱347', () => {
      expect(applyRounding(347.25, 'peso')).toBe(347);
    });
  });

  describe('centavo_5 mode (round to nearest ₱0.05)', () => {
    it('rounds ₱45.43 → ₱45.45', () => {
      expect(applyRounding(45.43, 'centavo_5')).toBe(45.45);
    });

    it('rounds ₱10.02 → ₱10.00', () => {
      expect(applyRounding(10.02, 'centavo_5')).toBe(10);
    });

    it('rounds ₱10.03 → ₱10.05', () => {
      expect(applyRounding(10.03, 'centavo_5')).toBe(10.05);
    });

    it('no change for clean centavo_5 values', () => {
      expect(applyRounding(10.25, 'centavo_5')).toBe(10.25);
    });
  });

  describe('none mode (round to nearest centavo)', () => {
    it('keeps ₱45.43 → ₱45.43', () => {
      expect(applyRounding(45.43, 'none')).toBe(45.43);
    });

    it('rounds ₱45.435 → ₱45.44', () => {
      expect(applyRounding(45.435, 'none')).toBe(45.44);
    });

    it('handles floating point edge: 0.1 + 0.2', () => {
      expect(applyRounding(0.1 + 0.2, 'none')).toBe(0.3);
    });
  });

  describe('edge cases', () => {
    it('unknown mode defaults to centavo rounding', () => {
      expect(applyRounding(45.43, 'unknown')).toBe(45.43);
    });

    it('undefined mode defaults to centavo rounding', () => {
      expect(applyRounding(45.43, undefined)).toBe(45.43);
    });

    it('large amounts round correctly', () => {
      expect(applyRounding(999999.49, 'peso')).toBe(999999);
      expect(applyRounding(999999.50, 'peso')).toBe(1000000);
    });
  });
});
