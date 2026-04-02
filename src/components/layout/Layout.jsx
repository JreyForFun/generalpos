import Titlebar from './Titlebar';
import Sidebar from './Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useIdleLock } from '../../hooks/useIdleLock';
import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

export default function Layout({ children }) {
  // Initialize global hooks
  useKeyboardShortcuts();
  useIdleLock();

  // Load settings on mount
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg-primary">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
