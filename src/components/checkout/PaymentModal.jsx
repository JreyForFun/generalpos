import { useState } from 'react';
import { Banknote, ArrowRight } from 'lucide-react';
import Modal from '../shared/Modal';
import { useCheckoutStore } from '../../store/checkoutStore';
import { useToast } from '../shared/Toast';
import { cn } from '../../lib/cn';

/**
 * PaymentModal — cash payment flow.
 * Shows total, cash input with quick-pick buttons, change calculation, and tip option.
 */
const quickAmounts = [20, 50, 100, 200, 500, 1000];

export default function PaymentModal({ isOpen, onClose, onComplete }) {
  const total = useCheckoutStore((s) => s.getTotal)();
  const items = useCheckoutStore((s) => s.items);
  const customer = useCheckoutStore((s) => s.customer);
  const discount = useCheckoutStore((s) => s.discount);
  const tip = useCheckoutStore((s) => s.tip);
  const setTip = useCheckoutStore((s) => s.setTip);
  const notes = useCheckoutStore((s) => s.notes);
  const setNotes = useCheckoutStore((s) => s.setNotes);
  const toast = useToast();

  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - total;
  const canPay = cashAmount >= total && total > 0;

  const handleQuickAmount = (amount) => {
    setCashReceived(String(amount));
  };

  const handleExactAmount = () => {
    setCashReceived(String(total));
  };

  const handleChangeToTip = () => {
    if (change > 0) {
      setTip(tip + change);
      setCashReceived(String(total + tip + change));
    }
  };

  const handleCompleteSale = async () => {
    if (!canPay || processing) return;
    setProcessing(true);

    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount || 0,
        })),
        payment: {
          method: 'cash',
          amount: cashAmount,
          payerName: customer?.name || null,
        },
        customerId: customer?.id || null,
        discount: discount,
        tip: tip,
        notes: notes,
      };

      const result = await window.electronAPI.createOrder(orderData);

      if (result.success) {
        toast.success('Order completed!', `#${result.data.orderNumber}`);
        onComplete(result.data, cashAmount, change > 0 ? change : 0);
      } else {
        toast.error(result.error || 'Failed to create order');
      }
    } catch (err) {
      toast.error('Payment failed — please try again');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setCashReceived('');
    setProcessing(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cash Payment" size="md">
      <div className="flex flex-col gap-6">
        {/* Total Due */}
        <div className="text-center py-4 rounded-xl bg-bg-primary border border-border">
          <p className="text-small text-text-muted uppercase tracking-wider mb-1">Total Due</p>
          <p className="font-heading text-display text-accent-primary tabular-nums">
            ₱{total.toFixed(2)}
          </p>
        </div>

        {/* Cash Received Input */}
        <div>
          <label className="text-small text-text-secondary mb-2 block">Cash Received</label>
          <div className="relative">
            <Banknote size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="number"
              min="0"
              step="0.01"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canPay && handleCompleteSale()}
              placeholder="0.00"
              className="w-full h-14 pl-11 pr-4 rounded-xl bg-bg-input border border-border text-h1 font-heading text-text-primary tabular-nums focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleExactAmount}
            className="h-11 rounded-lg bg-accent-primary/10 text-accent-primary text-body font-semibold hover:bg-accent-primary/20 transition-colors"
          >
            Exact
          </button>
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              onClick={() => handleQuickAmount(amt)}
              className={cn(
                'h-11 rounded-lg text-body font-semibold transition-colors tabular-nums',
                cashAmount === amt
                  ? 'bg-accent-primary text-text-inverse'
                  : 'bg-bg-hover text-text-primary hover:bg-bg-active'
              )}
            >
              ₱{amt}
            </button>
          ))}
        </div>

        {/* Change Display */}
        {cashAmount > 0 && (
          <div className={cn(
            'text-center py-4 rounded-xl border',
            canPay
              ? 'bg-accent-primary/5 border-accent-primary/20'
              : 'bg-accent-danger/5 border-accent-danger/20'
          )}>
            <p className="text-small text-text-muted uppercase tracking-wider mb-1">
              {canPay ? 'Change' : 'Insufficient'}
            </p>
            <p className={cn(
              'font-heading text-display tabular-nums',
              canPay ? 'text-accent-primary' : 'text-accent-danger'
            )}>
              {canPay ? `₱${change.toFixed(2)}` : `-₱${Math.abs(change).toFixed(2)}`}
            </p>

            {/* Change to Tip */}
            {canPay && change > 0 && (
              <button
                onClick={handleChangeToTip}
                className="mt-2 text-small text-accent-info hover:underline"
              >
                Add ₱{change.toFixed(2)} as tip
              </button>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-small text-text-secondary mb-1 block">Order Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note..."
            className="w-full h-10 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none transition-colors"
          />
        </div>

        {/* Complete Button */}
        <button
          onClick={handleCompleteSale}
          disabled={!canPay || processing}
          className={cn(
            'w-full h-14 rounded-xl font-heading text-h3 font-bold flex items-center justify-center gap-2 transition-all duration-150',
            canPay && !processing
              ? 'bg-accent-primary text-text-inverse shadow-glow hover:bg-accent-primary-hover hover:shadow-[0_0_30px_rgba(0,212,170,0.25)] active:scale-[0.98]'
              : 'bg-bg-hover text-text-muted cursor-not-allowed'
          )}
        >
          {processing ? (
            'Processing...'
          ) : (
            <>
              Complete Sale <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
