import { create } from 'zustand';

/**
 * View navigation store — replaces React Router for Electron SPA.
 * Tracks current view and navigation history.
 */
export const useViewStore = create((set, get) => ({
  currentView: 'checkout',  // Default view after login
  previousView: null,

  navigate: (view) => {
    const current = get().currentView;
    if (current === view) return;
    set({ currentView: view, previousView: current });
  },

  goBack: () => {
    const prev = get().previousView;
    if (prev) {
      set({ currentView: prev, previousView: null });
    }
  },
}));
