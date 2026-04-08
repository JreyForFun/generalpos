import { useState } from 'react';
import { Plus, Trash2, ArrowRight, AlertCircle } from 'lucide-react';
import Modal from '../shared/Modal';
import { useCheckoutStore } from '../../store/checkoutStore';
import { useToast } from '../shared/Toast';
import { cn } from '../../lib/cn';

/**
 * SplitPaymentModal — split a bill across multiple payers.
 * Each payer has a name, method (cash/ewallet), and amount.
 * Validates that sum of all payer amounts equals the order total.
 */
const METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'ewallet', label: 'eWallet' },
];

export default function SplitPaymentModal({ isOpen, onClose, onComplete }) {
  const total = useCheckoutStore((s) => s.getTotal)();
  const items = useCheckoutStore((s) => s.items);
  const customer = useCheckoutStore((s) => s.customer);
  const discount = useCheckoutStore((s) => s.discount);
  const tip = useCheckoutStore((s) => s.tip);
  const notes = useCheckoutStore((s) => s.notes);
  const toast = useToast();

  const [payers, setPayers] = useState([
    { name: 'Payer 1', method: 'cash', amount: '' },
    { name: 'Payer 2', method: 'cash', amount: '' },
  ]);
  const [processing, setProcessing] = useState(false);

  const payerTotal = payers.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remaining = Number((total - payerTotal).toFixed(2));
  const isBalanced = Math.abs(remaining) < 0.01;

  const handleAddPayer = () => {
    setPayers((prev) => [
      ...prev,
      { name: `Payer ${prev.length + 1}`, method: 'cash', amount: '' },
    ]);
  };

  const handleRemovePayer = (index) => {
    if (payers.length <= 2) return;
    setPayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePayer = (index, field, value) => {
    setPayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleSplitEvenly = () => {
    const perPayer = Number((total / payers.length).toFixed(2));
    // Last payer gets remainder to avoid rounding issues
    setPayers((prev) =>
      prev.map((p, i) => ({
        ...p,
        amount: i === prev.length - 1
          ? String(Number((total - perPayer * (prev.length - 1)).toFixed(2)))
          : String(perPayer),
      }))
    );
  };

  const handleCompleteSplit = async () => {
    if (!isBalanced) {
      toast.error('Payer amounts must equal the order total');
      return;
    }

    // Validate all payers have amounts
    for (const payer of payers) {
      const amt = parseFloat(payer.amount);
      if (!amt || amt <= 0) {
        toast.error(`${payer.name} must have an amount greater than 0`);
        return;
      }
    }

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
          method: 'split',
          amount: total,
          payerName: payers.map((p) => p.name).join(', '),
        },
        splitPayments: payers.map((p) => ({
          name: p.name,
          method: p.method,
          amount: parseFloat(p.amount),
        })),
        customerId: customer?.id || null,
        discount,
        tip,
        notes,
      };

      const result = await window.electronAPI.createOrder(orderData);

      if (result.success) {
        toast.success('Split payment completed!', `#${result.data.orderNumber}`);
        onComplete(result.data, total, 0);
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
    setPayers([
      { name: 'Payer 1', method: 'cash', amount: '' },
      { name: 'Payer 2', method: 'cash', amount: '' },
    ]);
    setProcessing(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Split Payment" size="lg">
      <div className="flex flex-col gap-5">
        {/* Total Due */}
        <div className="text-center py-3 rounded-xl bg-bg-primary border border-border">
          <p className="text-small text-text-muted uppercase tracking-wider mb-1">Total to Split</p>
          <p className="font-heading text-display text-accent-primary tabular-nums">
            ₱{total.toFixed(2)}
          </p>
        </div>

        {/* Split Evenly Button */}
        <button
          onClick={handleSplitEvenly}
          className="w-full h-9 rounded-lg border border-border text-small text-text-secondary font-medium hover:bg-bg-hover transition-colors"
        >
          Split Evenly ({payers.length} payers × ₱{(total / payers.length).toFixed(2)})
        </button>

        {/* Payers List */}
        <div className="space-y-3 max-h-[280px] overflow-y-auto">
          {payers.map((payer, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 rounded-lg border border-border bg-bg-tertiary"
            >
              {/* Name */}
              <input
                type="text"
                value={payer.name}
                onChange={(e) => handleUpdatePayer(i, 'name', e.target.value)}
                className="w-28 h-9 px-2 rounded bg-bg-input border border-border text-small text-text-primary focus:border-border-focus focus:outline-none"
                placeholder="Name"
              />

              {/* Method */}
              <select
                value={payer.method}
                onChange={(e) => handleUpdatePayer(i, 'method', e.target.value)}
                className="h-9 px-2 rounded bg-bg-input border border-border text-small text-text-primary focus:border-border-focus focus:outline-none"
              >
                {METHODS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>

              {/* Amount */}
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payer.amount}
                  onChange={(e) => handleUpdatePayer(i, 'amount', e.target.value)}
                  className="w-full h-9 px-2 rounded bg-bg-input border border-border text-small text-text-primary tabular-nums placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                  placeholder="₱ Amount"
                />
              </div>

              {/* Remove */}
              <button
                onClick={() => handleRemovePayer(i)}
                disabled={payers.length <= 2}
                className={cn(
                  'w-9 h-9 rounded flex items-center justify-center shrink-0 transition-colors',
                  payers.length <= 2
                    ? 'text-text-muted cursor-not-allowed'
                    : 'text-accent-danger hover:bg-accent-danger/10'
                )}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Payer */}
        <button
          onClick={handleAddPayer}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-dashed border-border text-small text-text-secondary font-medium hover:bg-bg-hover hover:border-border-focus transition-colors"
        >
          <Plus size={14} /> Add Payer
        </button>

        {/* Balance Indicator */}
        <div className={cn(
          'flex items-center justify-between py-3 px-4 rounded-xl border',
          isBalanced
            ? 'bg-accent-primary/5 border-accent-primary/20'
            : 'bg-accent-danger/5 border-accent-danger/20'
        )}>
          <div className="flex items-center gap-2">
            {!isBalanced && <AlertCircle size={16} className="text-accent-danger" />}
            <span className="text-small text-text-secondary">
              {isBalanced ? 'Amounts balanced ✓' : remaining > 0 ? 'Remaining' : 'Over by'}
            </span>
          </div>
          <span className={cn(
            'font-heading text-h3 tabular-nums',
            isBalanced ? 'text-accent-primary' : 'text-accent-danger'
          )}>
            {isBalanced ? '₱0.00' : `₱${Math.abs(remaining).toFixed(2)}`}
          </span>
        </div>

        {/* Complete Button */}
        <button
          onClick={handleCompleteSplit}
          disabled={!isBalanced || processing}
          className={cn(
            'w-full h-14 rounded-xl font-heading text-h3 font-bold flex items-center justify-center gap-2 transition-all duration-150',
            isBalanced && !processing
              ? 'bg-accent-primary text-text-inverse shadow-glow hover:bg-accent-primary-hover active:scale-[0.98]'
              : 'bg-bg-hover text-text-muted cursor-not-allowed'
          )}
        >
          {processing ? 'Processing...' : (
            <>Complete Split Payment <ArrowRight size={20} /></>
          )}
        </button>
      </div>
    </Modal>
  );
}
