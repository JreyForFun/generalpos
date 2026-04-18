import { useState } from 'react';
import { Star, Wallet, ShoppingBag, Calendar, Plus } from 'lucide-react';
import Modal from '../shared/Modal';
import { useToast } from '../shared/Toast';
import { cn } from '../../lib/cn';
import { formatCurrencyRaw } from '../../lib/formatCurrency';

/**
 * CustomerProfile — modal showing customer details, purchase history,
 * points, eWallet balance, and top-up functionality.
 */
export default function CustomerProfile({ customer, onClose, onRefresh }) {
  const toast = useToast();
  const [topupAmount, setTopupAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) return;

    setProcessing(true);
    const result = await window.electronAPI.ewalletTopup(customer.id, amount);
    if (result.success) {
      toast.success(`${formatCurrencyRaw(amount)} added to eWallet`);
      setTopupAmount('');
      onRefresh?.();
      // Update local state
      customer.ewallet = result.data.balance;
    } else {
      toast.error(result.error || 'Top-up failed');
    }
    setProcessing(false);
  };

  const discountInfo = () => {
    if (!customer.discount_type || !customer.discount_value) return null;
    const expired = customer.discount_expiry && new Date(customer.discount_expiry) < new Date();
    const label = customer.discount_type === 'percent'
      ? `${customer.discount_value}% off`
      : `${formatCurrencyRaw(customer.discount_value)} off`;
    return { label, expired };
  };

  const disc = discountInfo();

  return (
    <Modal isOpen={true} onClose={onClose} title={customer.name} size="lg">
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-bg-primary border border-border p-4 text-center">
            <Star size={20} className="text-accent-warning mx-auto mb-2" />
            <p className="font-heading text-h2 text-text-primary tabular-nums">
              {Number(customer.points || 0).toLocaleString()}
            </p>
            <p className="text-tiny text-text-muted uppercase tracking-wider mt-1">Points</p>
          </div>
          <div className="rounded-xl bg-bg-primary border border-border p-4 text-center">
            <Wallet size={20} className="text-accent-primary mx-auto mb-2" />
            <p className="font-heading text-h2 text-accent-primary tabular-nums">
              {formatCurrencyRaw(customer.ewallet || 0)}
            </p>
            <p className="text-tiny text-text-muted uppercase tracking-wider mt-1">eWallet</p>
          </div>
          <div className="rounded-xl bg-bg-primary border border-border p-4 text-center">
            <ShoppingBag size={20} className="text-accent-secondary mx-auto mb-2" />
            <p className="font-heading text-h2 text-text-primary tabular-nums">
              {customer.orders?.length || 0}
            </p>
            <p className="text-tiny text-text-muted uppercase tracking-wider mt-1">Orders</p>
          </div>
        </div>

        {/* Info Row */}
        <div className="flex items-center gap-4 text-small text-text-secondary">
          {customer.phone && <span>📱 {customer.phone}</span>}
          {customer.email && <span>✉ {customer.email}</span>}
          {disc && (
            <span className={cn(disc.expired ? 'line-through text-text-muted' : 'text-accent-secondary font-semibold')}>
              🏷 {disc.label}{disc.expired ? ' (expired)' : ''}
            </span>
          )}
        </div>

        {/* eWallet Top-up */}
        <div className="rounded-lg border border-border p-3">
          <p className="text-small text-text-secondary mb-2">Top Up eWallet</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTopup()}
              placeholder="₱ Amount"
              className="flex-1 h-10 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary tabular-nums placeholder:text-text-muted focus:border-border-focus focus:outline-none"
            />
            <button
              onClick={handleTopup}
              disabled={processing || !topupAmount}
              className={cn(
                'flex items-center gap-1.5 px-4 h-10 rounded-lg font-semibold text-small transition-all',
                processing || !topupAmount
                  ? 'bg-bg-hover text-text-muted cursor-not-allowed'
                  : 'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover'
              )}
            >
              <Plus size={14} />
              Top Up
            </button>
          </div>
        </div>

        {/* Purchase History */}
        <div>
          <h3 className="text-body font-semibold text-text-primary mb-3">Recent Orders</h3>
          {(!customer.orders || customer.orders.length === 0) ? (
            <p className="text-small text-text-muted text-center py-6">No purchase history yet</p>
          ) : (
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {customer.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary">
                  <div>
                    <p className="text-body font-medium text-text-primary">{order.order_number}</p>
                    <p className="text-small text-text-muted flex items-center gap-1.5">
                      <Calendar size={11} />
                      {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-body text-accent-primary tabular-nums">{formatCurrencyRaw(order.total)}</p>
                    <p className={cn(
                      'text-tiny uppercase font-semibold',
                      order.status === 'completed' ? 'text-accent-primary' : order.status === 'refunded' ? 'text-accent-danger' : 'text-text-muted'
                    )}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
