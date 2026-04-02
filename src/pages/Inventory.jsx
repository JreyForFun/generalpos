import { useState, useEffect } from 'react';
import { Boxes, Plus, Minus, AlertTriangle, Package, ArrowUpDown } from 'lucide-react';
import Table from '../components/shared/Table';
import SearchBar from '../components/shared/SearchBar';
import Modal from '../components/shared/Modal';
import { useToast } from '../components/shared/Toast';
import { cn } from '../lib/cn';

/**
 * Inventory page — stock levels and manual adjustments.
 * Shows all products with stock, low stock alerts, and adjust stock modal.
 */
export default function Inventory() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | low | out
  const [loading, setLoading] = useState(true);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState('add'); // add | remove

  const loadProducts = async () => {
    setLoading(true);
    const result = await window.electronAPI.getProducts();
    if (result.success) setProducts(result.data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Count stats
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.low_stock_alert).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  // Filter
  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (filter === 'low') return matchesSearch && p.stock > 0 && p.stock <= p.low_stock_alert;
    if (filter === 'out') return matchesSearch && p.stock <= 0;
    return matchesSearch;
  });

  const handleAdjust = async () => {
    if (!adjustTarget || !adjustQty) return;
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.warning('Enter a valid quantity');
      return;
    }

    const finalQty = adjustType === 'remove' ? -qty : qty;
    const result = await window.electronAPI.adjustStock(adjustTarget.id, {
      quantity: finalQty,
      reason: adjustReason || (adjustType === 'add' ? 'Manual stock addition' : 'Manual stock removal'),
    });

    if (result.success) {
      toast.success(
        `${adjustType === 'add' ? 'Added' : 'Removed'} ${qty} units of "${adjustTarget.name}"`
      );
      setAdjustTarget(null);
      setAdjustQty('');
      setAdjustReason('');
      loadProducts();
    } else {
      toast.error(result.error || 'Stock adjustment failed');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-bg-tertiary flex items-center justify-center shrink-0">
            <Package size={14} className="text-text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-body font-medium text-text-primary truncate">{row.name}</p>
            <p className="text-small text-text-muted">{row.category_name || 'Uncategorized'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (val) => (
        <span className="font-heading text-body text-text-primary tabular-nums">
          ₱{Number(val).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'stock',
      label: 'Current Stock',
      render: (val, row) => {
        const isLow = val > 0 && val <= row.low_stock_alert;
        const isOut = val <= 0;
        return (
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-h3 font-heading tabular-nums',
              isOut ? 'text-accent-danger' : isLow ? 'text-accent-warning' : 'text-text-primary'
            )}>
              {val}
            </span>
            {isOut && (
              <span className="text-tiny px-1.5 py-0.5 rounded-full bg-accent-danger/15 text-accent-danger uppercase font-semibold">
                Out
              </span>
            )}
            {isLow && (
              <span className="text-tiny px-1.5 py-0.5 rounded-full bg-accent-warning/15 text-accent-warning uppercase font-semibold">
                Low
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'low_stock_alert',
      label: 'Alert At',
      render: (val) => (
        <span className="text-body text-text-muted tabular-nums">≤ {val}</span>
      ),
    },
    {
      key: 'adjust',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setAdjustTarget(row); }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-bg-hover text-text-secondary text-small font-medium hover:bg-bg-active hover:text-text-primary transition-colors"
        >
          <ArrowUpDown size={12} />
          Adjust
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header + Stats */}
      <div className="shrink-0">
        <h1 className="font-heading text-h1 text-text-primary">Inventory</h1>
        <p className="text-small text-text-secondary mt-1">Stock levels and adjustments</p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4">
          <StatCard
            label="Total Products"
            value={totalProducts}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <StatCard
            label="Low Stock"
            value={lowStockCount}
            color="warning"
            active={filter === 'low'}
            onClick={() => setFilter('low')}
          />
          <StatCard
            label="Out of Stock"
            value={outOfStockCount}
            color="danger"
            active={filter === 'out'}
            onClick={() => setFilter('out')}
          />
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search inventory..."
        className="shrink-0"
      />

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          data={filteredProducts}
          emptyIcon={<Boxes size={48} />}
          emptyMessage={filter === 'low' ? 'No low stock items' : filter === 'out' ? 'No out of stock items' : 'No products found'}
        />
      </div>

      {/* Stock Adjustment Modal */}
      {adjustTarget && (
        <Modal
          isOpen={true}
          onClose={() => { setAdjustTarget(null); setAdjustQty(''); setAdjustReason(''); }}
          title="Adjust Stock"
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center py-3 rounded-lg bg-bg-primary border border-border">
              <p className="text-small text-text-muted">Current Stock</p>
              <p className="font-heading text-display text-text-primary tabular-nums">
                {adjustTarget.stock}
              </p>
              <p className="text-body text-text-secondary mt-1">{adjustTarget.name}</p>
            </div>

            {/* Type toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setAdjustType('add')}
                className={cn(
                  'flex-1 h-11 rounded-lg font-semibold text-body flex items-center justify-center gap-2 transition-colors',
                  adjustType === 'add'
                    ? 'bg-accent-primary text-text-inverse'
                    : 'bg-bg-hover text-text-secondary hover:bg-bg-active'
                )}
              >
                <Plus size={16} /> Add Stock
              </button>
              <button
                onClick={() => setAdjustType('remove')}
                className={cn(
                  'flex-1 h-11 rounded-lg font-semibold text-body flex items-center justify-center gap-2 transition-colors',
                  adjustType === 'remove'
                    ? 'bg-accent-danger text-white'
                    : 'bg-bg-hover text-text-secondary hover:bg-bg-active'
                )}
              >
                <Minus size={16} /> Remove Stock
              </button>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Quantity</label>
              <input
                type="number"
                min="1"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdjust()}
                placeholder="0"
                className="w-full h-12 px-4 rounded-lg bg-bg-input border border-border text-h2 font-heading text-text-primary tabular-nums text-center focus:border-border-focus focus:outline-none"
                autoFocus
              />
            </div>

            {/* Reason */}
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Reason (optional)</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Delivery received, Damaged goods"
                className="w-full h-10 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
              />
            </div>

            {/* Preview */}
            {adjustQty && (
              <div className="text-center py-2 text-small text-text-secondary">
                New stock: <span className="font-heading text-h3 text-text-primary">
                  {adjustTarget.stock + (adjustType === 'add' ? Number(adjustQty) : -Number(adjustQty))}
                </span>
              </div>
            )}

            {/* Action */}
            <button
              onClick={handleAdjust}
              disabled={!adjustQty || Number(adjustQty) <= 0}
              className={cn(
                'w-full h-12 rounded-lg font-semibold text-body transition-all',
                !adjustQty || Number(adjustQty) <= 0
                  ? 'bg-bg-hover text-text-muted cursor-not-allowed'
                  : adjustType === 'add'
                    ? 'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover'
                    : 'bg-accent-danger text-white hover:bg-accent-danger-hover'
              )}
            >
              {adjustType === 'add' ? 'Add' : 'Remove'} {adjustQty || 0} units
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Compact stat card for filtering */
function StatCard({ label, value, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 px-4 py-3 rounded-xl border transition-all text-left',
        active
          ? 'border-accent-primary bg-accent-primary/5'
          : 'border-border bg-bg-secondary hover:border-border-hover'
      )}
    >
      <p className="text-tiny text-text-muted uppercase tracking-wider">{label}</p>
      <p className={cn(
        'font-heading text-h1 tabular-nums mt-1',
        color === 'danger' ? 'text-accent-danger'
          : color === 'warning' ? 'text-accent-warning'
          : 'text-text-primary'
      )}>
        {value}
      </p>
    </button>
  );
}
