import { useState, useCallback, useEffect } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * PinPad — 4-6 digit PIN entry keypad.
 * Used on Login screen and IdleLock overlay.
 */
export default function PinPad({ onSubmit, error, pinLength = 4 }) {
  const [pin, setPin] = useState('');

  const handleDigit = useCallback((digit) => {
    setPin((prev) => {
      const next = prev + digit;
      if (next.length >= pinLength) {
        // Auto-submit when PIN is complete
        setTimeout(() => onSubmit(next), 100);
        return next;
      }
      return next;
    });
  }, [onSubmit, pinLength]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
  }, []);

  // Clear PIN on error change
  useEffect(() => {
    if (error) {
      setTimeout(() => setPin(''), 300);
    }
  }, [error]);

  // Keyboard input support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/^\d$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* PIN dots display */}
      <div className="flex items-center gap-3">
        {Array.from({ length: pinLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full transition-all duration-150',
              i < pin.length
                ? 'bg-accent-primary scale-110'
                : 'bg-border'
            )}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-small text-accent-danger">{error}</p>
      )}

      {/* Number grid */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleDigit(String(num))}
            className="w-[72px] h-[72px] rounded-2xl bg-bg-hover text-text-primary font-heading text-2xl font-semibold hover:bg-bg-active active:scale-95 active:bg-accent-primary active:text-text-inverse transition-all duration-100"
          >
            {num}
          </button>
        ))}

        {/* Bottom row: Clear, 0, Backspace */}
        <button
          onClick={handleClear}
          className="w-[72px] h-[72px] rounded-2xl bg-bg-hover text-text-muted text-small font-medium hover:bg-bg-active hover:text-text-secondary transition-all duration-100"
        >
          CLR
        </button>
        <button
          onClick={() => handleDigit('0')}
          className="w-[72px] h-[72px] rounded-2xl bg-bg-hover text-text-primary font-heading text-2xl font-semibold hover:bg-bg-active active:scale-95 active:bg-accent-primary active:text-text-inverse transition-all duration-100"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-[72px] h-[72px] rounded-2xl bg-bg-hover text-text-secondary hover:bg-bg-active hover:text-accent-danger flex items-center justify-center transition-all duration-100"
          aria-label="Delete"
        >
          <Delete size={24} />
        </button>
      </div>
    </div>
  );
}
