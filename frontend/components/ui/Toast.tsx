'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';

const typeStyles = {
  success: 'border-green-500/40 bg-green-500/10 text-green-300',
  error: 'border-red-500/40 bg-red-500/10 text-red-300',
  warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  info: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
};

const typeIcons = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border glass text-sm font-body max-w-sm ${typeStyles[t.type]}`}
            onClick={() => removeToast(t.id)}
          >
            <span className="text-base font-bold">{typeIcons[t.type]}</span>
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
