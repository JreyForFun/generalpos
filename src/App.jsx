import { useSessionStore } from './store/sessionStore';
import { useViewStore } from './store/viewStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Cashiers from './pages/Cashiers';
import Inventory from './pages/Inventory';
import GiftCards from './pages/GiftCards';
import Settings from './pages/Settings';
import Manual from './pages/Manual';
import IdleLock from './components/layout/IdleLock';

const views = {
  checkout:  Checkout,
  products:  Products,
  orders:    Orders,
  customers: Customers,
  reports:   Reports,
  cashiers:  Cashiers,
  inventory: Inventory,
  giftcards: GiftCards,
  settings:  Settings,
  manual:    Manual,
};

export default function App() {
  const session = useSessionStore((s) => s.session);
  const currentView = useViewStore((s) => s.currentView);

  // Not logged in → show login screen
  if (!session) {
    return <Login />;
  }

  // Logged in → show main layout with current view
  const ViewComponent = views[currentView] || Checkout;

  return (
    <>
      <Layout>
        <ViewComponent />
      </Layout>
      <IdleLock />
    </>
  );
}
