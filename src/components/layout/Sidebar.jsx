import {
  ShoppingCart, Package, ClipboardList, Users, BarChart3,
  Boxes, UserCog, Settings, LogOut, CreditCard
} from 'lucide-react';
import { useViewStore } from '../../store/viewStore';
import { useSessionStore } from '../../store/sessionStore';
import { isAdmin } from '../../constants/roles';
import { cn } from '../../lib/cn';

const navItems = [
  { id: 'checkout',  icon: ShoppingCart,  label: 'Checkout',   roles: 'all' },
  { id: 'orders',    icon: ClipboardList, label: 'Orders',     roles: 'all' },
  { id: 'products',  icon: Package,       label: 'Products',   roles: 'admin' },
  { id: 'inventory', icon: Boxes,         label: 'Inventory',  roles: 'admin' },
  { id: 'giftcards', icon: CreditCard,    label: 'Gift Cards', roles: 'admin' },
  { id: 'customers', icon: Users,         label: 'Customers',  roles: 'all' },
  { id: 'reports',   icon: BarChart3,     label: 'Reports',    roles: 'admin' },
  { id: 'cashiers',  icon: UserCog,       label: 'Cashiers',   roles: 'admin' },
  { id: 'settings',  icon: Settings,      label: 'Settings',   roles: 'admin' },
];

export default function Sidebar() {
  const currentView = useViewStore((s) => s.currentView);
  const navigate = useViewStore((s) => s.navigate);
  const session = useSessionStore((s) => s.session);
  const logout = useSessionStore((s) => s.logout);

  const visibleItems = navItems.filter((item) => {
    if (item.roles === 'all') return true;
    return isAdmin(session?.role);
  });

  return (
    <aside className="flex flex-col w-60 bg-bg-secondary border-r border-border shrink-0 h-full">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={cn(
                'flex items-center gap-3 w-full h-11 px-4 rounded-lg text-body font-medium transition-all duration-150',
                isActive
                  ? 'bg-bg-active text-accent-primary border-l-[3px] border-accent-primary'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              )}
            >
              <Icon size={20} strokeWidth={2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: Cashier info + Logout */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-body font-semibold text-text-primary truncate">
              {session?.name || 'Unknown'}
            </p>
            <p className="text-tiny text-text-muted uppercase tracking-wider">
              {session?.role || 'cashier'}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center w-11 h-11 rounded-lg text-text-secondary hover:bg-bg-hover hover:text-accent-danger transition-colors duration-150"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}
