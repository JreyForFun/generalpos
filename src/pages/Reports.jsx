import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Calendar, Users } from 'lucide-react';
import { useToast } from '../components/shared/Toast';
import { cn } from '../lib/cn';

/**
 * Reports page — daily sales dashboard with stats, payment breakdown,
 * best sellers, and cashier performance.
 */
export default function Reports() {
  const toast = useToast();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailySales, setDailySales] = useState(null);
  const [salesByMethod, setSalesByMethod] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    const [salesRes, methodRes, sellersRes, cashRes] = await Promise.all([
      window.electronAPI.getDailySales(date),
      window.electronAPI.getSalesByMethod(date),
      window.electronAPI.getBestSellers(date),
      window.electronAPI.getCashFlows({ date }),
    ]);

    if (salesRes.success) setDailySales(salesRes.data);
    if (methodRes.success) setSalesByMethod(methodRes.data);
    if (sellersRes.success) setBestSellers(sellersRes.data);
    if (cashRes.success) setCashFlows(cashRes.data);
    setLoading(false);
  };

  useEffect(() => { loadReports(); }, [date]);

  // Calculate cash flow summary
  const openAmount = cashFlows.find((f) => f.type === 'open')?.amount || 0;
  const cashIn = cashFlows.filter((f) => f.type === 'cash_in').reduce((s, f) => s + f.amount, 0);
  const cashOut = cashFlows.filter((f) => f.type === 'cash_out').reduce((s, f) => s + f.amount, 0);
  const cashSales = salesByMethod.find((m) => m.method === 'cash')?.total || 0;
  const expectedCash = openAmount + cashSales + cashIn - cashOut;

  // Payment method total for bar chart
  const methodTotal = salesByMethod.reduce((s, m) => s + m.total, 0) || 1;

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-heading text-h1 text-text-primary">Reports</h1>
          <p className="text-small text-text-secondary mt-1">Daily sales dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-text-muted" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 px-3 rounded-lg bg-bg-input border border-border text-small text-text-primary focus:border-border-focus focus:outline-none"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <StatCard
          icon={<DollarSign size={20} />}
          iconColor="text-accent-primary"
          label="Total Sales"
          value={`₱${Number(dailySales?.total_sales || 0).toFixed(2)}`}
        />
        <StatCard
          icon={<BarChart3 size={20} />}
          iconColor="text-accent-secondary"
          label="Orders"
          value={dailySales?.total_orders || 0}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          iconColor="text-accent-warning"
          label="Discounts Given"
          value={`₱${Number(dailySales?.total_discounts || 0).toFixed(2)}`}
        />
        <StatCard
          icon={<DollarSign size={20} />}
          iconColor="text-accent-primary"
          label="Tips"
          value={`₱${Number(dailySales?.total_tips || 0).toFixed(2)}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Sales by Payment Method */}
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <h2 className="text-body font-semibold text-text-primary mb-4">Sales by Payment Method</h2>
          {salesByMethod.length === 0 ? (
            <p className="text-small text-text-muted text-center py-8">No sales data</p>
          ) : (
            <div className="space-y-3">
              {salesByMethod.map((m) => {
                const pct = (m.total / methodTotal) * 100;
                return (
                  <div key={m.method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-small text-text-primary capitalize">{m.method}</span>
                      <span className="text-small text-text-secondary tabular-nums">
                        ₱{Number(m.total).toFixed(2)} ({m.count})
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Best Sellers */}
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <h2 className="text-body font-semibold text-text-primary mb-4">Best Selling Products</h2>
          {bestSellers.length === 0 ? (
            <p className="text-small text-text-muted text-center py-8">No sales data</p>
          ) : (
            <div className="space-y-2">
              {bestSellers.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-tertiary">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-tiny font-bold shrink-0',
                      i === 0 ? 'bg-accent-warning text-white' : i === 1 ? 'bg-text-muted/30 text-text-primary' : 'bg-bg-hover text-text-muted'
                    )}>
                      {i + 1}
                    </span>
                    <span className="text-body text-text-primary truncate">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-small font-semibold text-text-primary tabular-nums">{item.total_qty} sold</p>
                    <p className="text-tiny text-text-muted tabular-nums">₱{Number(item.total_revenue).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div className="rounded-xl border border-border bg-bg-secondary p-5 shrink-0">
        <h2 className="text-body font-semibold text-text-primary mb-4">Cash Flow Summary</h2>
        {cashFlows.length === 0 ? (
          <p className="text-small text-text-muted text-center py-4">No cash flow entries for this date</p>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            <CashFlowCard label="Opening" value={openAmount} />
            <CashFlowCard label="Cash Sales" value={cashSales} positive />
            <CashFlowCard label="Cash In" value={cashIn} positive />
            <CashFlowCard label="Cash Out" value={cashOut} negative />
            <CashFlowCard label="Expected" value={expectedCash} highlight />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, iconColor, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4">
      <div className={cn('mb-2', iconColor)}>{icon}</div>
      <p className="font-heading text-h2 text-text-primary tabular-nums">{value}</p>
      <p className="text-tiny text-text-muted uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function CashFlowCard({ label, value, positive, negative, highlight }) {
  return (
    <div className={cn('rounded-lg p-3 text-center', highlight ? 'bg-accent-primary/10 border border-accent-primary/30' : 'bg-bg-tertiary')}>
      <p className="text-tiny text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={cn(
        'font-heading text-h3 tabular-nums',
        highlight ? 'text-accent-primary' : positive ? 'text-accent-primary' : negative ? 'text-accent-danger' : 'text-text-primary'
      )}>
        {negative ? '-' : ''}₱{Math.abs(value).toFixed(2)}
      </p>
    </div>
  );
}
