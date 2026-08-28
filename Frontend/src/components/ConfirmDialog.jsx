import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  loading,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !loading) onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-3xl border border-line bg-panel p-6 shadow-pop"
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-muted">{message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="btn-secondary" disabled={loading}>
                Cancel
              </button>
              <button onClick={onConfirm} className="btn-danger" disabled={loading}>
                {loading ? 'Deleting…' : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
