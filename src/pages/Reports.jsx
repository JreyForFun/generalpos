import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Calendar, Users, FileDown, Database } from 'lucide-react';
import { useToast } from '../components/shared/Toast';
import { cn } from '../lib/cn';

/**
 * Reports page — daily sales dashboard with stats, payment breakdown,
 * best sellers, 7-day chart, cashier performance, and export.
 */
export default function Reports() {
  const toast = useToast();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailySales, setDailySales] = useState(null);
  const [salesByMethod, setSalesByMethod] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [cashierPerf, setCashierPerf] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    const [salesRes, methodRes, sellersRes, cashRes, weeklyRes, perfRes] = await Promise.all([
      window.electronAPI.getDailySales(date),
      window.electronAPI.getSalesByMethod(date),
      window.electronAPI.getBestSellers(date),
      window.electronAPI.getCashFlows({ date }),
      window.electronAPI.getWeeklySales(date),
      window.electronAPI.getCashierPerformance(date),
    ]);

    if (salesRes.success) setDailySales(salesRes.data);
    if (methodRes.success) setSalesByMethod(methodRes.data);
    if (sellersRes.success) setBestSellers(sellersRes.data);
    if (cashRes.success) setCashFlows(cashRes.data);
    if (weeklyRes.success) setWeeklySales(weeklyRes.data);
    if (perfRes.success) setCashierPerf(perfRes.data);
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

  // Weekly chart max for scaling
  const weeklyMax = Math.max(...weeklySales.map((d) => d.total_sales), 1);

  const handleExportPDF = async () => {
    setExporting(true);
    const result = await window.electronAPI.exportReportPDF({
      date,
      dailySales,
      salesByMethod,
      bestSellers,
      cashFlows,
      cashierPerformance: cashierPerf,
    });
    if (result.success) {
      toast.success('Report exported!', result.data.path);
    } else {
      toast.error(result.error || 'Export failed');
    }
    setExporting(false);
  };

  const handleBackup = async () => {
    const result = await window.electronAPI.exportBackup();
    if (result.success) {
      toast.success('Backup exported!', result.data.path);
    } else if (result.error !== 'Export cancelled') {
      toast.error(result.error || 'Backup failed');
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-heading text-h1 text-text-primary">Reports</h1>
          <p className="text-small text-text-secondary mt-1">Daily sales dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackup}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border text-small text-text-secondary hover:bg-bg-hover transition-colors"
            title="Export database backup"
          >
            <Database size={14} /> Backup
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className={cn(
              'flex items-center gap-1.5 px-3 h-9 rounded-lg text-small font-medium transition-colors',
              exporting
                ? 'bg-bg-hover text-text-muted cursor-not-allowed'
                : 'bg-accent-secondary text-white hover:bg-accent-secondary-hover'
            )}
          >
            <FileDown size={14} /> {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <Calendar size={14} className="text-text-muted ml-2" />
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

      {/* 7-Day Sales Chart */}
      <div className="rounded-xl border border-border bg-bg-secondary p-5 shrink-0">
        <h2 className="text-body font-semibold text-text-primary mb-4">Sales — Last 7 Days</h2>
        {weeklySales.length === 0 ? (
          <p className="text-small text-text-muted text-center py-8">No sales data</p>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {weeklySales.map((day) => {
              const pct = (day.total_sales / weeklyMax) * 100;
              const isToday = day.date === date;
              const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short' });
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-tiny text-text-muted tabular-nums">
                    {day.total_orders > 0 ? `₱${Number(day.total_sales).toFixed(0)}` : ''}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t-md transition-all duration-500',
                      isToday ? 'bg-accent-primary' : 'bg-accent-primary/30'
                    )}
                    style={{ height: `${Math.max(pct, 2)}%` }}
                    title={`₱${Number(day.total_sales).toFixed(2)} • ${day.total_orders} orders`}
                  />
                  <span className={cn(
                    'text-tiny',
                    isToday ? 'text-accent-primary font-semibold' : 'text-text-muted'
                  )}>
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
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

      {/* Cashier Performance */}
      <div className="rounded-xl border border-border bg-bg-secondary p-5 shrink-0">
        <h2 className="text-body font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Users size={16} /> Cashier Performance
        </h2>
        {cashierPerf.length === 0 ? (
          <p className="text-small text-text-muted text-center py-4">No cashier data</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {/* Header row */}
            <div className="grid grid-cols-4 px-3 py-2 text-tiny text-text-muted uppercase tracking-wider">
              <span>Cashier</span>
              <span className="text-right">Orders</span>
              <span className="text-right">Total Sales</span>
              <span className="text-right">Avg Order</span>
            </div>
            {cashierPerf.map((c) => (
              <div key={c.id} className="grid grid-cols-4 items-center px-3 py-2.5 rounded-lg bg-bg-tertiary">
                <span className="text-body text-text-primary font-medium">{c.name}</span>
                <span className="text-body text-text-primary tabular-nums text-right">{c.total_orders}</span>
                <span className="text-body font-semibold text-accent-primary tabular-nums text-right">
                  ₱{Number(c.total_sales).toFixed(2)}
                </span>
                <span className="text-small text-text-secondary tabular-nums text-right">
                  ₱{Number(c.avg_order).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
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
