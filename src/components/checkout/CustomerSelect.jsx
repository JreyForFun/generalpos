import { useState, useEffect, useRef } from 'react';
import { UserPlus, X, Star, Wallet, Search } from 'lucide-react';
import { useCheckoutStore } from '../../store/checkoutStore';
import { cn } from '../../lib/cn';

/**
 * CustomerSelect — inline customer search/select for the Cart.
 * When a customer is selected, their discount auto-applies via checkoutStore.
 * Shows points & eWallet balance for quick reference.
 */
export default function CustomerSelect() {
  const customer = useCheckoutStore((s) => s.customer);
  const setCustomer = useCheckoutStore((s) => s.setCustomer);
  const clearCustomer = useCheckoutStore((s) => s.clearCustomer);

  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isSearching) return;
    if (!query.trim()) { setResults([]); return; }

    const timer = setTimeout(async () => {
      const result = await window.electronAPI.getCustomers({ search: query });
      if (result.success) setResults(result.data);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, isSearching]);

  useEffect(() => {
    if (isSearching && inputRef.current) inputRef.current.focus();
  }, [isSearching]);

  const handleSelect = (c) => {
    setCustomer(c);
    setIsSearching(false);
    setQuery('');
    setResults([]);
  };

  const handleRemove = () => {
    clearCustomer();
  };

  // Customer is selected — show badge
  if (customer) {
    const hasDiscount = customer.discount_type && customer.discount_value;
    const expired = customer.discount_expiry && new Date(customer.discount_expiry) < new Date();
    const discountActive = hasDiscount && !expired;

    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-accent-primary/10 border border-accent-primary/30">
        <div className="min-w-0 flex-1">
          <p className="text-small font-semibold text-text-primary truncate">{customer.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-tiny text-text-muted">
              <Star size={10} className="text-accent-warning" />
              {Number(customer.points || 0).toLocaleString()} pts
            </span>
            <span className="flex items-center gap-1 text-tiny text-accent-primary">
              <Wallet size={10} />
              ₱{Number(customer.ewallet || 0).toFixed(2)}
            </span>
            {discountActive && (
              <span className="text-tiny font-semibold text-accent-secondary">
                {customer.discount_type === 'percent' ? `${customer.discount_value}% off` : `₱${customer.discount_value} off`}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-accent-danger transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // Search mode
  if (isSearching) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer..."
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-bg-input border border-border text-small text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
            />
          </div>
          <button
            onClick={() => { setIsSearching(false); setQuery(''); setResults([]); }}
            className="w-8 h-8 rounded flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Results dropdown */}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg bg-bg-secondary border border-border shadow-lg overflow-hidden max-h-[180px] overflow-y-auto">
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-bg-hover transition-colors border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-small font-medium text-text-primary truncate">{c.name}</p>
                  <p className="text-tiny text-text-muted">{c.phone || c.email || '—'}</p>
                </div>
                <div className="flex items-center gap-2 text-tiny text-text-muted shrink-0">
                  <span className="flex items-center gap-0.5">
                    <Star size={9} className="text-accent-warning" />
                    {Number(c.points || 0).toLocaleString()}
                  </span>
                  <span className="text-accent-primary">₱{Number(c.ewallet || 0).toFixed(0)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg bg-bg-secondary border border-border shadow-lg p-4 text-center">
            <p className="text-small text-text-muted">No customers found</p>
          </div>
        )}
      </div>
    );
  }

  // Default — add customer button
  return (
    <button
      onClick={() => setIsSearching(true)}
      className="flex items-center gap-2 w-full px-3 h-9 rounded-lg border border-dashed border-border text-small text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-colors"
    >
      <UserPlus size={14} />
      Add Customer
    </button>
  );
}
