import { useState } from 'react';
import { Banknote, ArrowRight, CreditCard, Check } from 'lucide-react';
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

  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardAmount, setGiftCardAmount] = useState(0);
  const [giftCardApplied, setGiftCardApplied] = useState(false);

  // eWallet state
  const [ewalletAmount, setEwalletAmount] = useState(0);
  const [ewalletApplied, setEwalletApplied] = useState(false);

  const cashAmount = parseFloat(cashReceived) || 0;
  const totalDeductions = giftCardAmount + ewalletAmount;
  const remainingAfterGift = Math.max(0, total - totalDeductions);
  const change = cashAmount - remainingAfterGift;
  const canPay = cashAmount >= remainingAfterGift && total > 0;

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
    setGiftCardCode('');
    setGiftCardAmount(0);
    setGiftCardApplied(false);
    setEwalletAmount(0);
    setEwalletApplied(false);
    onClose();
  };

  const handleApplyEwallet = async () => {
    if (!customer?.id || !customer.ewallet || customer.ewallet <= 0) return;
    const amountAfterGift = Math.max(0, total - giftCardAmount);
    const amountToApply = Math.min(customer.ewallet, amountAfterGift);
    if (amountToApply <= 0) return;

    const result = await window.electronAPI.ewalletDeduct(customer.id, amountToApply);
    if (result.success) {
      setEwalletAmount(amountToApply);
      setEwalletApplied(true);
      toast.success(`eWallet: ₱${amountToApply.toFixed(2)} deducted`);
    } else {
      toast.error(result.error || 'eWallet payment failed');
    }
  };

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    // Try to apply the full remaining total from the gift card
    const amountToApply = Number(total.toFixed(2));
    const result = await window.electronAPI.redeemGiftCard(giftCardCode.trim(), amountToApply);
    if (result.success) {
      // Backend deducted min(balance, amountToApply). Applied = total - remainingBalance if remaining >= 0
      const applied = Number((amountToApply - Math.max(0, result.data.remainingBalance)).toFixed(2)) || amountToApply;
      setGiftCardAmount(amountToApply);
      setGiftCardApplied(true);
      toast.success(`Gift card applied! ₱${amountToApply.toFixed(2)} deducted`);
    } else {
      toast.error(result.error || 'Invalid gift card');
    }
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

        {/* Gift Card Section */}
        <div className="rounded-lg border border-border p-3">
          {!giftCardApplied ? (
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-text-muted shrink-0" />
              <input
                type="text"
                value={giftCardCode}
                onChange={(e) => setGiftCardCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyGiftCard()}
                placeholder="Gift card code"
                className="flex-1 h-9 px-2 rounded bg-bg-input border border-border text-small text-text-primary font-mono placeholder:text-text-muted focus:border-border-focus focus:outline-none"
              />
              <button
                onClick={handleApplyGiftCard}
                disabled={!giftCardCode.trim()}
                className={cn(
                  'px-3 h-9 rounded text-small font-medium transition-colors',
                  giftCardCode.trim()
                    ? 'bg-accent-secondary text-white hover:bg-accent-secondary-hover'
                    : 'bg-bg-hover text-text-muted cursor-not-allowed'
                )}
              >
                Apply
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-accent-primary" />
                <span className="text-small text-text-primary">
                  Gift card <span className="font-mono text-accent-secondary">{giftCardCode}</span> applied
                </span>
              </div>
              <span className="font-heading text-body text-accent-primary tabular-nums">
                -₱{giftCardAmount.toFixed(2)}
              </span>
            </div>
          )}
          {giftCardApplied && remainingAfterGift > 0 && (
            <p className="text-tiny text-text-muted mt-2">
              Remaining to pay: ₱{remainingAfterGift.toFixed(2)}
            </p>
          )}
          {giftCardApplied && remainingAfterGift <= 0 && (
            <p className="text-tiny text-accent-primary mt-2">
              Fully covered by gift card!
            </p>
          )}
        </div>

        {/* eWallet Payment */}
        {customer && customer.ewallet > 0 && !ewalletApplied && (
          <button
            onClick={handleApplyEwallet}
            className="w-full flex items-center justify-between px-4 h-12 rounded-lg border border-accent-secondary/30 bg-accent-secondary/5 text-text-primary hover:bg-accent-secondary/10 transition-colors"
          >
            <span className="text-small font-medium">💳 Pay with eWallet</span>
            <span className="font-heading text-body text-accent-secondary tabular-nums">
              ₱{Number(customer.ewallet).toFixed(2)} available
            </span>
          </button>
        )}

        {ewalletApplied && (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-accent-secondary/10 border border-accent-secondary/30">
            <span className="text-small text-text-primary">💳 eWallet applied</span>
            <span className="font-heading text-body text-accent-secondary tabular-nums">
              -₱{ewalletAmount.toFixed(2)}
            </span>
          </div>
        )}

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

        {/* Fixed Tip Input */}
        <div className="flex items-center gap-3">
          <label className="text-small text-text-secondary whitespace-nowrap">Tip (₱)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={tip || ''}
            onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="flex-1 h-10 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary tabular-nums placeholder:text-text-muted focus:border-border-focus focus:outline-none"
          />
          {tip > 0 && (
            <button
              onClick={() => setTip(0)}
              className="text-small text-accent-danger hover:underline"
            >
              Clear
            </button>
          )}
        </div>

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
