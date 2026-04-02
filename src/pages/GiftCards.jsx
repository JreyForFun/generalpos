import { useState, useEffect } from 'react';
import { CreditCard, Plus, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import Table from '../components/shared/Table';
import Modal from '../components/shared/Modal';
import { useToast } from '../components/shared/Toast';
import { cn } from '../lib/cn';

/**
 * GiftCards page — create and manage gift cards.
 * Admin can generate codes, set balances and optional expiry dates.
 */
export default function GiftCards() {
  const toast = useToast();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all'); // all | active | expired | depleted

  // Create form
  const [form, setForm] = useState({ code: '', balance: '', expiry_date: '' });
  const [creating, setCreating] = useState(false);

  const loadCards = async () => {
    setLoading(true);
    const result = await window.electronAPI.getGiftCards();
    if (result.success) setCards(result.data);
    setLoading(false);
  };

  useEffect(() => { loadCards(); }, []);

  // Stats
  const activeCount = cards.filter((c) => c.is_active && (!c.expiry_date || new Date(c.expiry_date) >= new Date())).length;
  const expiredCount = cards.filter((c) => c.expiry_date && new Date(c.expiry_date) < new Date()).length;
  const depletedCount = cards.filter((c) => c.balance <= 0 || !c.is_active).length;
  const totalBalance = cards.reduce((sum, c) => sum + (c.is_active ? c.balance : 0), 0);

  // Filter
  const now = new Date();
  const filteredCards = cards.filter((c) => {
    if (filter === 'active') return c.is_active && c.balance > 0 && (!c.expiry_date || new Date(c.expiry_date) >= now);
    if (filter === 'expired') return c.expiry_date && new Date(c.expiry_date) < now;
    if (filter === 'depleted') return c.balance <= 0 || !c.is_active;
    return true;
  });

  const handleCreate = async () => {
    const balance = parseFloat(form.balance);
    if (isNaN(balance) || balance <= 0) {
      toast.warning('Enter a valid balance');
      return;
    }

    setCreating(true);
    const result = await window.electronAPI.createGiftCard({
      code: form.code.trim() || undefined,
      balance,
      expiry_date: form.expiry_date || null,
    });

    if (result.success) {
      toast.success(`Gift card created: ${result.data.code}`);
      setShowCreate(false);
      setForm({ code: '', balance: '', expiry_date: '' });
      loadCards();
    } else {
      toast.error(result.error || 'Failed to create gift card');
    }
    setCreating(false);
  };

  const getStatus = (card) => {
    if (card.balance <= 0 || !card.is_active) return { label: 'Depleted', color: 'text-text-muted', bg: 'bg-bg-hover' };
    if (card.expiry_date && new Date(card.expiry_date) < now) return { label: 'Expired', color: 'text-accent-danger', bg: 'bg-accent-danger/15' };
    return { label: 'Active', color: 'text-accent-primary', bg: 'bg-accent-primary/15' };
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (val) => (
        <span className="font-mono text-body font-semibold text-text-primary tracking-wider">{val}</span>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (val) => (
        <span className={cn(
          'font-heading text-body tabular-nums',
          val > 0 ? 'text-accent-primary' : 'text-text-muted'
        )}>
          ₱{Number(val).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'expiry_date',
      label: 'Expires',
      render: (val) => val ? (
        <span className={cn(
          'text-small',
          new Date(val) < now ? 'text-accent-danger' : 'text-text-secondary'
        )}>
          {new Date(val).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ) : (
        <span className="text-small text-text-muted">No expiry</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const status = getStatus(row);
        return (
          <span className={cn('text-tiny font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full', status.bg, status.color)}>
            {status.label}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (val) => (
        <span className="text-small text-text-muted">
          {new Date(val).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-heading text-h1 text-text-primary">Gift Cards</h1>
          <p className="text-small text-text-secondary mt-1">
            {cards.length} cards • ₱{totalBalance.toFixed(2)} total active balance
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 h-11 rounded-lg bg-accent-primary text-text-inverse font-semibold text-body hover:bg-accent-primary-hover transition-colors"
        >
          <Plus size={18} />
          Create Gift Card
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 shrink-0">
        {[
          { id: 'all', label: `All (${cards.length})` },
          { id: 'active', label: `Active (${activeCount})` },
          { id: 'expired', label: `Expired (${expiredCount})` },
          { id: 'depleted', label: `Depleted (${depletedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              'px-4 h-9 rounded-lg text-small font-semibold transition-all',
              filter === tab.id
                ? 'bg-accent-primary text-text-inverse'
                : 'bg-bg-hover text-text-secondary hover:bg-bg-active hover:text-text-primary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          data={filteredCards}
          emptyIcon={<CreditCard size={48} />}
          emptyMessage={filter === 'all' ? 'No gift cards yet' : `No ${filter} gift cards`}
        />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal isOpen={true} onClose={() => setShowCreate(false)} title="Create Gift Card" size="sm">
          <div className="space-y-4">
            {/* Code */}
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Card Code (auto-generated if blank)</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. GC-HOLIDAY-2026"
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary font-mono placeholder:text-text-muted focus:border-border-focus focus:outline-none"
              />
            </div>

            {/* Balance */}
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Balance (₱) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.balance}
                onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
                placeholder="500.00"
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary tabular-nums placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                autoFocus
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Expiry Date (optional)</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary focus:border-border-focus focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 h-11 rounded-lg border border-border text-text-secondary font-medium hover:bg-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.balance}
                className={cn(
                  'flex-1 h-11 rounded-lg font-semibold transition-all',
                  creating || !form.balance
                    ? 'bg-bg-hover text-text-muted cursor-not-allowed'
                    : 'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover'
                )}
              >
                {creating ? 'Creating...' : 'Create Card'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
