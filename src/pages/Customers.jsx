import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Eye, Phone, Mail, Wallet, Star } from 'lucide-react';
import Table from '../components/shared/Table';
import SearchBar from '../components/shared/SearchBar';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/shared/ConfirmModal';
import { useToast } from '../components/shared/Toast';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerProfile from '../components/customers/CustomerProfile';
import { cn } from '../lib/cn';

/**
 * Customers page — customer list, add/edit, profile view.
 * Search by name or phone. Shows points, eWallet, and discount status.
 */
export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [profileCustomer, setProfileCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCustomers = async () => {
    setLoading(true);
    const result = await window.electronAPI.getCustomers(search ? { search } : {});
    if (result.success) setCustomers(result.data);
    setLoading(false);
  };

  useEffect(() => { loadCustomers(); }, []);

  // Live search with debounce
  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAdd = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleViewProfile = async (customer) => {
    const result = await window.electronAPI.getCustomer(customer.id);
    if (result.success) setProfileCustomer(result.data);
  };

  const handleFormSave = async (data) => {
    let result;
    if (editingCustomer) {
      result = await window.electronAPI.updateCustomer(editingCustomer.id, data);
    } else {
      result = await window.electronAPI.createCustomer(data);
    }
    if (result.success) {
      toast.success(editingCustomer ? 'Customer updated' : 'Customer added');
      setShowForm(false);
      setEditingCustomer(null);
      loadCustomers();
    } else {
      toast.error(result.error || 'Failed to save customer');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await window.electronAPI.deleteCustomer(deleteTarget.id);
    if (result.success) {
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      loadCustomers();
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (_, row) => (
        <div className="min-w-0">
          <p className="text-body font-medium text-text-primary truncate">{row.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {row.phone && (
              <span className="flex items-center gap-1 text-small text-text-muted">
                <Phone size={11} /> {row.phone}
              </span>
            )}
            {row.email && (
              <span className="flex items-center gap-1 text-small text-text-muted">
                <Mail size={11} /> {row.email}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'points',
      label: 'Points',
      render: (val) => (
        <span className="flex items-center gap-1 text-body tabular-nums text-text-primary">
          <Star size={13} className="text-accent-warning" />
          {Number(val || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'ewallet',
      label: 'eWallet',
      render: (val) => (
        <span className="flex items-center gap-1 font-heading text-body tabular-nums text-accent-primary">
          <Wallet size={13} />
          ₱{Number(val || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'discount_type',
      label: 'Discount',
      render: (val, row) => {
        if (!val || !row.discount_value) return <span className="text-small text-text-muted">—</span>;
        const expired = row.discount_expiry && new Date(row.discount_expiry) < new Date();
        return (
          <span className={cn('text-small font-semibold', expired ? 'text-text-muted line-through' : 'text-accent-secondary')}>
            {val === 'percent' ? `${row.discount_value}%` : `₱${row.discount_value}`}
            {expired && <span className="text-tiny ml-1 no-underline">(expired)</span>}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); handleViewProfile(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-bg-hover transition-colors"
            title="View Profile"
          >
            <Eye size={14} />
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
          <h1 className="font-heading text-h1 text-text-primary">Customers</h1>
          <p className="text-small text-text-secondary mt-1">{customers.length} customers</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 h-11 rounded-lg bg-accent-primary text-text-inverse font-semibold text-body hover:bg-accent-primary-hover transition-colors"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name or phone..."
        className="shrink-0"
      />

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          data={customers}
          emptyIcon={<Users size={48} />}
          emptyMessage={search ? 'No customers match your search' : 'No customers yet'}
          onRowClick={handleViewProfile}
        />
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSave={handleFormSave}
          onClose={() => { setShowForm(false); setEditingCustomer(null); }}
        />
      )}

      {/* Customer Profile Modal */}
      {profileCustomer && (
        <CustomerProfile
          customer={profileCustomer}
          onClose={() => setProfileCustomer(null)}
          onRefresh={loadCustomers}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
