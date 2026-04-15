import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Calendar, Users, FileDown, Database, PieChart, Clock } from 'lucide-react';
import { useToast } from '../components/shared/Toast';
import { PageLoader } from '../components/shared/Skeleton';
import { cn } from '../lib/cn';
import { formatCurrencyRaw, formatCurrencyShort } from '../lib/formatCurrency';

/**
 * Reports page — daily sales dashboard with stats, payment pie chart,
 * best sellers, SVG line chart, cashier performance, and export.
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

  // Cash flow summary
  const openAmount = cashFlows.find((f) => f.type === 'open')?.amount || 0;
  const cashIn = cashFlows.filter((f) => f.type === 'cash_in').reduce((s, f) => s + f.amount, 0);
  const cashOut = cashFlows.filter((f) => f.type === 'cash_out').reduce((s, f) => s + f.amount, 0);
  const cashSales = salesByMethod.find((m) => m.method === 'cash')?.total || 0;
  const expectedCash = openAmount + cashSales + cashIn - cashOut;

  // Payment method total
  const methodTotal = salesByMethod.reduce((s, m) => s + m.total, 0) || 1;

  // Weekly chart
  const weeklyMax = Math.max(...weeklySales.map((d) => d.total_sales), 1);

  // Average order value
  const avgOrder = dailySales?.total_orders > 0
    ? (dailySales.total_sales / dailySales.total_orders)
    : 0;

  const handleExportPDF = async () => {
    setExporting(true);
    const result = await window.electronAPI.exportReportPDF({
      date, dailySales, salesByMethod, bestSellers, cashFlows, cashierPerformance: cashierPerf,
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

  if (loading && !dailySales) return <PageLoader />;

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-heading text-h1 text-text-primary">Reports</h1>
          <p className="text-small text-text-secondary mt-1">Daily sales dashboard & analytics</p>
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
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 shrink-0">
        <StatCard
          icon={<DollarSign size={20} />}
          iconColor="text-accent-primary"
          label="Total Sales"
          value={formatCurrencyRaw(dailySales?.total_sales || 0)}
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
          label="Avg Order"
          value={formatCurrencyRaw(avgOrder)}
        />
        <StatCard
          icon={<DollarSign size={20} />}
          iconColor="text-accent-primary"
          label="Discounts"
          value={formatCurrencyRaw(dailySales?.total_discounts || 0)}
        />
        <StatCard
          icon={<DollarSign size={20} />}
          iconColor="text-accent-info"
          label="Tips"
          value={formatCurrencyRaw(dailySales?.total_tips || 0)}
        />
      </div>

      {/* 7-Day Sales — SVG Area Chart */}
      <div className="rounded-xl border border-border bg-bg-secondary p-5 shrink-0">
        <h2 className="text-body font-semibold text-text-primary mb-4">Sales — Last 7 Days</h2>
        {weeklySales.length === 0 ? (
          <p className="text-small text-text-muted text-center py-8">No sales data</p>
        ) : (
          <WeeklyAreaChart data={weeklySales} max={weeklyMax} selectedDate={date} />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Payment Method Donut Chart */}
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <h2 className="text-body font-semibold text-text-primary mb-4 flex items-center gap-2">
            <PieChart size={16} /> Payment Breakdown
          </h2>
          {salesByMethod.length === 0 ? (
            <p className="text-small text-text-muted text-center py-8">No sales data</p>
          ) : (
            <DonutChart data={salesByMethod} total={methodTotal} />
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
                    <span className="text-body text-text-primary line-clamp-1">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-small font-semibold text-text-primary tabular-nums">{item.total_qty} sold</p>
                    <p className="text-tiny text-text-muted tabular-nums">{formatCurrencyRaw(item.total_revenue)}</p>
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
                  {formatCurrencyRaw(c.total_sales)}
                </span>
                <span className="text-small text-text-secondary tabular-nums text-right">
                  {formatCurrencyRaw(c.avg_order)}
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
          <div className="grid grid-cols-3 xl:grid-cols-5 gap-4">
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

/* ────────────────── Components ────────────────── */

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
        {negative ? '-' : ''}{formatCurrencyRaw(Math.abs(value))}
      </p>
    </div>
  );
}

/* ────────────────── SVG Area Chart ────────────────── */

function WeeklyAreaChart({ data, max, selectedDate }) {
  const W = 700;
  const H = 180;
  const PAD = { top: 20, right: 20, bottom: 30, left: 10 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const points = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top + chartH - (d.total_sales / max) * chartH,
    ...d,
  }));

  // SVG path for the line
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Area fill path (line + close to bottom)
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${PAD.top + chartH} L ${points[0].x} ${PAD.top + chartH} Z`;

  // Y-axis gridlines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: PAD.top + chartH - pct * chartH,
    label: formatCurrencyShort(max * pct),
  }));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={g.y} x2={W - PAD.right} y2={g.y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 3" />
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaFill)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points + labels */}
        {points.map((p, i) => {
          const isToday = p.date === selectedDate;
          const dayLabel = new Date(p.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short' });
          return (
            <g key={p.date}>
              {/* Data point */}
              <circle cx={p.x} cy={p.y} r={isToday ? 5 : 3.5} fill={isToday ? 'var(--accent-primary)' : 'var(--bg-secondary)'} stroke="var(--accent-primary)" strokeWidth="2" />

              {/* Value above point */}
              {p.total_orders > 0 && (
                <text x={p.x} y={p.y - 12} fill="var(--text-secondary)" fontSize="10" textAnchor="middle" fontFamily="inherit">
                  {formatCurrencyShort(p.total_sales)}
                </text>
              )}

              {/* Day label below */}
              <text x={p.x} y={PAD.top + chartH + 18} fill={isToday ? 'var(--accent-primary)' : 'var(--text-muted)'} fontSize="11" textAnchor="middle" fontWeight={isToday ? 600 : 400} fontFamily="inherit">
                {dayLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ────────────────── Donut Chart ────────────────── */

const METHOD_COLORS = {
  cash: '#10B981',
  ewallet: '#6366F1',
  split: '#F59E0B',
  giftcard: '#EC4899',
};

function DonutChart({ data, total }) {
  const SIZE = 180;
  const RADIUS = 70;
  const INNER = 45;
  const CENTER = SIZE / 2;

  let cumulativeAngle = -90; // start at top

  const slices = data.map((m) => {
    const pct = m.total / total;
    const startAngle = cumulativeAngle;
    const sweepAngle = pct * 360;
    cumulativeAngle += sweepAngle;

    return {
      ...m,
      pct,
      startAngle,
      sweepAngle,
    };
  });

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex items-center gap-8">
      {/* SVG Donut */}
      <div className="relative shrink-0">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {slices.map((s, i) => (
            <path
              key={i}
              d={describeArc(CENTER, CENTER, RADIUS, s.startAngle, s.startAngle + s.sweepAngle - 0.5)}
              fill="none"
              stroke={METHOD_COLORS[s.method] || '#6B7280'}
              strokeWidth={RADIUS - INNER}
              strokeLinecap="round"
              opacity={0.9}
            />
          ))}
          <circle cx={CENTER} cy={CENTER} r={INNER - 2} fill="var(--bg-secondary)" />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-heading text-h3 text-text-primary tabular-nums">{formatCurrencyShort(total)}</p>
          <p className="text-tiny text-text-muted">Total</p>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2.5 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: METHOD_COLORS[s.method] || '#6B7280' }} />
            <div className="flex-1 min-w-0">
              <p className="text-body text-text-primary capitalize">{s.method}</p>
              <p className="text-tiny text-text-muted tabular-nums">
                {formatCurrencyRaw(s.total)} • {s.count} orders • {(s.pct * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
