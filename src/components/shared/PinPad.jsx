import { useState, useCallback, useEffect } from 'react';
import { Delete, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * PinPad — variable-length PIN entry keypad (4–8 digits).
 * Used on Login screen and IdleLock overlay.
 * Submits on Enter key or Submit button press — NOT auto-submit at fixed length.
 */
export default function PinPad({ onSubmit, error, minLength = 4, maxLength = 8 }) {
  const [pin, setPin] = useState('');

  const handleDigit = useCallback((digit) => {
    setPin((prev) => {
      if (prev.length >= maxLength) return prev;
      return prev + digit;
    });
  }, [maxLength]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
  }, []);

  const handleSubmit = useCallback(() => {
    if (pin.length >= minLength) {
      onSubmit(pin);
    }
  }, [pin, minLength, onSubmit]);

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
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear, handleSubmit]);

  const canSubmit = pin.length >= minLength;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* PIN dots display — shows filled dots for entered digits, empty for remaining min */}
      <div className="flex items-center gap-3">
        {Array.from({ length: Math.max(minLength, pin.length) }).map((_, i) => (
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

        {/* Bottom row: Clear, 0, Submit */}
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
          onClick={canSubmit ? handleSubmit : handleDelete}
          className={cn(
            'w-[72px] h-[72px] rounded-2xl flex items-center justify-center transition-all duration-100',
            canSubmit
              ? 'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover active:scale-95'
              : 'bg-bg-hover text-text-secondary hover:bg-bg-active hover:text-accent-danger'
          )}
          aria-label={canSubmit ? 'Submit' : 'Delete'}
        >
          {canSubmit ? <ArrowRight size={24} /> : <Delete size={24} />}
        </button>
      </div>
    </div>
  );
}
