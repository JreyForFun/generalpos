import { useState, useEffect } from 'react';
import { UserCog, Plus, Edit2, Key, Shield, ShieldCheck, ShieldX } from 'lucide-react';
import Table from '../components/shared/Table';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/shared/ConfirmModal';
import CustomSelect from '../components/shared/CustomSelect';
import { SkeletonTable } from '../components/shared/Skeleton';
import { useToast } from '../components/shared/Toast';
import { cn } from '../lib/cn';

/**
 * Cashiers page — admin management of cashier accounts.
 * Add, edit, toggle active, assign roles, and change PINs.
 */
export default function Cashiers() {
  const toast = useToast();
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPinChange, setShowPinChange] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [newPin, setNewPin] = useState('');

  // Form state
  const [form, setForm] = useState({ name: '', pin: '', role: 'cashier' });
  const [saving, setSaving] = useState(false);

  const loadCashiers = async () => {
    setLoading(true);
    const result = await window.electronAPI.getCashiers();
    if (result.success) setCashiers(result.data);
    setLoading(false);
  };

  useEffect(() => { loadCashiers(); }, []);

  const handleAdd = () => {
    setEditing(null);
    setForm({ name: '', pin: '', role: 'cashier' });
    setShowForm(true);
  };

  const handleEdit = (cashier) => {
    setEditing(cashier);
    setForm({ name: cashier.name, pin: '', role: cashier.role });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    if (editing) {
      const result = await window.electronAPI.updateCashier(editing.id, {
        name: form.name.trim(),
        role: form.role,
      });
      if (result.success) {
        toast.success('Cashier updated');
        setShowForm(false);
        loadCashiers();
      } else {
        toast.error(result.error || 'Update failed');
      }
    } else {
      if (!form.pin || form.pin.length < 4) {
        toast.warning('PIN must be at least 4 digits');
        setSaving(false);
        return;
      }
      const result = await window.electronAPI.createCashier({
        name: form.name.trim(),
        pin: form.pin,
        role: form.role,
      });
      if (result.success) {
        toast.success('Cashier created');
        setShowForm(false);
        loadCashiers();
      } else {
        toast.error(result.error || 'Create failed');
      }
    }
    setSaving(false);
  };

  const handleToggleActive = async (cashier) => {
    // If currently active, require confirmation for deactivation
    if (cashier.is_active) {
      setDeactivateTarget(cashier);
      return;
    }
    // Activation doesn't need confirmation
    const result = await window.electronAPI.updateCashier(cashier.id, { is_active: 1 });
    if (result.success) {
      toast.success('Cashier activated');
      loadCashiers();
    } else {
      toast.error(result.error);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    const result = await window.electronAPI.updateCashier(deactivateTarget.id, { is_active: 0 });
    if (result.success) {
      toast.success(`${deactivateTarget.name} deactivated`);
      setDeactivateTarget(null);
      loadCashiers();
    } else {
      toast.error(result.error);
    }
  };

  const handleChangePin = async () => {
    if (!newPin || newPin.length < 4) {
      toast.warning('PIN must be at least 4 digits');
      return;
    }
    const result = await window.electronAPI.changePIN(showPinChange.id, newPin);
    if (result.success) {
      toast.success(`PIN changed for ${showPinChange.name}`);
      setShowPinChange(null);
      setNewPin('');
    } else {
      toast.error(result.error || 'Failed to change PIN');
    }
  };

  const roleIcon = (role) => {
    if (role === 'admin') return <ShieldCheck size={14} className="text-accent-danger" />;
    if (role === 'manager') return <Shield size={14} className="text-accent-warning" />;
    return <Shield size={14} className="text-text-muted" />;
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className={cn('text-body font-medium', row.is_active ? 'text-text-primary' : 'text-text-muted line-through')}>{val}</span>
          {!row.is_active && <span className="text-tiny text-accent-danger font-semibold uppercase">Inactive</span>}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <div className="flex items-center gap-1.5">
          {roleIcon(val)}
          <span className="text-body text-text-secondary capitalize">{val}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (val) => (
        <span className="text-small text-text-muted">
          {new Date(val).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-bg-hover transition-colors" title="Edit">
            <Edit2 size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowPinChange(row); setNewPin(''); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-warning hover:bg-bg-hover transition-colors" title="Change PIN">
            <Key size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleToggleActive(row); }}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              row.is_active ? 'text-text-muted hover:text-accent-danger hover:bg-bg-hover' : 'text-accent-primary hover:bg-bg-hover'
            )} title={row.is_active ? 'Deactivate' : 'Activate'}>
            <ShieldX size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-heading text-h1 text-text-primary">Cashiers</h1>
          <p className="text-small text-text-secondary mt-1">{cashiers.length} accounts</p>
        </div>
        <button onClick={handleAdd}
          className="flex items-center gap-2 px-4 h-11 rounded-lg bg-accent-primary text-text-inverse font-semibold text-body hover:bg-accent-primary-hover transition-colors">
          <Plus size={18} /> Add Cashier
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={4} cols={4} />
        ) : (
          <Table columns={columns} data={cashiers} emptyIcon={<UserCog size={48} />} emptyMessage="No cashiers" />
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Modal isOpen={true} onClose={() => setShowForm(false)} title={editing ? 'Edit Cashier' : 'New Cashier'} size="sm">
          <div className="space-y-4">
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name" autoFocus
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none" />
            </div>
            {!editing && (
              <div>
                <label className="text-small text-text-secondary mb-1.5 block">PIN * (min 4 digits)</label>
                <input type="password" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
                  placeholder="••••" maxLength={8}
                  className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary font-mono tracking-widest placeholder:text-text-muted focus:border-border-focus focus:outline-none" />
              </div>
            )}
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Role</label>
              <CustomSelect
                value={form.role}
                onChange={(v) => setForm((f) => ({ ...f, role: v }))}
                options={[
                  { value: 'cashier', label: 'Cashier' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 h-11 rounded-lg border border-border text-text-secondary font-medium hover:bg-bg-hover transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className={cn('flex-1 h-11 rounded-lg font-semibold transition-all',
                  saving || !form.name.trim() ? 'bg-bg-hover text-text-muted cursor-not-allowed' : 'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover')}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Change PIN Modal */}
      {showPinChange && (
        <Modal isOpen={true} onClose={() => setShowPinChange(null)} title={`Change PIN — ${showPinChange.name}`} size="sm">
          <div className="space-y-4">
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">New PIN (min 4 digits)</label>
              <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChangePin()}
                placeholder="••••" maxLength={8} autoFocus
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary font-mono tracking-widest placeholder:text-text-muted focus:border-border-focus focus:outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPinChange(null)} className="flex-1 h-11 rounded-lg border border-border text-text-secondary font-medium hover:bg-bg-hover transition-colors">Cancel</button>
              <button onClick={handleChangePin} disabled={!newPin || newPin.length < 4}
                className={cn('flex-1 h-11 rounded-lg font-semibold transition-all',
                  !newPin || newPin.length < 4 ? 'bg-bg-hover text-text-muted cursor-not-allowed' : 'bg-accent-warning text-white hover:bg-accent-warning-hover')}>
                Change PIN
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Deactivate Confirmation */}
      <ConfirmModal
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={confirmDeactivate}
        title="Deactivate Cashier"
        message={`Are you sure you want to deactivate ${deactivateTarget?.name}? They will not be able to log in until reactivated.`}
        confirmLabel="Deactivate"
        variant="danger"
      />
    </div>
  );
}
