import { useState, useEffect } from 'react';
import { Boxes, Plus, Minus, AlertTriangle, Package, ArrowUpDown, FileDown, FlaskConical, Pencil, Trash2 } from 'lucide-react';
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
 * Inventory page — stock levels, manual adjustments, ingredients/supplies tab, and PDF export.
 */
export default function Inventory() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('products'); // products | ingredients
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | low | out
  const [loading, setLoading] = useState(true);

  // Product adjust
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('add');

  // Ingredient adjust
  const [ingredientAdjust, setIngredientAdjust] = useState(null);
  const [ingredientAdjustQty, setIngredientAdjustQty] = useState('');
  const [ingredientAdjustType, setIngredientAdjustType] = useState('add');

  // Ingredient create/edit
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [editIngredient, setEditIngredient] = useState(null);
  const [ingredientForm, setIngredientForm] = useState({ name: '', unit: 'pcs', stock: '', low_stock_alert: '5', cost_per_unit: '', supplier: '' });
  const [deleteIngredient, setDeleteIngredient] = useState(null);
  const [saving, setSaving] = useState(false);

  const [exporting, setExporting] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    const result = await window.electronAPI.getProducts();
    if (result.success) setProducts(result.data);
    setLoading(false);
  };

  const loadIngredients = async () => {
    const result = await window.electronAPI.getIngredients?.();
    if (result?.success) setIngredients(result.data);
  };

  useEffect(() => {
    loadProducts();
    loadIngredients();
  }, []);

  // Product stats
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.low_stock_alert).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (filter === 'low') return matchesSearch && p.stock > 0 && p.stock <= p.low_stock_alert;
    if (filter === 'out') return matchesSearch && p.stock <= 0;
    return matchesSearch;
  });

  // Filter ingredients
  const filteredIngredients = ingredients.filter((i) => {
    return !search || i.name.toLowerCase().includes(search.toLowerCase());
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
      reason: adjustType === 'add' ? 'Manual stock addition' : 'Manual stock removal',
    });

    if (result.success) {
      toast.success(
        `${adjustType === 'add' ? 'Added' : 'Removed'} ${qty} units of "${adjustTarget.name}"`
      );
      setAdjustTarget(null);
      setAdjustQty('');
      loadProducts();
    } else {
      toast.error(result.error || 'Stock adjustment failed');
    }
  };

  const handleIngredientAdjust = async () => {
    if (!ingredientAdjust || !ingredientAdjustQty) return;
    const qty = parseFloat(ingredientAdjustQty);
    if (isNaN(qty) || qty <= 0) {
      toast.warning('Enter a valid quantity');
      return;
    }

    const finalQty = ingredientAdjustType === 'remove' ? -qty : qty;
    const result = await window.electronAPI.adjustIngredient?.(ingredientAdjust.id, { quantity: finalQty });

    if (result?.success) {
      toast.success(`${ingredientAdjustType === 'add' ? 'Added' : 'Removed'} ${qty} ${ingredientAdjust.unit} of "${ingredientAdjust.name}"`);
      setIngredientAdjust(null);
      setIngredientAdjustQty('');
      loadIngredients();
    } else {
      toast.error(result?.error || 'Adjustment failed');
    }
  };

  const openIngredientCreate = () => {
    setEditIngredient(null);
    setIngredientForm({ name: '', unit: 'pcs', stock: '', low_stock_alert: '5', cost_per_unit: '', supplier: '' });
    setShowIngredientForm(true);
  };

  const openIngredientEdit = (ing) => {
    setEditIngredient(ing);
    setIngredientForm({
      name: ing.name,
      unit: ing.unit,
      stock: String(ing.stock),
      low_stock_alert: String(ing.low_stock_alert),
      cost_per_unit: String(ing.cost_per_unit || ''),
      supplier: ing.supplier || '',
    });
    setShowIngredientForm(true);
  };

  const handleSaveIngredient = async () => {
    if (!ingredientForm.name.trim()) {
      toast.warning('Enter an ingredient name');
      return;
    }
    setSaving(true);

    if (editIngredient) {
      const result = await window.electronAPI.updateIngredient?.(editIngredient.id, {
        name: ingredientForm.name,
        unit: ingredientForm.unit,
        low_stock_alert: parseFloat(ingredientForm.low_stock_alert) || 5,
        cost_per_unit: parseFloat(ingredientForm.cost_per_unit) || 0,
        supplier: ingredientForm.supplier,
      });
      if (result?.success) {
        toast.success('Ingredient updated');
      } else {
        toast.error(result?.error || 'Update failed');
      }
    } else {
      const result = await window.electronAPI.createIngredient?.({
        name: ingredientForm.name,
        unit: ingredientForm.unit,
        stock: parseFloat(ingredientForm.stock) || 0,
        low_stock_alert: parseFloat(ingredientForm.low_stock_alert) || 5,
        cost_per_unit: parseFloat(ingredientForm.cost_per_unit) || 0,
        supplier: ingredientForm.supplier,
      });
      if (result?.success) {
        toast.success('Ingredient created');
      } else {
        toast.error(result?.error || 'Create failed');
      }
    }

    setSaving(false);
    setShowIngredientForm(false);
    loadIngredients();
  };

  const handleDeleteIngredient = async () => {
    if (!deleteIngredient) return;
    const result = await window.electronAPI.deleteIngredient?.(deleteIngredient.id);
    if (result?.success) {
      toast.success(`"${deleteIngredient.name}" deleted`);
      setDeleteIngredient(null);
      loadIngredients();
    } else {
      toast.error(result?.error || 'Delete failed');
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    const result = await window.electronAPI.exportReportPDF({
      date: new Date().toISOString().slice(0, 10),
      inventoryExport: true,
      products: products.map((p) => ({
        name: p.name,
        category: p.category_name || 'Uncategorized',
        stock: p.stock,
        alert: p.low_stock_alert,
        status: p.stock <= 0 ? 'Out' : p.stock <= p.low_stock_alert ? 'Low' : 'OK',
      })),
      ingredients: ingredients.map((i) => ({
        name: i.name,
        unit: i.unit,
        stock: i.stock,
        alert: i.low_stock_alert,
        status: i.stock <= 0 ? 'Out' : i.stock <= i.low_stock_alert ? 'Low' : 'OK',
      })),
    });
    if (result.success) {
      toast.success('Inventory PDF exported!', result.data?.path);
    } else {
      toast.error(result.error || 'Export failed');
    }
    setExporting(false);
  };

  const productColumns = [
    {
      key: 'name',
      label: 'Product',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-bg-tertiary flex items-center justify-center shrink-0">
            <Package size={14} className="text-text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-body font-medium text-text-primary line-clamp-2">{row.name}</p>
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
          {formatCurrencyRaw(val)}
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

  const ingredientColumns = [
    {
      key: 'name',
      label: 'Ingredient',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-secondary/10 flex items-center justify-center shrink-0">
            <FlaskConical size={14} className="text-accent-secondary" />
          </div>
          <div className="min-w-0">
            <p className="text-body font-medium text-text-primary">{row.name}</p>
            {row.supplier && <p className="text-small text-text-muted">{row.supplier}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
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
            <span className="text-small text-text-muted">{row.unit}</span>
            {isOut && <span className="text-tiny px-1.5 py-0.5 rounded-full bg-accent-danger/15 text-accent-danger uppercase font-semibold">Out</span>}
            {isLow && <span className="text-tiny px-1.5 py-0.5 rounded-full bg-accent-warning/15 text-accent-warning uppercase font-semibold">Low</span>}
          </div>
        );
      },
    },
    {
      key: 'cost_per_unit',
      label: 'Cost/Unit',
      render: (val) => (
        <span className="text-body text-text-secondary tabular-nums">
          {val > 0 ? formatCurrencyRaw(val) : '—'}
        </span>
      ),
    },
    {
      key: 'low_stock_alert',
      label: 'Alert At',
      render: (val, row) => (
        <span className="text-body text-text-muted tabular-nums">≤ {val} {row.unit}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); setIngredientAdjust(row); }}
            className="flex items-center gap-1 px-2.5 h-8 rounded-lg bg-bg-hover text-text-secondary text-small font-medium hover:bg-bg-active transition-colors"
          >
            <ArrowUpDown size={12} /> Adjust
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openIngredientEdit(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-bg-hover transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteIngredient(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-danger hover:bg-bg-hover transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header + Export */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-heading text-h1 text-text-primary">Inventory</h1>
          <p className="text-small text-text-secondary mt-1">Stock levels, ingredients & adjustments</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'ingredients' && (
            <button
              onClick={openIngredientCreate}
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-accent-secondary text-white font-semibold text-small hover:bg-accent-secondary-hover transition-colors"
            >
              <Plus size={16} /> Add Ingredient
            </button>
          )}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className={cn(
              'flex items-center gap-1.5 px-3 h-10 rounded-lg text-small font-medium transition-colors',
              exporting ? 'bg-bg-hover text-text-muted cursor-not-allowed' : 'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover'
            )}
          >
            <FileDown size={14} /> {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 shrink-0 bg-bg-secondary rounded-lg p-1 border border-border w-fit">
        <button
          onClick={() => { setActiveTab('products'); setSearch(''); setFilter('all'); }}
          className={cn(
            'flex items-center gap-2 px-4 h-9 rounded-md text-small font-semibold transition-all',
            activeTab === 'products'
              ? 'bg-accent-primary text-text-inverse shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Package size={14} /> Products ({totalProducts})
        </button>
        <button
          onClick={() => { setActiveTab('ingredients'); setSearch(''); setFilter('all'); }}
          className={cn(
            'flex items-center gap-2 px-4 h-9 rounded-md text-small font-semibold transition-all',
            activeTab === 'ingredients'
              ? 'bg-accent-secondary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <FlaskConical size={14} /> Ingredients ({ingredients.length})
        </button>
      </div>

      {/* Stats row — Products tab only */}
      {activeTab === 'products' && (
        <div className="flex items-center gap-4 shrink-0">
          <StatCard label="Total Products" value={totalProducts} active={filter === 'all'} onClick={() => setFilter('all')} />
          <StatCard label="Low Stock" value={lowStockCount} color="warning" active={filter === 'low'} onClick={() => setFilter('low')} />
          <StatCard label="Out of Stock" value={outOfStockCount} color="danger" active={filter === 'out'} onClick={() => setFilter('out')} />
        </div>
      )}

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={activeTab === 'products' ? 'Search products...' : 'Search ingredients...'}
        className="shrink-0"
      />

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={6} cols={5} />
        ) : activeTab === 'products' ? (
          <Table
            columns={productColumns}
            data={filteredProducts}
            emptyIcon={<Boxes size={48} />}
            emptyMessage={filter === 'low' ? 'No low stock items' : filter === 'out' ? 'No out of stock items' : 'No products found'}
          />
        ) : (
          <Table
            columns={ingredientColumns}
            data={filteredIngredients}
            emptyIcon={<FlaskConical size={48} />}
            emptyMessage="No ingredients yet. Click 'Add Ingredient' to get started."
          />
        )}
      </div>

      {/* Product Stock Adjustment Modal */}
      {adjustTarget && (
        <Modal
          isOpen={true}
          onClose={() => { setAdjustTarget(null); setAdjustQty(''); }}
          title="Adjust Stock"
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center py-3 rounded-lg bg-bg-primary border border-border">
              <p className="text-small text-text-muted">Current Stock</p>
              <p className="font-heading text-display text-text-primary tabular-nums">{adjustTarget.stock}</p>
              <p className="text-body text-text-secondary mt-1">{adjustTarget.name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAdjustType('add')}
                className={cn(
                  'flex-1 h-11 rounded-lg font-semibold text-body flex items-center justify-center gap-2 transition-colors',
                  adjustType === 'add' ? 'bg-accent-primary text-text-inverse' : 'bg-bg-hover text-text-secondary hover:bg-bg-active'
                )}
              >
                <Plus size={16} /> Add Stock
              </button>
              <button
                onClick={() => setAdjustType('remove')}
                className={cn(
                  'flex-1 h-11 rounded-lg font-semibold text-body flex items-center justify-center gap-2 transition-colors',
                  adjustType === 'remove' ? 'bg-accent-danger text-white' : 'bg-bg-hover text-text-secondary hover:bg-bg-active'
                )}
              >
                <Minus size={16} /> Remove Stock
              </button>
            </div>
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
            {adjustQty && (
              <div className="text-center py-2 text-small text-text-secondary">
                New stock: <span className="font-heading text-h3 text-text-primary">
                  {adjustTarget.stock + (adjustType === 'add' ? Number(adjustQty) : -Number(adjustQty))}
                </span>
              </div>
            )}
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

      {/* Ingredient Stock Adjustment Modal */}
      {ingredientAdjust && (
        <Modal
          isOpen={true}
          onClose={() => { setIngredientAdjust(null); setIngredientAdjustQty(''); }}
          title="Adjust Ingredient Stock"
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center py-3 rounded-lg bg-bg-primary border border-border">
              <p className="text-small text-text-muted">Current Stock</p>
              <p className="font-heading text-display text-text-primary tabular-nums">{ingredientAdjust.stock} <span className="text-h3 text-text-muted">{ingredientAdjust.unit}</span></p>
              <p className="text-body text-text-secondary mt-1">{ingredientAdjust.name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIngredientAdjustType('add')}
                className={cn(
                  'flex-1 h-11 rounded-lg font-semibold text-body flex items-center justify-center gap-2 transition-colors',
                  ingredientAdjustType === 'add' ? 'bg-accent-primary text-text-inverse' : 'bg-bg-hover text-text-secondary hover:bg-bg-active'
                )}
              >
                <Plus size={16} /> Add
              </button>
              <button
                onClick={() => setIngredientAdjustType('remove')}
                className={cn(
                  'flex-1 h-11 rounded-lg font-semibold text-body flex items-center justify-center gap-2 transition-colors',
                  ingredientAdjustType === 'remove' ? 'bg-accent-danger text-white' : 'bg-bg-hover text-text-secondary hover:bg-bg-active'
                )}
              >
                <Minus size={16} /> Remove
              </button>
            </div>
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Quantity ({ingredientAdjust.unit})</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={ingredientAdjustQty}
                onChange={(e) => setIngredientAdjustQty(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleIngredientAdjust()}
                placeholder="0"
                className="w-full h-12 px-4 rounded-lg bg-bg-input border border-border text-h2 font-heading text-text-primary tabular-nums text-center focus:border-border-focus focus:outline-none"
                autoFocus
              />
            </div>
            <button
              onClick={handleIngredientAdjust}
              disabled={!ingredientAdjustQty || Number(ingredientAdjustQty) <= 0}
              className={cn(
                'w-full h-12 rounded-lg font-semibold text-body transition-all',
                !ingredientAdjustQty || Number(ingredientAdjustQty) <= 0
                  ? 'bg-bg-hover text-text-muted cursor-not-allowed'
                  : ingredientAdjustType === 'add'
                    ? 'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover'
                    : 'bg-accent-danger text-white hover:bg-accent-danger-hover'
              )}
            >
              {ingredientAdjustType === 'add' ? 'Add' : 'Remove'} {ingredientAdjustQty || 0} {ingredientAdjust.unit}
            </button>
          </div>
        </Modal>
      )}

      {/* Ingredient Create / Edit Modal */}
      {showIngredientForm && (
        <Modal
          isOpen={true}
          onClose={() => setShowIngredientForm(false)}
          title={editIngredient ? `Edit ${editIngredient.name}` : 'Add Ingredient'}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Name *</label>
              <input
                type="text"
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Espresso Beans"
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-small text-text-secondary mb-1.5 block">Unit</label>
                <CustomSelect
                  value={ingredientForm.unit}
                  onChange={(v) => setIngredientForm((f) => ({ ...f, unit: v }))}
                  options={[
                    { value: 'pcs', label: 'Pieces' },
                    { value: 'kg', label: 'Kilograms' },
                    { value: 'g', label: 'Grams' },
                    { value: 'L', label: 'Liters' },
                    { value: 'mL', label: 'Milliliters' },
                    { value: 'oz', label: 'Ounces' },
                    { value: 'cups', label: 'Cups' },
                    { value: 'bags', label: 'Bags' },
                    { value: 'boxes', label: 'Boxes' },
                  ]}
                />
              </div>
              {!editIngredient && (
                <div>
                  <label className="text-small text-text-secondary mb-1.5 block">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ingredientForm.stock}
                    onChange={(e) => setIngredientForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="0"
                    className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary tabular-nums placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-small text-text-secondary mb-1.5 block">Low Stock Alert</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ingredientForm.low_stock_alert}
                  onChange={(e) => setIngredientForm((f) => ({ ...f, low_stock_alert: e.target.value }))}
                  className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary tabular-nums focus:border-border-focus focus:outline-none"
                />
              </div>
              <div>
                <label className="text-small text-text-secondary mb-1.5 block">Cost per Unit (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ingredientForm.cost_per_unit}
                  onChange={(e) => setIngredientForm((f) => ({ ...f, cost_per_unit: e.target.value }))}
                  placeholder="0.00"
                  className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary tabular-nums placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-small text-text-secondary mb-1.5 block">Supplier (optional)</label>
              <input
                type="text"
                value={ingredientForm.supplier}
                onChange={(e) => setIngredientForm((f) => ({ ...f, supplier: e.target.value }))}
                placeholder="e.g. Manila Coffee Co."
                className="w-full h-11 px-3 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowIngredientForm(false)}
                className="flex-1 h-11 rounded-lg border border-border text-text-secondary font-medium hover:bg-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveIngredient}
                disabled={saving || !ingredientForm.name.trim()}
                className={cn(
                  'flex-1 h-11 rounded-lg font-semibold transition-all',
                  saving || !ingredientForm.name.trim()
                    ? 'bg-bg-hover text-text-muted cursor-not-allowed'
                    : 'bg-accent-secondary text-white hover:bg-accent-secondary-hover'
                )}
              >
                {saving ? 'Saving...' : editIngredient ? 'Save Changes' : 'Add Ingredient'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Ingredient Confirmation */}
      <ConfirmModal
        isOpen={!!deleteIngredient}
        onClose={() => setDeleteIngredient(null)}
        onConfirm={handleDeleteIngredient}
        title="Delete Ingredient"
        message={`Delete "${deleteIngredient?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
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
