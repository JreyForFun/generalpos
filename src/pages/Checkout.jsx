import { useState, useEffect } from 'react';
import ProductGrid from '../components/checkout/ProductGrid';
import Cart from '../components/checkout/Cart';
import PaymentModal from '../components/checkout/PaymentModal';
import SplitPaymentModal from '../components/checkout/SplitPaymentModal';
import ReceiptModal from '../components/checkout/ReceiptModal';
import { useCheckoutStore } from '../store/checkoutStore';
import { useSessionStore } from '../store/sessionStore';

/**
 * Checkout page — main POS screen.
 * Layout: ProductGrid (flex-1) | Cart (380px)
 * DESIGN_SYSTEM §4 Checkout Screen Layout
 */
export default function Checkout() {
  const clearCart = useCheckoutStore((s) => s.clearCart);
  const items = useCheckoutStore((s) => s.items);
  const session = useSessionStore((s) => s.session);

  const [showPayment, setShowPayment] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [lastCash, setLastCash] = useState(0);
  const [lastChange, setLastChange] = useState(0);

  const handlePay = () => {
    if (items.length === 0) return;
    setShowPayment(true);
  };

  const handleSplitPay = () => {
    if (items.length === 0) return;
    setShowSplit(true);
  };

  // Listen for F9 shortcut
  useEffect(() => {
    const onPayShortcut = () => handlePay();
    document.addEventListener('shortcut:pay', onPayShortcut);
    return () => document.removeEventListener('shortcut:pay', onPayShortcut);
  }, [items]);

  const handlePaymentComplete = (orderData, cashReceived, change) => {
    // Store order data for receipt
    setLastOrder({
      ...orderData,
      items: items.map((item) => ({ ...item })), // snapshot items before clearing
      subtotal: useCheckoutStore.getState().getSubtotal(),
      discountAmount: useCheckoutStore.getState().getDiscountAmount(),
      tipAmount: useCheckoutStore.getState().tip,
    });
    setLastCash(cashReceived);
    setLastChange(change);

    // Close payment/split, show receipt
    setShowPayment(false);
    setShowSplit(false);
    setShowReceipt(true);

    // Clear cart for next order
    clearCart();
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setLastOrder(null);
  };

  return (
    <div className="flex h-full -m-6">
      {/* Product Grid — flexible width */}
      <div className="flex-1 p-6 overflow-hidden">
        <ProductGrid />
      </div>

      {/* Cart Panel — responsive width */}
      <div className="w-[320px] xl:w-[380px] shrink-0">
        <Cart onPay={handlePay} onSplitPay={handleSplitPay} />
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onComplete={handlePaymentComplete}
      />

      {/* Split Payment Modal */}
      <SplitPaymentModal
        isOpen={showSplit}
        onClose={() => setShowSplit(false)}
        onComplete={handlePaymentComplete}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={handleReceiptClose}
        orderData={lastOrder}
        cashReceived={lastCash}
        change={lastChange}
        cashierName={session?.name}
      />
    </div>
  );
}

