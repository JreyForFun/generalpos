import { useState } from 'react';
import { Plus, X, Barcode, Upload, Image as ImageIcon } from 'lucide-react';
import Modal from '../shared/Modal';
import { cn } from '../../lib/cn';

/**
 * ProductForm — modal form for creating/editing products.
 * Includes variant management and barcode assignment.
 */
export default function ProductForm({ product, categories, onSave, onClose }) {
  const isEditing = !!product;

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || '',
    price: product?.price || '',
    cost: product?.cost || '',
    stock: product?.stock ?? 0,
    low_stock_alert: product?.low_stock_alert ?? 5,
    is_available: product?.is_available ?? true,
    image_path: product?.image_path || '',
  });

  const [variants, setVariants] = useState(product?.variants || []);
  const [barcodes, setBarcodes] = useState(product?.barcodes?.map((b) => b.barcode) || []);
  const [newBarcode, setNewBarcode] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      { id: null, name: '', sku: '', price: '', stock: 0, is_available: true },
    ]);
  };

  const handleUpdateVariant = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleRemoveVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddBarcode = () => {
    const code = newBarcode.trim();
    if (code && !barcodes.includes(code)) {
      setBarcodes((prev) => [...prev, code]);
      setNewBarcode('');
    }
  };

  const handleRemoveBarcode = (index) => {
    setBarcodes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (!form.price || Number(form.price) <= 0) return;

    setSaving(true);
    await onSave({
      ...form,
      price: Number(form.price),
      cost: Number(form.cost) || 0,
      stock: Number(form.stock),
      low_stock_alert: Number(form.low_stock_alert),
      category_id: form.category_id ? Number(form.category_id) : null,
      variants,
      barcodes,
    });
    setSaving(false);
  };

  const handleImageUpload = async () => {
    const result = await window.electronAPI?.uploadImage();
    if (result?.success) {
      handleChange('image_path', result.data.path);
    }
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'variants', label: `Variants (${variants.length})` },
    { id: 'barcodes', label: `Barcodes (${barcodes.length})` },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'New Product'}
      size="lg"
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-body font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-accent-primary border-accent-primary'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-small text-text-secondary mb-1.5 block">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Cappuccino"
              className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-small text-text-secondary mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-small text-text-secondary mb-1.5 block">Product Image</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-bg-tertiary border border-border flex items-center justify-center overflow-hidden shrink-0">
                {form.image_path ? (
                  <img src={form.image_path} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-text-muted" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleImageUpload}
                  className="flex items-center gap-2 px-4 h-9 rounded-lg border border-border text-small text-text-secondary font-medium hover:bg-bg-hover hover:text-text-primary transition-colors"
                >
                  <Upload size={14} />
                  {form.image_path ? 'Change Image' : 'Upload Image'}
                </button>
                {form.image_path && (
                  <button
                    type="button"
                    onClick={() => handleChange('image_path', '')}
                    className="text-small text-accent-danger hover:underline text-left"
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category + Price row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary focus:border-border-focus focus:outline-none"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Price (₱) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="0.00"
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary tabular-nums focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>

          {/* Cost + Stock row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Cost (₱)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                placeholder="0.00"
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary tabular-nums focus:border-border-focus focus:outline-none"
              />
            </div>
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Stock</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary tabular-nums focus:border-border-focus focus:outline-none"
              />
            </div>
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Low Stock Alert</label>
              <input
                type="number"
                min="0"
                value={form.low_stock_alert}
                onChange={(e) => handleChange('low_stock_alert', e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary tabular-nums focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>

          {/* Availability toggle */}
          <label className="flex items-center gap-3 cursor-pointer py-2">
            <div
              onClick={() => handleChange('is_available', !form.is_available)}
              className={cn(
                'w-10 h-6 rounded-full transition-colors flex items-center px-0.5',
                form.is_available ? 'bg-accent-primary' : 'bg-bg-hover'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full bg-white shadow transition-transform',
                form.is_available ? 'translate-x-4' : 'translate-x-0'
              )} />
            </div>
            <span className="text-body text-text-primary">Available for sale</span>
          </label>
        </div>
      )}

      {/* Variants Tab */}
      {activeTab === 'variants' && (
        <div className="space-y-3">
          <p className="text-small text-text-secondary">
            Add variants like sizes, flavors, or colors. Each variant can have its own price and stock.
          </p>

          {variants.map((variant, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary">
              <div className="flex-1 grid grid-cols-4 gap-2">
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => handleUpdateVariant(index, 'name', e.target.value)}
                  placeholder="Name (e.g. Large)"
                  className="h-9 px-2 rounded bg-bg-input border border-border text-small text-text-primary focus:border-border-focus focus:outline-none"
                />
                <input
                  type="text"
                  value={variant.sku || ''}
                  onChange={(e) => handleUpdateVariant(index, 'sku', e.target.value)}
                  placeholder="SKU"
                  className="h-9 px-2 rounded bg-bg-input border border-border text-small text-text-primary focus:border-border-focus focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.price || ''}
                  onChange={(e) => handleUpdateVariant(index, 'price', e.target.value)}
                  placeholder="Price"
                  className="h-9 px-2 rounded bg-bg-input border border-border text-small text-text-primary tabular-nums focus:border-border-focus focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={variant.stock || 0}
                  onChange={(e) => handleUpdateVariant(index, 'stock', Number(e.target.value))}
                  placeholder="Stock"
                  className="h-9 px-2 rounded bg-bg-input border border-border text-small text-text-primary tabular-nums focus:border-border-focus focus:outline-none"
                />
              </div>
              <button
                onClick={() => handleRemoveVariant(index)}
                className="w-8 h-8 rounded flex items-center justify-center text-text-muted hover:text-accent-danger transition-colors shrink-0 mt-0.5"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          <button
            onClick={handleAddVariant}
            className="flex items-center gap-2 px-4 h-10 rounded-lg border border-dashed border-border text-small text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-colors w-full justify-center"
          >
            <Plus size={14} />
            Add Variant
          </button>
        </div>
      )}

      {/* Barcodes Tab */}
      {activeTab === 'barcodes' && (
        <div className="space-y-3">
          <p className="text-small text-text-secondary">
            Assign one or more barcodes to this product. Multiple barcodes resolve to the same product.
          </p>

          {barcodes.map((code, index) => (
            <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-bg-tertiary">
              <Barcode size={16} className="text-text-muted shrink-0" />
              <span className="flex-1 text-body text-text-primary font-mono">{code}</span>
              <button
                onClick={() => handleRemoveBarcode(index)}
                className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-accent-danger transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newBarcode}
              onChange={(e) => setNewBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBarcode()}
              placeholder="Enter barcode and press Enter"
              className="flex-1 h-10 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary font-mono placeholder:text-text-muted focus:border-border-focus focus:outline-none"
            />
            <button
              onClick={handleAddBarcode}
              className="h-10 px-4 rounded-lg bg-accent-primary text-text-inverse text-small font-semibold hover:bg-accent-primary-hover transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
        <button
          onClick={onClose}
          className="px-5 h-11 rounded-lg border border-border text-text-secondary font-medium hover:bg-bg-hover transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !form.name.trim() || !form.price}
          className={cn(
            'px-6 h-11 rounded-lg font-semibold transition-all',
            saving || !form.name.trim() || !form.price
              ? 'bg-bg-hover text-text-muted cursor-not-allowed'
              : 'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover'
          )}
        >
          {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </Modal>
  );
}
