import { describe, it, expect } from 'vitest';
import { validate, validateFields } from '../../electron/utils/validate';

describe('validate', () => {
  describe('id', () => {
    it('accepts positive integers', () => {
      expect(validate.id(1)).toBe(true);
      expect(validate.id(999)).toBe(true);
    });
    it('rejects zero, negative, floats, strings', () => {
      expect(validate.id(0)).toBe(false);
      expect(validate.id(-1)).toBe(false);
      expect(validate.id(1.5)).toBe(false);
      expect(validate.id('1')).toBe(false);
      expect(validate.id(null)).toBe(false);
    });
  });

  describe('quantity', () => {
    it('accepts 1-9999', () => {
      expect(validate.quantity(1)).toBe(true);
      expect(validate.quantity(9999)).toBe(true);
    });
    it('rejects 0, negative, over 9999', () => {
      expect(validate.quantity(0)).toBe(false);
      expect(validate.quantity(-5)).toBe(false);
      expect(validate.quantity(10000)).toBe(false);
    });
  });

  describe('amount', () => {
    it('accepts 0 and positive numbers', () => {
      expect(validate.amount(0)).toBe(true);
      expect(validate.amount(99.99)).toBe(true);
      expect(validate.amount(999999.99)).toBe(true);
    });
    it('rejects negative and over max', () => {
      expect(validate.amount(-1)).toBe(false);
      expect(validate.amount(1000000)).toBe(false);
      expect(validate.amount(Infinity)).toBe(false);
    });
  });

  describe('text', () => {
    it('accepts non-empty strings up to 255 chars', () => {
      expect(validate.text('Hello')).toBe(true);
      expect(validate.text('a'.repeat(255))).toBe(true);
    });
    it('rejects empty, whitespace-only, or too long', () => {
      expect(validate.text('')).toBe(false);
      expect(validate.text('   ')).toBe(false);
      expect(validate.text('a'.repeat(256))).toBe(false);
      expect(validate.text(null)).toBe(false);
    });
  });

  describe('pin', () => {
    it('accepts 4-6 digit strings', () => {
      expect(validate.pin('1234')).toBe(true);
      expect(validate.pin('123456')).toBe(true);
    });
    it('rejects too short, too long, non-digits', () => {
      expect(validate.pin('123')).toBe(false);
      expect(validate.pin('1234567')).toBe(false);
      expect(validate.pin('12ab')).toBe(false);
      expect(validate.pin(1234)).toBe(false);
    });
  });

  describe('role', () => {
    it('accepts valid roles', () => {
      expect(validate.role('admin')).toBe(true);
      expect(validate.role('manager')).toBe(true);
      expect(validate.role('cashier')).toBe(true);
    });
    it('rejects invalid roles', () => {
      expect(validate.role('superadmin')).toBe(false);
      expect(validate.role('')).toBe(false);
    });
  });

  describe('paymentMethod', () => {
    it('accepts valid methods', () => {
      expect(validate.paymentMethod('cash')).toBe(true);
      expect(validate.paymentMethod('ewallet')).toBe(true);
      expect(validate.paymentMethod('split')).toBe(true);
    });
    it('rejects invalid methods', () => {
      expect(validate.paymentMethod('credit_card')).toBe(false);
    });
  });
});

describe('validateFields', () => {
  it('validates all fields', () => {
    const result = validateFields(
      { name: 'Coffee', price: 120 },
      { name: 'text', price: 'amount' }
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for invalid fields', () => {
    const result = validateFields(
      { name: '', price: -5 },
      { name: 'text', price: 'amount' }
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid name');
    expect(result.errors).toContain('Invalid price');
  });
});
