import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store, DollarSign, Receipt, Bell, ImagePlus, X, Info } from 'lucide-react';
import CustomSelect from '../components/shared/CustomSelect';
import { useToast } from '../components/shared/Toast';
import { cn } from '../lib/cn';
import { formatCurrencyRaw } from '../lib/formatCurrency';

/**
 * Settings page — store info, app settings, and cash drawer management.
 */
export default function Settings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store info
  const [store, setStore] = useState({ name: '', address: '', phone: '', email: '', receipt_note: '', currency: 'PHP' });

  // App settings
  const [settings, setSettings] = useState({});

  // Cash drawer
  const [drawerAmount, setDrawerAmount] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [cashType, setCashType] = useState('cash_in');

  const loadData = async () => {
    setLoading(true);
    const [storeRes, settingsRes] = await Promise.all([
      window.electronAPI.getStoreInfo(),
      window.electronAPI.getSettings(),
    ]);
    if (storeRes.success && storeRes.data) setStore(storeRes.data);
    if (settingsRes.success) setSettings(settingsRes.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveStore = async () => {
    setSaving(true);
    const result = await window.electronAPI.updateStoreInfo(store);
    if (result.success) toast.success('Store info saved');
    else toast.error(result.error || 'Save failed');
    setSaving(false);
  };

  const handleSaveSetting = async (key, value) => {
    const result = await window.electronAPI.updateSetting(key, value);
    if (result.success) {
      setSettings((prev) => ({ ...prev, [key]: value }));
      toast.success('Setting saved');
    } else {
      toast.error(result.error || 'Save failed');
    }
  };

  const handleOpenDrawer = async () => {
    const amount = parseFloat(drawerAmount);
    if (isNaN(amount) || amount < 0) return;
    const result = await window.electronAPI.openDrawer(amount);
    if (result.success) {
      toast.success(`Drawer opened with ${formatCurrencyRaw(amount)}`);
      setDrawerAmount('');
    } else {
      toast.error(result.error);
    }
  };

  const handleCashFlow = async () => {
    const amount = parseFloat(drawerAmount);
    if (isNaN(amount) || amount <= 0) return;
    const result = await window.electronAPI.addCashFlow({ type: cashType, amount, note: cashNote });
    if (result.success) {
      toast.success(`${cashType === 'cash_in' ? 'Cash In' : 'Cash Out'}: ${formatCurrencyRaw(amount)}`);
      setDrawerAmount('');
      setCashNote('');
    } else {
      toast.error(result.error);
    }
  };

  const handleCloseDrawer = async () => {
    const amount = parseFloat(drawerAmount);
    if (isNaN(amount) || amount < 0) return;
    const result = await window.electronAPI.closeDrawer({ amount, note: 'End of day' });
    if (result.success) {
      toast.success('Drawer closed');
      setDrawerAmount('');
    } else {
      toast.error(result.error);
    }
  };

  const storeField = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="text-small text-text-secondary mb-1.5 block">{label}</label>
      <input
        type={type}
        value={store[key] || ''}
        onChange={(e) => setStore((s) => ({ ...s, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      <div className="shrink-0">
        <h1 className="font-heading text-h1 text-text-primary">Settings</h1>
        <p className="text-small text-text-secondary mt-1">Store configuration and cash management</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Store Info */}
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <div className="flex items-center gap-2 mb-4">
            <Store size={18} className="text-accent-primary" />
            <h2 className="text-body font-semibold text-text-primary">Store Information</h2>
          </div>
          <div className="space-y-3">
            {storeField('Store Name', 'name', 'text', 'My Store')}
            {storeField('Address', 'address', 'text', '123 Main St')}
            <div className="grid grid-cols-2 gap-3">
              {storeField('Phone', 'phone', 'tel', '09XX-XXX-XXXX')}
              {storeField('Email', 'email', 'email', 'store@email.com')}
            </div>
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Receipt Footer Note</label>
              <textarea
                value={store.receipt_note || ''}
                onChange={(e) => setStore((s) => ({ ...s, receipt_note: e.target.value }))}
                placeholder="Thank you for shopping!"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none resize-none"
              />
            </div>

          {/* Store Logo */}
          <div>
            <label className="text-small text-text-secondary mb-1.5 block">Store Logo</label>
            <div className="flex items-center gap-3">
              {store.logo_path ? (
                <div className="relative w-16 h-16 rounded-lg bg-bg-tertiary overflow-hidden border border-border">
                  <img src={store.logo_path} alt="Store logo" className="w-full h-full object-contain" />
                  <button
                    onClick={() => setStore((s) => ({ ...s, logo_path: '' }))}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-danger text-white flex items-center justify-center hover:bg-accent-danger-hover"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    const result = await window.electronAPI.uploadImage?.();
                    if (result?.success && result.data?.path) {
                      setStore((s) => ({ ...s, logo_path: result.data.path }));
                    }
                  }}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-accent-primary flex items-center justify-center text-text-muted hover:text-accent-primary transition-colors"
                >
                  <ImagePlus size={20} />
                </button>
              )}
              <p className="text-tiny text-text-muted">Shown on receipts &amp; login screen</p>
            </div>
          </div>

            <button
              onClick={handleSaveStore}
              disabled={saving}
              className={cn(
                'flex items-center justify-center gap-2 w-full h-11 rounded-lg font-semibold transition-all',
                saving ? 'bg-bg-hover text-text-muted cursor-not-allowed' : 'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover'
              )}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Store Info'}
            </button>
          </div>
        </div>

        {/* App Settings */}
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon size={18} className="text-accent-secondary" />
            <h2 className="text-body font-semibold text-text-primary">App Settings</h2>
          </div>
          <div className="space-y-4">
            <SettingRow
              label="Loyalty Points per Peso"
              description="Points earned per ₱1 spent"
              value={settings.loyalty_points_per_peso || '1'}
              onChange={(v) => handleSaveSetting('loyalty_points_per_peso', v)}
              type="number"
            />
            <SettingRow
              label="Points Redemption Rate"
              description="₱ per point redeemed (e.g., 0.01 = 1pt = ₱0.01)"
              value={settings.points_redemption_rate || '0.01'}
              onChange={(v) => handleSaveSetting('points_redemption_rate', v)}
              type="number"
            />
            <SettingRow
              label="Rounding Mode"
              description="Currency rounding for totals"
              value={settings.rounding_mode || 'none'}
              onChange={(v) => handleSaveSetting('rounding_mode', v)}
              type="select"
              options={[
                { value: 'none', label: 'None (exact)' },
                { value: 'peso', label: 'Round to peso' },
                { value: 'centavo_5', label: 'Round to 5 centavos' },
              ]}
            />
            <SettingRow
              label="Idle Lock Timeout (seconds)"
              description="Auto-lock after inactivity"
              value={settings.idle_lock_timeout || '300'}
              onChange={(v) => handleSaveSetting('idle_lock_timeout', v)}
              type="number"
            />
            <SettingRow
              label="Low Stock Threshold"
              description="Global default alert threshold"
              value={settings.low_stock_default || '5'}
              onChange={(v) => handleSaveSetting('low_stock_default', v)}
              type="number"
            />
          </div>
        </div>
      </div>

      {/* Cash Drawer Management */}
      <div className="rounded-xl border border-border bg-bg-secondary p-5 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign size={18} className="text-accent-warning" />
          <h2 className="text-body font-semibold text-text-primary">Cash Drawer</h2>
        </div>
        <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-lg bg-accent-info/5 border border-accent-info/20">
          <Info size={14} className="text-accent-info shrink-0 mt-0.5" />
          <p className="text-tiny text-text-secondary leading-relaxed">
            Track physical cash in the register. <strong>Open</strong> at shift start with your float amount. 
            Use <strong>Cash In / Cash Out</strong> for mid-shift adjustments (petty cash, change runs). 
            <strong>Close</strong> at shift end — the Reports page shows expected vs actual cash.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2 space-y-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={drawerAmount}
              onChange={(e) => setDrawerAmount(e.target.value)}
              placeholder="Amount (₱)"
              className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary tabular-nums placeholder:text-text-muted focus:border-border-focus focus:outline-none"
            />
            <input
              type="text"
              value={cashNote}
              onChange={(e) => setCashNote(e.target.value)}
              placeholder="Note (optional)"
              className="w-full h-10 px-3 rounded-lg bg-bg-input border border-border text-small text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <button onClick={handleOpenDrawer}
              className="w-full h-11 rounded-lg bg-accent-primary text-text-inverse font-semibold text-small hover:bg-accent-primary-hover transition-colors">
              Open Drawer
            </button>
            <button onClick={handleCloseDrawer}
              className="w-full h-10 rounded-lg border border-accent-danger text-accent-danger font-semibold text-small hover:bg-accent-danger/10 transition-colors">
              Close Drawer
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <button onClick={() => { setCashType('cash_in'); handleCashFlow(); }}
                className="flex-1 h-11 rounded-lg bg-accent-primary/15 text-accent-primary font-semibold text-small hover:bg-accent-primary/25 transition-colors">
                Cash In
              </button>
              <button onClick={() => { setCashType('cash_out'); handleCashFlow(); }}
                className="flex-1 h-11 rounded-lg bg-accent-danger/15 text-accent-danger font-semibold text-small hover:bg-accent-danger/25 transition-colors">
                Cash Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Individual setting row with inline edit */
function SettingRow({ label, description, value, onChange, type = 'text', options }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  const handleSave = () => {
    if (localValue !== value) onChange(localValue);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-body text-text-primary">{label}</p>
        <p className="text-tiny text-text-muted">{description}</p>
      </div>
      {type === 'select' ? (
        <CustomSelect
          value={localValue}
          onChange={(v) => { setLocalValue(v); onChange(v); }}
          options={options || []}
          size="sm"
          className="w-40 shrink-0"
        />
      ) : (
        <input
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="w-24 h-9 px-2 rounded-lg bg-bg-input border border-border text-small text-text-primary text-right tabular-nums focus:border-border-focus focus:outline-none shrink-0"
        />
      )}
    </div>
  );
}
