import { useState, useRef, useEffect } from 'react';
import { BookOpen, Search, ChevronRight, ShoppingCart, Package, Users, CreditCard, Boxes, BarChart3, Settings as SettingsIcon, LogIn, Keyboard, Receipt, DollarSign, FlaskConical, HelpCircle } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * Manual page — comprehensive in-app help guide for FlexPOS.
 * Searchable, with sidebar table of contents and expandable sections.
 */

const sections = [
  {
    id: 'getting-started',
    icon: LogIn,
    title: 'Getting Started',
    content: [
      { q: 'How do I log in?', a: 'Enter your 4-digit PIN on the login screen and press Enter. The default admin PIN is 1234.' },
      { q: 'How do I set up my store?', a: 'Go to Settings → Store Information. Enter your store name, address, phone, email, and upload your logo. Click "Save Store Info" to apply.' },
      { q: 'How do I create cashier accounts?', a: 'Go to Cashiers page → "Add Cashier". Set a name, 4-digit PIN, and assign a role (Admin or Cashier). Admins have full access; Cashiers can only process sales and view orders.' },
    ],
  },
  {
    id: 'making-a-sale',
    icon: ShoppingCart,
    title: 'Making a Sale',
    content: [
      { q: 'How do I add products to the cart?', a: 'Click on any product card in the Checkout screen. The product will be added to the cart on the right. Click again to increase quantity.' },
      { q: 'How do I change item quantity?', a: 'Use the + and − buttons on each cart item. You can also hover over an item to see the Remove (×) button.' },
      { q: 'How do I apply a discount?', a: 'There are two types of discounts:\n• Item discount: Hover over an item → click the tag icon → enter a fixed peso amount.\n• Order discount: Click "Add order discount" below the cart → choose % or ₱ → enter value → Apply.' },
      { q: 'How do I hold an order?', a: 'Click the Pause (⏸) button next to the Pay button. The current cart is saved and a new empty cart opens. Resume held orders from the yellow bar at the top of the cart.' },
      { q: 'How do I process payment?', a: 'Click the "Pay" button. Enter the cash amount tendered. The system calculates change automatically. Click "Complete Payment" to finalize.' },
      { q: 'How do I use a gift card?', a: 'In the payment modal, enter the gift card code and click "Apply". If the card balance covers the full total, no cash is needed. If the balance is partial, the remainder must be paid in cash.' },
      { q: 'How does split payment work?', a: 'Click the "Split" button → Add payers with names → Set each payer\'s amount and method (Cash or eWallet). The total must balance. If using eWallet, a customer must be selected in the cart first.' },
    ],
  },
  {
    id: 'products-categories',
    icon: Package,
    title: 'Managing Products',
    content: [
      { q: 'How do I add a new product?', a: 'Go to Products → "Add Product". Fill in name, category, price, cost, initial stock, and optionally upload an image. Click "Create" to save.' },
      { q: 'How do I edit a product?', a: 'Click the edit (pencil) icon on any product row. Update the fields and click "Save Changes".' },
      { q: 'How do I create categories?', a: 'In the Products page, go to the Categories tab → "Add Category". Categories help organize products in the checkout grid.' },
      { q: 'What is the cost field?', a: 'The cost is your purchase price for the product. It\'s used for profit calculations in reports. It\'s optional but recommended.' },
      { q: 'How do product images work?', a: 'Click the image upload area when creating/editing a product. Select an image file (PNG, JPG, WebP). The image is stored as base64 and displayed on the product card in checkout.' },
    ],
  },
  {
    id: 'customers-loyalty',
    icon: Users,
    title: 'Customers & Loyalty',
    content: [
      { q: 'How do I add a customer?', a: 'Go to Customers → "Add Customer". Enter name, phone, and email. The customer will have an eWallet balance (starting at 0) and loyalty points.' },
      { q: 'How does the loyalty system work?', a: 'Customers earn points per peso spent (configurable in Settings). Points can be redeemed for discounts at checkout. The redemption rate is also configurable (e.g. 1 point = ₱0.01).' },
      { q: 'How do I top up a customer eWallet?', a: 'Go to the customer profile → click "Top Up" → enter the amount. The balance is updated instantly.' },
      { q: 'How do I link a customer to a sale?', a: 'In the Checkout cart, use the customer search bar at the top. Search by name or phone. Once linked, their eWallet and points become available for payment.' },
    ],
  },
  {
    id: 'gift-cards',
    icon: CreditCard,
    title: 'Gift Cards',
    content: [
      { q: 'How do I create a gift card?', a: 'Go to Gift Cards → "Create Gift Card". Set a code (or leave blank for auto-generation), balance, optional expiry date, and max uses (0 = unlimited).' },
      { q: 'How do I edit a gift card?', a: 'Click the edit (pencil) icon on any gift card row. You can change the balance, expiry date, and max uses.' },
      { q: 'How do I delete a gift card?', a: 'Click the delete (trash) icon → confirm in the dialog. This permanently removes the card.' },
      { q: 'Can gift cards partially cover an order?', a: 'Yes! If a gift card has ₱200 balance and the order is ₱500, the card covers ₱200 and the remaining ₱300 must be paid in cash.' },
    ],
  },
  {
    id: 'inventory',
    icon: Boxes,
    title: 'Inventory Management',
    content: [
      { q: 'How do I view stock levels?', a: 'Go to the Inventory page. The Products tab shows all products with current stock, low stock alerts, and out-of-stock indicators.' },
      { q: 'How do I adjust stock?', a: 'Click the "Adjust" button on any product row → choose Add or Remove → enter quantity → click to confirm.' },
      { q: 'What is the Ingredients tab?', a: 'The Ingredients tab tracks raw materials and supplies separately from finished products (e.g. espresso beans, sugar, cups). It has its own CRUD and stock adjustment system.' },
      { q: 'How do I export inventory to PDF?', a: 'Click the "Export PDF" button in the Inventory header. It generates a PDF report of all products and ingredients with their stock status.' },
      { q: 'What do the Low/Out badges mean?', a: '• "Low" = stock is at or below the alert threshold (configurable per product).\n• "Out" = stock is 0 or below. Out-of-stock products cannot be added to cart.' },
    ],
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: 'Reports & Analytics',
    content: [
      { q: 'What does the Reports page show?', a: 'Daily sales dashboard with: total sales, order count, discounts, tips, payment method breakdown, best sellers, 7-day sales chart, cashier performance, and cash flow summary.' },
      { q: 'How do I change the report date?', a: 'Use the date picker in the top-right corner of the Reports page. All charts and data will refresh for the selected date.' },
      { q: 'How do I export a report?', a: 'Click "Export PDF" to download a formatted PDF of the daily report, or click "Backup" to export the entire database.' },
    ],
  },
  {
    id: 'cash-drawer',
    icon: DollarSign,
    title: 'Cash Drawer',
    content: [
      { q: 'What is the Cash Drawer?', a: 'A digital tracking system for physical cash in the register. It does NOT control a physical cash drawer device — it\'s for record-keeping.' },
      { q: 'How do I use it?', a: '1. Open Drawer: Enter your starting float amount (e.g. ₱500) and click "Open Drawer".\n2. During the shift: Use "Cash In" for cash added, "Cash Out" for cash removed.\n3. End of shift: Count your cash, enter the amount, click "Close Drawer".' },
      { q: 'How is Expected Cash calculated?', a: 'Expected Cash = Opening Amount + Cash Sales + Cash In − Cash Out. This appears in Reports → Cash Flow Summary. Compare this to your actual cash count to detect discrepancies.' },
    ],
  },
  {
    id: 'settings',
    icon: SettingsIcon,
    title: 'Settings',
    content: [
      { q: 'What settings can I configure?', a: '• Loyalty Points per Peso — points earned per ₱1 spent\n• Points Redemption Rate — ₱ value per point redeemed\n• Rounding Mode — how totals are rounded\n• Idle Lock Timeout — auto-lock after inactivity\n• Low Stock Threshold — global default alert level' },
      { q: 'How do I upload a store logo?', a: 'Go to Settings → Store Information → click the image upload button under "Store Logo". The logo appears on the login screen and receipts.' },
    ],
  },
  {
    id: 'keyboard-shortcuts',
    icon: Keyboard,
    title: 'Keyboard Shortcuts',
    content: [
      { q: 'Available shortcuts', a: '• Enter — Submit PIN, confirm payment, apply discounts\n• Escape — Close modals and dialogs\n• Number keys — Enter PIN digits on login\n• Search bars — Start typing to filter products, customers, inventory' },
    ],
  },
  {
    id: 'troubleshooting',
    icon: HelpCircle,
    title: 'Troubleshooting',
    content: [
      { q: 'Why can\'t I add a product to the cart?', a: 'The product is either out of stock (stock = 0) or marked as unavailable. Check the Inventory page to adjust stock.' },
      { q: 'Why is my image not showing?', a: 'Images are stored as base64 data. If you uploaded an image before the Phase 6 update, it may have been stored as a file path (which doesn\'t work). Re-upload the image to fix.' },
      { q: 'I forgot the admin PIN', a: 'The default admin PIN is 1234. If changed and forgotten, the database admin_pin can be reset by deleting the flexpos.db file in AppData (WARNING: this erases all data).' },
      { q: 'Gift card says "not found"', a: 'Check that the card code is typed correctly (case-sensitive). Also verify the card is active and not expired in the Gift Cards page.' },
      { q: 'eWallet payment fails in split payment', a: 'A customer must be selected in the cart before opening the split payment modal. The customer\'s eWallet balance must be sufficient.' },
    ],
  },
];

export default function Manual() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');
  const [expandedItems, setExpandedItems] = useState({});
  const contentRef = useRef(null);

  const toggleItem = (sectionId, index) => {
    const key = `${sectionId}-${index}`;
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter sections by search
  const filteredSections = searchQuery
    ? sections.map((s) => ({
        ...s,
        content: s.content.filter(
          (item) =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((s) => s.content.length > 0)
    : sections;

  // Auto-expand all when searching
  useEffect(() => {
    if (searchQuery) {
      const allExpanded = {};
      filteredSections.forEach((s) => {
        s.content.forEach((_, i) => { allExpanded[`${s.id}-${i}`] = true; });
      });
      setExpandedItems(allExpanded);
    }
  }, [searchQuery]);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(`manual-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar TOC */}
      <aside className="w-56 shrink-0 overflow-y-auto py-4 space-y-1">
        <div className="flex items-center gap-2 px-3 mb-4">
          <BookOpen size={20} className="text-accent-primary" />
          <h2 className="font-heading text-h3 text-text-primary">Manual</h2>
        </div>
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-small transition-all',
                activeSection === section.id
                  ? 'bg-accent-primary/10 text-accent-primary font-semibold'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              )}
            >
              <Icon size={14} />
              <span className="truncate">{section.title}</span>
            </button>
          );
        })}
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto" ref={contentRef}>
        {/* Header + Search */}
        <div className="sticky top-0 z-10 bg-bg-primary pb-4">
          <h1 className="font-heading text-h1 text-text-primary mb-1">User Manual</h1>
          <p className="text-small text-text-secondary mb-4">Everything you need to know about using FlexPOS</p>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the manual..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-bg-input border border-border text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
            />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8 pb-8">
          {filteredSections.length === 0 ? (
            <div className="text-center py-16">
              <HelpCircle size={48} className="text-text-muted mx-auto mb-3" />
              <p className="text-body text-text-secondary">No results found for "{searchQuery}"</p>
              <p className="text-small text-text-muted mt-1">Try a different search term</p>
            </div>
          ) : (
            filteredSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.id} id={`manual-${section.id}`} className="scroll-mt-32">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                      <Icon size={16} className="text-accent-primary" />
                    </div>
                    <h2 className="font-heading text-h2 text-text-primary">{section.title}</h2>
                  </div>
                  <div className="space-y-2">
                    {section.content.map((item, i) => {
                      const key = `${section.id}-${i}`;
                      const isOpen = expandedItems[key];
                      return (
                        <div key={i} className="rounded-xl border border-border bg-bg-secondary overflow-hidden transition-all">
                          <button
                            onClick={() => toggleItem(section.id, i)}
                            className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-bg-hover transition-colors"
                          >
                            <span className="text-body font-medium text-text-primary">{item.q}</span>
                            <ChevronRight
                              size={16}
                              className={cn(
                                'text-text-muted transition-transform duration-200 shrink-0 ml-2',
                                isOpen && 'rotate-90'
                              )}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 pt-0">
                              <div className="text-small text-text-secondary leading-relaxed whitespace-pre-line">
                                {item.a}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
