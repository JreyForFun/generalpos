import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import PinPad from '../shared/PinPad';

/**
 * IdleLock — fullscreen overlay shown when idle timeout triggers.
 * Requires correct PIN re-entry to unlock. Session state is preserved.
 */
export default function IdleLock() {
  const isLocked = useSessionStore((s) => s.isLocked);
  const session = useSessionStore((s) => s.session);
  const unlock = useSessionStore((s) => s.unlock);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  if (!isLocked || !session) return null;

  const handlePinSubmit = async (pin) => {
    setError('');

    const result = await window.electronAPI.authenticate(pin);
    if (result.success && result.data.cashierId === session.cashierId) {
      unlock();
    } else {
      setError('Incorrect PIN');
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
         style={{ backgroundColor: 'var(--overlay-heavy)' }}>
      <div className="flex flex-col items-center gap-6">
        {/* Lock icon */}
        <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center">
          <Lock size={32} className="text-accent-primary" />
        </div>

        {/* Message */}
        <div className="text-center">
          <h2 className="font-heading text-h1 text-text-primary mb-1">Screen Locked</h2>
          <p className="text-body text-text-secondary">
            Enter PIN to unlock • {session.name}
          </p>
        </div>

        {/* PinPad */}
        <div className={shaking ? 'animate-shake' : ''}>
          <PinPad onSubmit={handlePinSubmit} error={error} />
        </div>
      </div>
    </div>
  );
}
