import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { useSettingsStore } from '../store/settingsStore';
import PinPad from '../components/shared/PinPad';

/**
 * Login page — fullscreen PIN entry.
 * First screen shown before any other view.
 */
export default function Login() {
  const login = useSessionStore((s) => s.login);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const handlePinSubmit = async (pin) => {
    setError('');

    const result = await window.electronAPI.authenticate(pin);
    if (result.success) {
      await loadSettings();
      login(result.data);
      // Maximize window on successful login for full POS experience
      window.electronAPI?.maximizeWindow();
    } else {
      setError(result.error || 'Invalid PIN');
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-bg-primary">
      <div className="flex flex-col items-center gap-8">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-bg-tertiary flex items-center justify-center shadow-lg">
            <Lock size={40} className="text-accent-primary" />
          </div>
          <div className="text-center">
            <h1 className="font-heading text-display text-text-primary tracking-wider">
              FLEX<span className="text-accent-primary">POS</span>
            </h1>
            <p className="text-body text-text-secondary mt-1">Enter your PIN to start</p>
          </div>
        </div>

        {/* PinPad */}
        <div className={shaking ? 'animate-shake' : ''}>
          <PinPad onSubmit={handlePinSubmit} error={error} />
        </div>

        {/* Version */}
        <p className="text-tiny text-text-muted">v1.0.0</p>
      </div>
    </div>
  );
}
