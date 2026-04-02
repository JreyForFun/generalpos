import { describe, it, expect, beforeEach } from 'vitest';
import { useCheckoutStore } from '../../src/store/checkoutStore';

// Reset store between tests
beforeEach(() => {
  useCheckoutStore.getState().clearCart();
});

describe('Cart calculations', () => {
  describe('addItem', () => {
    it('adds a new item to cart', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 85 });
      const items = useCheckoutStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Coffee');
      expect(items[0].quantity).toBe(1);
    });

    it('increments quantity for duplicate product', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 85 });
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 85 });
      const items = useCheckoutStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('adds variant as separate item', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 85 });
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 100, variantId: 5, variantName: 'Large', variantPrice: 100 });
      const items = useCheckoutStore.getState().items;
      expect(items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('removes item by index', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 85 });
      useCheckoutStore.getState().addItem({ id: 2, name: 'Latte', price: 130 });
      useCheckoutStore.getState().removeItem(0);
      const items = useCheckoutStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Latte');
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 85 });
      useCheckoutStore.getState().updateQuantity(0, 5);
      expect(useCheckoutStore.getState().items[0].quantity).toBe(5);
    });

    it('removes item when quantity set to 0', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 85 });
      useCheckoutStore.getState().updateQuantity(0, 0);
      expect(useCheckoutStore.getState().items).toHaveLength(0);
    });
  });

  describe('getSubtotal', () => {
    it('calculates subtotal for single item', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 85 });
      expect(useCheckoutStore.getState().getSubtotal()).toBe(85);
    });

    it('calculates subtotal for multiple items', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 85 });
      useCheckoutStore.getState().addItem({ id: 2, name: 'Latte', price: 130 });
      expect(useCheckoutStore.getState().getSubtotal()).toBe(215);
    });

    it('calculates subtotal with quantity > 1', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 85 });
      useCheckoutStore.getState().updateQuantity(0, 3);
      expect(useCheckoutStore.getState().getSubtotal()).toBe(255);
    });

    it('subtracts item-level discounts', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 100 });
      useCheckoutStore.getState().setItemDiscount(0, 10);
      expect(useCheckoutStore.getState().getSubtotal()).toBe(90);
    });
  });

  describe('getDiscountAmount (order-level)', () => {
    it('returns 0 when no discount', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 100 });
      expect(useCheckoutStore.getState().getDiscountAmount()).toBe(0);
    });

    it('applies percentage discount', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 100 });
      useCheckoutStore.getState().setDiscount({ type: 'percent', value: 10 });
      expect(useCheckoutStore.getState().getDiscountAmount()).toBe(10);
    });

    it('applies fixed discount', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 100 });
      useCheckoutStore.getState().setDiscount({ type: 'fixed', value: 25 });
      expect(useCheckoutStore.getState().getDiscountAmount()).toBe(25);
    });

    it('applies customer discount independently of order discount', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 100 });
      // Set customer with 5% discount, no order-level discount
      useCheckoutStore.getState().setCustomer({
        id: 1, name: 'VIP', discount_type: 'percent', discount_value: 5
      });
      const discountAmount = useCheckoutStore.getState().getDiscountAmount();
      expect(discountAmount).toBe(5); // 5% of 100
    });

    it('combines customer and order discounts', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 100 });
      useCheckoutStore.getState().setCustomer({
        id: 1, name: 'VIP', discount_type: 'fixed', discount_value: 10
      });
      useCheckoutStore.getState().setDiscount({ type: 'percent', value: 10 });
      // Order: 10% of 100 = 10, Customer: fixed 10, Total: 20
      expect(useCheckoutStore.getState().getDiscountAmount()).toBe(20);
    });
  });

  describe('getTotal', () => {
    it('calculates total correctly', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 100 });
      useCheckoutStore.getState().addItem({ id: 2, name: 'Latte', price: 130 });
      useCheckoutStore.getState().setDiscount({ type: 'fixed', value: 30 });
      useCheckoutStore.getState().setTip(20);
      // Subtotal: 230, Discount: 30, Tip: 20 => 220
      expect(useCheckoutStore.getState().getTotal()).toBe(220);
    });

    it('never returns negative', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 10 });
      useCheckoutStore.getState().setDiscount({ type: 'fixed', value: 100 });
      expect(useCheckoutStore.getState().getTotal()).toBe(0);
    });

    it('handles floating point correctly (0.1 + 0.2 edge case)', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Item A', price: 0.1 });
      useCheckoutStore.getState().addItem({ id: 2, name: 'Item B', price: 0.2 });
      const total = useCheckoutStore.getState().getTotal();
      expect(total).toBe(0.3);
    });
  });

  describe('clearCart', () => {
    it('resets all state', () => {
      useCheckoutStore.getState().addItem({ id: 1, name: 'Coffee', price: 85 });
      useCheckoutStore.getState().setTip(10);
      useCheckoutStore.getState().setNotes('Test');
      useCheckoutStore.getState().clearCart();
      const state = useCheckoutStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.tip).toBe(0);
      expect(state.notes).toBe('');
      expect(state.status).toBe('idle');
      expect(state.customer).toBeNull();
      expect(state.discount).toBeNull();
    });
  });
});
