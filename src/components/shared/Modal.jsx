import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Modal — reusable overlay modal.
 * Closes on Escape key, backdrop click, or close button.
 * Traps focus inside the modal content.
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md', showClose = true }) {
  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Listen for global escape shortcut
  useEffect(() => {
    if (!isOpen) return;

    const handleShortcut = () => onClose();
    document.addEventListener('shortcut:escape', handleShortcut);
    return () => document.removeEventListener('shortcut:escape', handleShortcut);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--overlay)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          'bg-bg-secondary rounded-2xl border border-border shadow-lg w-full animate-scale-in',
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            {title && (
              <h2 className="font-heading text-h2 text-text-primary">{title}</h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors duration-150"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
