import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Eye, EyeOff, Search, BarChart3 } from 'lucide-react';
import Table from '../components/shared/Table';
import SearchBar from '../components/shared/SearchBar';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/shared/ConfirmModal';
import CustomSelect from '../components/shared/CustomSelect';
import { useToast } from '../components/shared/Toast';
import ProductForm from '../components/products/ProductForm';
import { cn } from '../lib/cn';
import { SkeletonTable } from '../components/shared/Skeleton';
import { formatCurrencyRaw } from '../lib/formatCurrency';

/**
 * Products page — admin product management.
 * List view with search, category filter, add/edit/delete, availability toggle.
 */
export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    const result = await window.electronAPI.getProducts();
    if (result.success) setProducts(result.data);
    setLoading(false);
  };

  const loadCategories = async () => {
    const result = await window.electronAPI.getCategories();
    if (result.success) setCategories(result.data);
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = categoryFilter === 'all' || p.category_id === Number(categoryFilter);
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAdd = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = async (product) => {
    // Load full product with variants and barcodes
    const result = await window.electronAPI.getProduct(product.id);
    if (result.success) {
      setEditingProduct(result.data);
      setShowForm(true);
    }
  };

  const handleFormSave = async (data) => {
    let result;
    if (editingProduct) {
      result = await window.electronAPI.updateProduct(editingProduct.id, data);
    } else {
      result = await window.electronAPI.createProduct(data);
    }

    if (result.success) {
      toast.success(editingProduct ? 'Product updated' : 'Product created');
      setShowForm(false);
      setEditingProduct(null);
      loadProducts();
    } else {
      toast.error(result.error || 'Failed to save product');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await window.electronAPI.deleteProduct(deleteTarget.id);
    if (result.success) {
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      loadProducts();
    } else {
      toast.error(result.error || 'Failed to delete product');
    }
  };

  const handleToggleAvailability = async (product) => {
    const result = await window.electronAPI.updateProduct(product.id, {
      is_available: !product.is_available,
    });
    if (result.success) {
      toast.success(`${product.name} ${product.is_available ? 'hidden' : 'visible'}`);
      loadProducts();
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center shrink-0 overflow-hidden">
            {row.image_path ? (
              <img src={row.image_path} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={16} className="text-text-muted" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-body font-medium text-text-primary truncate">{row.name}</p>
            <p className="text-small text-text-muted">{row.category_name || 'Uncategorized'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (val) => (
        <span className="font-heading text-body text-accent-primary tabular-nums">
          {formatCurrencyRaw(val)}
        </span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (val, row) => (
        <span className={cn(
          'text-body tabular-nums font-semibold',
          val <= row.low_stock_alert ? 'text-accent-danger' : 'text-text-primary'
        )}>
          {val}
          {val <= row.low_stock_alert && (
            <span className="ml-2 text-tiny px-1.5 py-0.5 rounded-full bg-accent-danger/15 text-accent-danger uppercase">Low</span>
          )}
        </span>
      ),
    },
    {
      key: 'is_available',
      label: 'Status',
      render: (val) => (
        <span className={cn(
          'text-tiny font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
          val ? 'bg-accent-primary/15 text-accent-primary' : 'bg-bg-hover text-text-muted'
        )}>
          {val ? 'Active' : 'Hidden'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleAvailability(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            title={row.is_available ? 'Hide' : 'Show'}
          >
            {row.is_available ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-bg-hover transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
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
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-heading text-h1 text-text-primary">Products</h1>
          <p className="text-small text-text-secondary mt-1">
            {products.length} products • {products.filter((p) => p.stock <= p.low_stock_alert).length} low stock
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 h-11 rounded-lg bg-accent-primary text-text-inverse font-semibold text-body hover:bg-accent-primary-hover transition-colors"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 shrink-0">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products..."
          className="flex-1"
        />
        <CustomSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { value: 'all', label: 'All Categories' },
            ...categories.map((c) => ({ value: String(c.id), label: c.name })),
          ]}
          className="w-44"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={6} cols={5} />
        ) : (
          <Table
            columns={columns}
            data={filteredProducts}
            emptyIcon={<Package size={48} />}
            emptyMessage="No products found"
            onRowClick={handleEdit}
          />
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSave={handleFormSave}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
