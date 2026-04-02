import { Minus, Plus, X, ShoppingCart, Percent, Tag } from 'lucide-react';
import { useCheckoutStore } from '../../store/checkoutStore';
import { cn } from '../../lib/cn';
import { useState } from 'react';

/**
 * Cart — active order panel (380px fixed width).
 * Shows item list, quantity controls, discounts, subtotal/total, and Pay button.
 * DESIGN_SYSTEM §5.3 Cart Item Card spec.
 */
export default function Cart({ onPay }) {
  const items = useCheckoutStore((s) => s.items);
  const customer = useCheckoutStore((s) => s.customer);
  const tip = useCheckoutStore((s) => s.tip);
  const removeItem = useCheckoutStore((s) => s.removeItem);
  const updateQuantity = useCheckoutStore((s) => s.updateQuantity);
  const setItemDiscount = useCheckoutStore((s) => s.setItemDiscount);
  const setDiscount = useCheckoutStore((s) => s.setDiscount);
  const clearDiscount = useCheckoutStore((s) => s.clearDiscount);
  const discount = useCheckoutStore((s) => s.discount);
  const getSubtotal = useCheckoutStore((s) => s.getSubtotal);
  const getDiscountAmount = useCheckoutStore((s) => s.getDiscountAmount);
  const getTotal = useCheckoutStore((s) => s.getTotal);
  const clearCart = useCheckoutStore((s) => s.clearCart);

  const [showOrderDiscount, setShowOrderDiscount] = useState(false);
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [editingItemDiscount, setEditingItemDiscount] = useState(null);
  const [itemDiscountValue, setItemDiscountValue] = useState('');

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const total = getTotal();

  const handleApplyOrderDiscount = () => {
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      clearDiscount();
      setShowOrderDiscount(false);
      return;
    }
    setDiscount({ type: discountType, value: val });
    setShowOrderDiscount(false);
    setDiscountValue('');
  };

  const handleApplyItemDiscount = (index) => {
    const val = parseFloat(itemDiscountValue);
    if (isNaN(val) || val <= 0) {
      setItemDiscount(index, 0);
    } else {
      setItemDiscount(index, val);
    }
    setEditingItemDiscount(null);
    setItemDiscountValue('');
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} className="text-accent-primary" />
          <h2 className="font-heading text-h3 text-text-primary">
            Cart
          </h2>
          {items.length > 0 && (
            <span className="text-tiny font-semibold px-2 py-0.5 rounded-full bg-accent-primary/15 text-accent-primary">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-small text-text-muted hover:text-accent-danger transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Customer badge */}
      {customer && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-accent-secondary/10 border border-accent-secondary/20">
          <p className="text-small text-accent-secondary font-medium">
            👤 {customer.name}
            {customer.discount_value > 0 && (
              <span className="ml-2 text-tiny opacity-75">
                ({customer.discount_type === 'percent' ? `${customer.discount_value}%` : `₱${customer.discount_value}`} discount)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingCart size={40} className="text-text-muted mb-3" />
            <p className="text-body text-text-secondary">Cart is empty</p>
            <p className="text-small text-text-muted mt-1">Tap a product to add</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.productId}-${item.variantId}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary group"
            >
              {/* Item details */}
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-text-primary truncate">
                  {item.name}
                </p>
                <p className="text-small text-text-secondary tabular-nums">
                  ₱{Number(item.price).toFixed(2)} each
                  {item.discount > 0 && (
                    <span className="ml-2 text-accent-primary">
                      -₱{Number(item.discount).toFixed(2)}
                    </span>
                  )}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => updateQuantity(index, item.quantity - 1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-body font-semibold text-text-primary tabular-nums">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(index, item.quantity + 1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Line total */}
              <p className="text-body font-semibold text-accent-primary tabular-nums shrink-0 w-20 text-right">
                ₱{((item.price * item.quantity) - item.discount).toFixed(2)}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingItemDiscount(index);
                    setItemDiscountValue(item.discount > 0 ? String(item.discount) : '');
                  }}
                  className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-accent-primary transition-colors"
                  title="Item discount"
                >
                  <Tag size={12} />
                </button>
                <button
                  onClick={() => removeItem(index)}
                  className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-accent-danger transition-colors"
                  title="Remove item"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Per-item discount editor inline */}
        {editingItemDiscount !== null && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-hover border border-border-focus">
            <Tag size={14} className="text-accent-primary shrink-0" />
            <span className="text-small text-text-secondary shrink-0">Discount ₱:</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={itemDiscountValue}
              onChange={(e) => setItemDiscountValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyItemDiscount(editingItemDiscount)}
              className="flex-1 h-8 px-2 rounded bg-bg-input border border-border text-body text-text-primary focus:border-border-focus focus:outline-none tabular-nums"
              autoFocus
              placeholder="0.00"
            />
            <button
              onClick={() => handleApplyItemDiscount(editingItemDiscount)}
              className="px-3 h-8 rounded bg-accent-primary text-text-inverse text-small font-medium hover:bg-accent-primary-hover transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => { setEditingItemDiscount(null); setItemDiscountValue(''); }}
              className="px-2 h-8 rounded text-text-muted hover:text-text-secondary text-small"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Totals & Actions */}
      {items.length > 0 && (
        <div className="border-t border-border px-4 py-4 shrink-0 space-y-3">
          {/* Order discount toggle */}
          {!showOrderDiscount && !discount ? (
            <button
              onClick={() => setShowOrderDiscount(true)}
              className="flex items-center gap-2 text-small text-text-secondary hover:text-accent-primary transition-colors"
            >
              <Percent size={14} />
              Add order discount
            </button>
          ) : showOrderDiscount ? (
            <div className="flex items-center gap-2">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="h-8 px-2 rounded bg-bg-input border border-border text-small text-text-primary focus:outline-none"
              >
                <option value="percent">%</option>
                <option value="fixed">₱</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyOrderDiscount()}
                className="flex-1 h-8 px-2 rounded bg-bg-input border border-border text-body text-text-primary focus:border-border-focus focus:outline-none tabular-nums"
                autoFocus
                placeholder={discountType === 'percent' ? '10' : '50.00'}
              />
              <button
                onClick={handleApplyOrderDiscount}
                className="px-3 h-8 rounded bg-accent-primary text-text-inverse text-small font-medium"
              >
                Apply
              </button>
              <button
                onClick={() => { setShowOrderDiscount(false); setDiscountValue(''); }}
                className="text-text-muted text-small hover:text-text-secondary"
              >
                Cancel
              </button>
            </div>
          ) : discount ? (
            <div className="flex items-center justify-between">
              <span className="text-small text-text-secondary">
                📎 {discount.type === 'percent' ? `${discount.value}% off` : `₱${discount.value} off`}
              </span>
              <button
                onClick={clearDiscount}
                className="text-small text-accent-danger hover:underline"
              >
                Remove
              </button>
            </div>
          ) : null}

          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-body text-text-secondary">Subtotal</span>
            <span className="text-body font-semibold text-text-primary tabular-nums">
              ₱{subtotal.toFixed(2)}
            </span>
          </div>

          {/* Discount row */}
          {discountAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-body text-text-secondary">Discount</span>
              <span className="text-body font-semibold text-accent-primary tabular-nums">
                -₱{discountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* Tip row */}
          {tip > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-body text-text-secondary">Tip</span>
              <span className="text-body font-semibold text-text-primary tabular-nums">
                +₱{tip.toFixed(2)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="font-heading text-h2 text-text-primary">Total</span>
            <span className="font-heading text-display text-accent-primary tabular-nums">
              ₱{total.toFixed(2)}
            </span>
          </div>

          {/* Pay Button — DESIGN_SYSTEM §5.1 Pay Button */}
          <button
            onClick={onPay}
            className="w-full h-14 rounded-xl bg-accent-primary text-text-inverse font-heading text-h3 font-bold shadow-glow hover:bg-accent-primary-hover hover:shadow-[0_0_30px_rgba(0,212,170,0.25)] active:scale-[0.98] transition-all duration-150"
          >
            Pay ₱{total.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}
