import { create } from 'zustand';

/**
 * Settings store — caches app_settings from the database.
 * Loaded once on login, refreshed when settings change.
 */
export const useSettingsStore = create((set) => ({
  settings: {},
  storeInfo: null,
  loaded: false,

  loadSettings: async () => {
    try {
      const [settingsRes, storeRes] = await Promise.all([
        window.electronAPI.getSettings(),
        window.electronAPI.getStoreInfo(),
      ]);

      if (settingsRes.success) {
        set({ settings: settingsRes.data, loaded: true });
      }
      if (storeRes.success) {
        set({ storeInfo: storeRes.data });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  },

  getSetting: (key, defaultValue = null) => {
    const { settings } = useSettingsStore.getState();
    return settings[key] ?? defaultValue;
  },

  updateSetting: async (key, value) => {
    const result = await window.electronAPI.updateSetting(key, value);
    if (result.success) {
      set((state) => ({
        settings: { ...state.settings, [key]: String(value) },
      }));
    }
    return result;
  },
}));
