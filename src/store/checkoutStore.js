import { create } from 'zustand';

/**
 * Checkout store — manages cart state, customer selection, and checkout flow.
 * State machine: idle → adding_items → reviewing → paying → completed
 */
export const useCheckoutStore = create((set, get) => ({
  // Cart state
  items: [],            // [{ productId, variantId?, name, price, quantity, discount }]
  customer: null,       // Selected customer object
  discount: null,       // Order-level { type: 'percent'|'fixed', value: number }
  tip: 0,
  notes: '',

  // Checkout flow state
  status: 'idle',       // idle | adding_items | reviewing | paying | completed

  // Held orders (parallel orders)
  heldOrders: [],       // [{ items, customer, discount, tip, notes, heldAt }]

  // ─── Cart Actions ───

  addItem: (product) => {
    const items = get().items;
    const existing = items.find(
      (i) => i.productId === product.id && i.variantId === (product.variantId || null)
    );

    if (existing) {
      set({
        items: items.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i
        ),
        status: 'adding_items',
      });
    } else {
      set({
        items: [
          ...items,
          {
            productId: product.id,
            variantId: product.variantId || null,
            name: product.variantName ? `${product.name} (${product.variantName})` : product.name,
            price: product.variantPrice || product.price,
            quantity: 1,
            discount: 0,
          },
        ],
        status: 'adding_items',
      });
    }
  },

  removeItem: (index) => {
    set({
      items: get().items.filter((_, i) => i !== index),
    });
  },

  updateQuantity: (index, quantity) => {
    if (quantity <= 0) {
      get().removeItem(index);
      return;
    }
    set({
      items: get().items.map((item, i) =>
        i === index ? { ...item, quantity } : item
      ),
    });
  },

  setItemDiscount: (index, discount) => {
    set({
      items: get().items.map((item, i) =>
        i === index ? { ...item, discount } : item
      ),
    });
  },

  // ─── Order-Level Actions ───

  setCustomer: (customer) => set({ customer }),
  clearCustomer: () => set({ customer: null }),

  setDiscount: (discount) => set({ discount }),
  clearDiscount: () => set({ discount: null }),

  setTip: (tip) => set({ tip: Math.max(0, tip) }),
  setNotes: (notes) => set({ notes }),

  setStatus: (status) => set({ status }),

  // ─── Computed Values ───

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      return sum + (item.price * item.quantity) - item.discount;
    }, 0);
  },

  getDiscountAmount: () => {
    const { discount } = get();
    const subtotal = get().getSubtotal();

    // Apply customer discount if set (independent of order discount)
    let customerDiscount = 0;
    const customer = get().customer;
    if (customer?.discount_type && customer?.discount_value) {
      const notExpired = !customer.discount_expiry || new Date(customer.discount_expiry) >= new Date();
      if (notExpired) {
        customerDiscount = customer.discount_type === 'percent'
          ? subtotal * (customer.discount_value / 100)
          : customer.discount_value;
      }
    }

    // Apply order-level discount
    let orderDiscount = 0;
    if (discount) {
      orderDiscount = discount.type === 'percent'
        ? subtotal * (discount.value / 100)
        : discount.value;
    }

    return Number((orderDiscount + customerDiscount).toFixed(2));
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    const tip = get().tip;
    return Math.max(0, Number((subtotal - discountAmount + tip).toFixed(2)));
  },

  // ─── Held Orders (Parallel Orders) ───

  holdOrder: () => {
    const { items, customer, discount, tip, notes, heldOrders } = get();
    if (items.length === 0) return false;
    const snapshot = { items: [...items], customer, discount, tip, notes, heldAt: new Date().toISOString() };
    set({
      heldOrders: [...heldOrders, snapshot],
      items: [], customer: null, discount: null, tip: 0, notes: '', status: 'idle',
    });
    return true;
  },

  resumeOrder: (index) => {
    const { heldOrders } = get();
    if (index < 0 || index >= heldOrders.length) return false;
    const order = heldOrders[index];
    set({
      items: order.items,
      customer: order.customer,
      discount: order.discount,
      tip: order.tip,
      notes: order.notes,
      status: 'adding_items',
      heldOrders: heldOrders.filter((_, i) => i !== index),
    });
    return true;
  },

  removeHeldOrder: (index) => {
    set({ heldOrders: get().heldOrders.filter((_, i) => i !== index) });
  },

  // ─── Reset ───

  clearCart: () => set({
    items: [],
    customer: null,
    discount: null,
    tip: 0,
    notes: '',
    status: 'idle',
  }),
}));
