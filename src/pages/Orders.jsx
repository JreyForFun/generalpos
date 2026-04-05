import { useState, useEffect } from 'react';
import { ClipboardList, Eye, RotateCcw, Calendar, Search, Filter } from 'lucide-react';
import Table from '../components/shared/Table';
import SearchBar from '../components/shared/SearchBar';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/shared/ConfirmModal';
import { useToast } from '../components/shared/Toast';
import { cn } from '../lib/cn';

/**
 * Orders page — order history with filters, detail view, and refund.
 */
export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);

  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState('');
  const [cashiers, setCashiers] = useState([]);
  const [cashierFilter, setCashierFilter] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    const filters = {};
    if (dateFilter) filters.date = dateFilter;
    if (statusFilter) filters.status = statusFilter;
    if (cashierFilter) filters.cashierId = Number(cashierFilter);

    const result = await window.electronAPI.getOrders(filters);
    if (result.success) setOrders(result.data);
    setLoading(false);
  };

  const loadCashiers = async () => {
    const result = await window.electronAPI.getCashiers?.();
    if (result?.success) setCashiers(result.data);
  };

  useEffect(() => { loadCashiers(); }, []);
  useEffect(() => { loadOrders(); }, [dateFilter, statusFilter, cashierFilter]);

  const handleViewOrder = async (order) => {
    const result = await window.electronAPI.getOrder(order.id);
    if (result.success) setSelectedOrder(result.data);
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    const result = await window.electronAPI.refundOrder(refundTarget.id);
    if (result.success) {
      toast.success(`Order ${refundTarget.order_number} refunded`);
      setRefundTarget(null);
      setSelectedOrder(null);
      loadOrders();
    } else {
      toast.error(result.error || 'Refund failed');
    }
  };

  // Stats
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);

  const columns = [
    {
      key: 'order_number',
      label: 'Order #',
      render: (val) => <span className="font-mono text-body font-semibold text-text-primary">{val}</span>,
    },
    {
      key: 'cashier_name',
      label: 'Cashier',
      render: (val) => <span className="text-body text-text-secondary">{val || '—'}</span>,
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (val) => <span className="text-body text-text-secondary">{val || '—'}</span>,
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (val) => (
        <span className="font-heading text-body text-accent-primary tabular-nums">₱{Number(val).toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const colors = {
          completed: 'text-accent-primary bg-accent-primary/15',
          refunded: 'text-accent-danger bg-accent-danger/15',
          held: 'text-accent-warning bg-accent-warning/15',
        };
        return (
          <span className={cn('text-tiny font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full', colors[val] || 'text-text-muted bg-bg-hover')}>
            {val}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Time',
      render: (val) => (
        <span className="text-small text-text-muted">
          {new Date(val).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); handleViewOrder(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-bg-hover transition-colors" title="View">
            <Eye size={14} />
          </button>
          {row.status === 'completed' && (
            <button onClick={(e) => { e.stopPropagation(); setRefundTarget(row); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-danger hover:bg-bg-hover transition-colors" title="Refund">
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-heading text-h1 text-text-primary">Orders</h1>
          <p className="text-small text-text-secondary mt-1">
            {completedOrders.length} orders • ₱{totalSales.toFixed(2)} total sales
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-text-muted" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-bg-input border border-border text-small text-text-primary focus:border-border-focus focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-bg-input border border-border text-small text-text-primary focus:border-border-focus focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="held">Held</option>
        </select>
        {cashiers.length > 0 && (
          <select
            value={cashierFilter}
            onChange={(e) => setCashierFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-bg-input border border-border text-small text-text-primary focus:border-border-focus focus:outline-none"
          >
            <option value="">All Cashiers</option>
            {cashiers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          data={orders}
          emptyIcon={<ClipboardList size={48} />}
          emptyMessage="No orders found"
          onRowClick={handleViewOrder}
        />
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal isOpen={true} onClose={() => setSelectedOrder(null)} title={`Order ${selectedOrder.order_number}`} size="lg">
          <div className="space-y-5">
            {/* Status + meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  'text-tiny font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                  selectedOrder.status === 'completed' ? 'text-accent-primary bg-accent-primary/15' : 'text-accent-danger bg-accent-danger/15'
                )}>
                  {selectedOrder.status}
                </span>
                <span className="text-small text-text-muted">
                  {new Date(selectedOrder.created_at).toLocaleString('en-PH')}
                </span>
              </div>
              {selectedOrder.status === 'completed' && (
                <button
                  onClick={() => setRefundTarget(selectedOrder)}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-accent-danger/30 text-small text-accent-danger hover:bg-accent-danger/10 transition-colors"
                >
                  <RotateCcw size={13} /> Refund
                </button>
              )}
            </div>

            {/* Items */}
            <div>
              <h3 className="text-small font-semibold text-text-secondary mb-2">Items</h3>
              <div className="space-y-1.5">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-tertiary">
                    <div>
                      <span className="text-body text-text-primary">{item.name}</span>
                      <span className="text-small text-text-muted ml-2">×{item.quantity}</span>
                    </div>
                    <span className="text-body font-semibold text-text-primary tabular-nums">₱{Number(item.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-1.5">
              <div className="flex justify-between text-body">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary tabular-nums">₱{Number(selectedOrder.subtotal).toFixed(2)}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-body">
                  <span className="text-text-secondary">Discount</span>
                  <span className="text-accent-primary tabular-nums">-₱{Number(selectedOrder.discount_amount).toFixed(2)}</span>
                </div>
              )}
              {selectedOrder.tip_amount > 0 && (
                <div className="flex justify-between text-body">
                  <span className="text-text-secondary">Tip</span>
                  <span className="text-text-primary tabular-nums">+₱{Number(selectedOrder.tip_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-body font-semibold border-t border-border pt-2">
                <span className="text-text-primary">Total</span>
                <span className="font-heading text-h3 text-accent-primary tabular-nums">₱{Number(selectedOrder.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Payments */}
            {selectedOrder.payments?.length > 0 && (
              <div>
                <h3 className="text-small font-semibold text-text-secondary mb-2">Payments</h3>
                {selectedOrder.payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-tertiary mb-1">
                    <span className="text-body text-text-primary capitalize">{p.method}</span>
                    <span className="text-body text-text-primary tabular-nums">₱{Number(p.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Refund Confirmation */}
      <ConfirmModal
        isOpen={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={handleRefund}
        title="Refund Order"
        message={`Refund order ${refundTarget?.order_number} for ₱${Number(refundTarget?.total || 0).toFixed(2)}? Stock will be restored.`}
        confirmText="Refund"
        variant="danger"
      />
    </div>
  );
}
