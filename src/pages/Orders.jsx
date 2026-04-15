import { useState, useEffect } from 'react';
import { ClipboardList, Eye, RotateCcw, Calendar, Search, Filter } from 'lucide-react';
import Table from '../components/shared/Table';
import SearchBar from '../components/shared/SearchBar';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/shared/ConfirmModal';
import CustomSelect from '../components/shared/CustomSelect';
import { SkeletonTable } from '../components/shared/Skeleton';
import { useToast } from '../components/shared/Toast';
import { cn } from '../lib/cn';
import { formatCurrencyRaw } from '../lib/formatCurrency';

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
  const [customers, setCustomers] = useState([]);
  const [customerFilter, setCustomerFilter] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    const filters = {};
    if (dateFilter) filters.date = dateFilter;
    if (statusFilter) filters.status = statusFilter;
    if (cashierFilter) filters.cashierId = Number(cashierFilter);
    if (customerFilter) filters.customerId = Number(customerFilter);

    const result = await window.electronAPI.getOrders(filters);
    if (result.success) setOrders(result.data);
    setLoading(false);
  };

  const loadCashiers = async () => {
    const result = await window.electronAPI.getCashiers?.();
    if (result?.success) setCashiers(result.data);
  };

  const loadCustomers = async () => {
    const result = await window.electronAPI.getCustomers?.({});
    if (result?.success) setCustomers(result.data);
  };

  useEffect(() => { loadCashiers(); loadCustomers(); }, []);
  useEffect(() => { loadOrders(); }, [dateFilter, statusFilter, cashierFilter, customerFilter]);

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
        <span className="font-heading text-body text-accent-primary tabular-nums">{formatCurrencyRaw(val)}</span>
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
            {completedOrders.length} orders • {formatCurrencyRaw(totalSales)} total sales
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
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'All Status' },
            { value: 'completed', label: 'Completed' },
            { value: 'refunded', label: 'Refunded' },
            { value: 'held', label: 'Held' },
          ]}
          size="sm"
          className="w-36"
        />
        {cashiers.length > 0 && (
          <CustomSelect
            value={cashierFilter}
            onChange={setCashierFilter}
            options={[
              { value: '', label: 'All Cashiers' },
              ...cashiers.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
            size="sm"
            className="w-40"
          />
        )}
        {customers.length > 0 && (
          <CustomSelect
            value={customerFilter}
            onChange={setCustomerFilter}
            options={[
              { value: '', label: 'All Customers' },
              ...customers.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
            size="sm"
            className="w-40"
          />
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={6} cols={7} />
        ) : (
          <Table
            columns={columns}
            data={orders}
            emptyIcon={<ClipboardList size={48} />}
            emptyMessage="No orders found"
            onRowClick={handleViewOrder}
          />
        )}
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

            {/* Customer / Cashier info */}
            <div className="flex items-center gap-4 text-small">
              {selectedOrder.cashier_name && (
                <span className="text-text-secondary">Cashier: <span className="text-text-primary font-medium">{selectedOrder.cashier_name}</span></span>
              )}
              {selectedOrder.customer_name && (
                <span className="text-text-secondary">Customer: <span className="text-text-primary font-medium">{selectedOrder.customer_name}</span></span>
              )}
            </div>

            {/* Items — detailed table */}
            <div>
              <h3 className="text-small font-semibold text-text-secondary mb-2">
                Items ({selectedOrder.items?.length || 0})
              </h3>
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-tiny text-text-muted uppercase tracking-wider">
                <span className="col-span-5">Product</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-1 text-center">Qty</span>
                <span className="col-span-2 text-right">Discount</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              <div className="space-y-1">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center py-2.5 px-3 rounded-lg bg-bg-tertiary">
                    <span className="col-span-5 text-body text-text-primary font-medium line-clamp-2">{item.name}</span>
                    <span className="col-span-2 text-body text-text-secondary tabular-nums text-right">{formatCurrencyRaw(item.price)}</span>
                    <span className="col-span-1 text-body text-text-primary text-center font-semibold">{item.quantity}</span>
                    <span className="col-span-2 text-body tabular-nums text-right">
                      {item.discount > 0 ? (
                        <span className="text-accent-primary">-{formatCurrencyRaw(item.discount)}</span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </span>
                    <span className="col-span-2 text-body font-semibold text-text-primary tabular-nums text-right">{formatCurrencyRaw(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            {selectedOrder.notes && (
              <div className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border">
                <p className="text-tiny text-text-muted uppercase tracking-wider mb-1">Notes</p>
                <p className="text-small text-text-primary">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-1.5">
              <div className="flex justify-between text-body">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary tabular-nums">{formatCurrencyRaw(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-body">
                  <span className="text-text-secondary">Discount</span>
                  <span className="text-accent-primary tabular-nums">-{formatCurrencyRaw(selectedOrder.discount_amount)}</span>
                </div>
              )}
              {selectedOrder.tip_amount > 0 && (
                <div className="flex justify-between text-body">
                  <span className="text-text-secondary">Tip</span>
                  <span className="text-text-primary tabular-nums">+{formatCurrencyRaw(selectedOrder.tip_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-body font-semibold border-t border-border pt-2">
                <span className="text-text-primary">Total</span>
                <span className="font-heading text-h3 text-accent-primary tabular-nums">{formatCurrencyRaw(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Payments */}
            {selectedOrder.payments?.length > 0 && (
              <div>
                <h3 className="text-small font-semibold text-text-secondary mb-2">Payments</h3>
                {selectedOrder.payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-tertiary mb-1">
                    <span className="text-body text-text-primary capitalize">{p.method}</span>
                    <span className="text-body text-text-primary tabular-nums">{formatCurrencyRaw(p.amount)}</span>
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
        message={`Refund order ${refundTarget?.order_number} for ${formatCurrencyRaw(refundTarget?.total)}? Stock will be restored.`}
        confirmText="Refund"
        variant="danger"
      />
    </div>
  );
}
