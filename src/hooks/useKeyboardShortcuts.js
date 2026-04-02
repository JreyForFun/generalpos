import { useEffect } from 'react';
import { useViewStore } from '../store/viewStore';
import { useCheckoutStore } from '../store/checkoutStore';

/**
 * Hook: Global keyboard shortcuts for POS operations.
 * F2 = Focus search, F4 = Hold order, F9 = Pay, Escape = Close modal / go back
 */
export function useKeyboardShortcuts() {
  const navigate = useViewStore((s) => s.navigate);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture shortcuts when typing in inputs
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      switch (e.key) {
        case 'F2': {
          e.preventDefault();
          const searchBar = document.querySelector('[data-search-input]');
          searchBar?.focus();
          break;
        }
        case 'F9': {
          e.preventDefault();
          const items = useCheckoutStore.getState().items;
          if (items.length > 0) {
            // Trigger pay action — component will listen for this
            document.dispatchEvent(new CustomEvent('shortcut:pay'));
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('shortcut:escape'));
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}
