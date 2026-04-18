import { useState } from 'react';
import Modal from '../shared/Modal';
import CustomSelect from '../shared/CustomSelect';
import { cn } from '../../lib/cn';

/**
 * CustomerForm — modal for adding/editing customers.
 * Fields: name, phone, email, discount type/value/expiry.
 */
export default function CustomerForm({ customer, onSave, onClose }) {
  const isEditing = !!customer;
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    discount_type: customer?.discount_type || '',
    discount_value: customer?.discount_value || '',
    discount_expiry: customer?.discount_expiry || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave({
      ...form,
      name: form.name.trim(),
      discount_value: form.discount_value ? Number(form.discount_value) : 0,
      discount_type: form.discount_type || null,
      discount_expiry: form.discount_expiry || null,
    });
    setSaving(false);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? 'Edit Customer' : 'New Customer'} size="md">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-small text-text-secondary mb-1.5 block">Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Juan Dela Cruz"
            className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
            autoFocus
          />
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-small text-text-secondary mb-1.5 block">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="09XX-XXX-XXXX"
              className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
            />
          </div>
          <div>
            <label className="text-small text-text-secondary mb-1.5 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@example.com"
              className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
            />
          </div>
        </div>

        {/* Discount section */}
        <div className="border-t border-border pt-4 mt-4">
          <p className="text-small text-text-secondary mb-3">Customer Discount (auto-applied at checkout)</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-tiny text-text-muted mb-1 block">Type</label>
              <CustomSelect
                value={form.discount_type}
                onChange={(v) => handleChange('discount_type', v)}
                options={[
                  { value: '', label: 'None' },
                  { value: 'percent', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed (₱)' },
                ]}
                size="sm"
              />
            </div>
            <div>
              <label className="text-tiny text-text-muted mb-1 block">Value</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount_value}
                onChange={(e) => handleChange('discount_value', e.target.value)}
                placeholder="0"
                disabled={!form.discount_type}
                className="w-full h-10 px-2 rounded-lg bg-bg-input border border-border text-small text-text-primary tabular-nums focus:border-border-focus focus:outline-none disabled:opacity-40"
              />
            </div>
            <div>
              <label className="text-tiny text-text-muted mb-1 block">Expiry</label>
              <input
                type="date"
                value={form.discount_expiry}
                onChange={(e) => handleChange('discount_expiry', e.target.value)}
                disabled={!form.discount_type}
                className="w-full h-10 px-2 rounded-lg bg-bg-input border border-border text-small text-text-primary focus:border-border-focus focus:outline-none disabled:opacity-40"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button onClick={onClose} className="px-5 h-11 rounded-lg border border-border text-text-secondary font-medium hover:bg-bg-hover transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            className={cn(
              'px-6 h-11 rounded-lg font-semibold transition-all',
              saving || !form.name.trim()
                ? 'bg-bg-hover text-text-muted cursor-not-allowed'
                : 'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover'
            )}
          >
            {saving ? 'Saving...' : isEditing ? 'Update' : 'Add Customer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
