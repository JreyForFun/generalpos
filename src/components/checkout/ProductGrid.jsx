import { useState, useEffect, useMemo } from 'react';
import { Package } from 'lucide-react';
import { useCheckoutStore } from '../../store/checkoutStore';
import { useIpc } from '../../hooks/useIpc';
import SearchBar from '../shared/SearchBar';
import { useToast } from '../shared/Toast';
import { cn } from '../../lib/cn';
import { formatCurrencyRaw } from '../../lib/formatCurrency';

/**
 * ProductGrid — browsable product cards with category filter tabs.
 * DESIGN_SYSTEM §5.3: Product Card spec (140px min, 120px min-height)
 * Layout: Category tabs on top → Search bar → Scrollable grid
 */
export default function ProductGrid() {
  const addItem = useCheckoutStore((s) => s.addItem);
  const toast = useToast();
  const { call: loadProducts, data: products } = useIpc();
  const { call: loadCategories, data: categories } = useIpc();

  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  // Load products and categories on mount
  useEffect(() => {
    loadProducts(() => window.electronAPI.getProducts());
    loadCategories(() => window.electronAPI.getCategories());
  }, []);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'all' || p.category_id === Number(activeCategory);
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, search]);

  const handleAddToCart = (product) => {
    if (!product.is_available || product.stock <= 0) {
      toast.warning('This product is currently unavailable');
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        <CategoryTab
          label="All"
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        />
        {categories?.map((cat) => (
          <CategoryTab
            key={cat.id}
            label={cat.name}
            active={activeCategory === String(cat.id)}
            onClick={() => setActiveCategory(String(cat.id))}
          />
        ))}
      </div>

      {/* Search Bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search products... (F2)"
        className="shrink-0"
      />

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package size={48} className="text-text-muted mb-3" />
            <p className="text-body text-text-secondary">
              {search ? 'No products match your search' : 'No products in this category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleAddToCart(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Category filter tab button */
function CategoryTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 px-4 h-9 rounded-lg text-small font-semibold transition-all duration-150 whitespace-nowrap',
        active
          ? 'bg-accent-primary text-text-inverse'
          : 'bg-bg-hover text-text-secondary hover:bg-bg-active hover:text-text-primary'
      )}
    >
      {label}
    </button>
  );
}

/** Product card — DESIGN_SYSTEM §5.3 */
function ProductCard({ product, onClick }) {
  const isUnavailable = !product.is_available || product.stock <= 0;

  return (
    <button
      onClick={onClick}
      disabled={isUnavailable}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-150 text-left',
        'bg-bg-secondary border-border min-h-[120px]',
        isUnavailable
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:border-accent-primary hover:bg-bg-hover hover:shadow-md active:scale-[0.97] cursor-pointer'
      )}
    >
      {/* Product Image Placeholder */}
      <div className="w-[80px] h-[80px] rounded-lg bg-bg-tertiary flex items-center justify-center shrink-0 overflow-hidden">
        {product.image_path ? (
          <img
            src={product.image_path}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={28} className="text-text-muted" />
        )}
      </div>

      {/* Product Name */}
      <p className="text-body font-semibold text-text-primary w-full line-clamp-2 text-center">
        {product.name}
      </p>

      {/* Price */}
      <p className="font-heading text-h3 text-accent-primary tabular-nums">
        {formatCurrencyRaw(product.price)}
      </p>

      {/* Out of stock badge */}
      {isUnavailable && (
        <span className="text-tiny font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-danger/15 text-accent-danger">
          Out of Stock
        </span>
      )}
    </button>
  );
}
