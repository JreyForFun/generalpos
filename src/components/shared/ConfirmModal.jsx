import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

/**
 * ConfirmModal — destructive action confirmation dialog.
 * Shows warning icon with confirm/cancel buttons.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning'
}) {
  const colors = {
    danger: {
      icon: 'text-accent-danger',
      btn: 'bg-accent-danger hover:bg-accent-danger-hover',
    },
    warning: {
      icon: 'text-accent-warning',
      btn: 'bg-accent-warning hover:bg-accent-warning-hover text-text-inverse',
    },
  };

  const color = colors[variant] || colors.danger;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-4">
          <AlertTriangle size={28} className={color.icon} />
        </div>

        <h3 className="font-heading text-h2 text-text-primary mb-2">{title}</h3>
        <p className="text-body text-text-secondary mb-6 max-w-sm">{message}</p>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-bg-hover text-text-secondary font-medium hover:bg-bg-active hover:text-text-primary transition-all duration-150"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 h-11 rounded-xl text-white font-medium transition-all duration-150 ${color.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
