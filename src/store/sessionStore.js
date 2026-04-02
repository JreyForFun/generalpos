import { create } from 'zustand';

/**
 * Session store — tracks authenticated cashier in the Renderer process.
 * This is the Renderer-side mirror of electron/utils/session.js (Main process).
 */
export const useSessionStore = create((set) => ({
  session: null, // { cashierId, name, role }
  isLocked: false,

  login: (sessionData) => set({ session: sessionData, isLocked: false }),

  logout: () => {
    window.electronAPI?.logout();
    set({ session: null, isLocked: false });
  },

  lock: () => set({ isLocked: true }),

  unlock: () => set({ isLocked: false }),
}));
