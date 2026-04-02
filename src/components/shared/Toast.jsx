import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';

// Toast context for global toast management
const ToastContext = createContext(null);

/**
 * Toast notification — slides in from right, auto-dismisses.
 * 4 variants: success, error, warning, info
 */

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const variantClasses = {
  success: 'border-l-4 border-l-accent-primary',
  error: 'border-l-4 border-l-accent-danger',
  warning: 'border-l-4 border-l-accent-warning',
  info: 'border-l-4 border-l-accent-info',
};

const iconColors = {
  success: 'text-accent-primary',
  error: 'text-accent-danger',
  warning: 'text-accent-warning',
  info: 'text-accent-info',
};

function ToastItem({ toast, onDismiss }) {
  const Icon = icons[toast.variant] || icons.info;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 w-80 p-4 rounded-xl bg-bg-secondary border border-border shadow-md animate-slide-in-right',
        variantClasses[toast.variant]
      )}
    >
      <Icon size={20} className={cn('shrink-0 mt-0.5', iconColors[toast.variant])} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-body font-semibold text-text-primary">{toast.title}</p>
        )}
        <p className="text-small text-text-secondary">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-text-muted hover:text-text-secondary transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/**
 * ToastProvider — wraps the app and provides `useToast()` hook.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ variant = 'info', title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, variant, title, message, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, title) => addToast({ variant: 'success', message, title }),
    error: (message, title) => addToast({ variant: 'error', message, title }),
    warning: (message, title) => addToast({ variant: 'warning', message, title }),
    info: (message, title) => addToast({ variant: 'info', message, title }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container — fixed top-right */}
      {toasts.length > 0 && (
        <div className="fixed top-14 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/**
 * Hook: Access toast notifications.
 * Usage: const toast = useToast(); toast.success('Done!');
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
