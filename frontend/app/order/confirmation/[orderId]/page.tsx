'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import type { Order } from '@/types';
import Spinner from '@/components/ui/Spinner';

const MESSAGES = [
  "Your food is on its way! 🔥",
  "Magic is happening in the kitchen ✨",
  "Good things take time. Great food takes a bit more 😄",
  "Sit tight, chef is on it! 👨‍🍳",
  "Your order is cooking up a storm! ⚡",
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#888888',
  confirmed: '#3B82F6',
  preparing: '#8B5CF6',
  ready: '#10B981',
  completed: '#10B981',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing...',
  ready: 'Ready! ✅',
  completed: 'Completed',
};

export default function ConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgIdx, setMsgIdx] = useState(0);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    apiFetch<Order>(`/orders/${orderId}/status`)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));

    pollRef.current = setInterval(async () => {
      try {
        const updated = await apiFetch<Order>(`/orders/${orderId}/status`);
        setOrder(updated);
        if (updated.status === 'completed') {
          clearInterval(pollRef.current!);
        }
      } catch {}
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function resetTimer() {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        router.push('/order');
      }, 60000);
    }
    resetTimer();
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('click', resetTimer);
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-brand-dim">
        Order not found.
      </div>
    );
  }

  const allReady = order.vendor_items.every((v) =>
    ['ready', 'completed'].includes(v.status),
  );

  const tokenStr = String(order.token_number).padStart(3, '0');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-orange/5 blur-3xl" />
        {allReady && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-green-500/10 blur-3xl" />
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm text-center"
      >
        {/* Animation placeholder — cooking emoji animated */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className="text-8xl mb-6 block"
        >
          {allReady ? '🎉' : '👨‍🍳'}
        </motion.div>

        {/* Token display */}
        <div className="mb-2">
          <p className="text-brand-dim font-mono text-sm tracking-widest mb-1">YOUR TOKEN</p>
          <motion.h1
            key={tokenStr}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-heading text-[96px] leading-none text-brand-orange token-glow"
          >
            #{tokenStr}
          </motion.h1>
        </div>

        {/* Message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-brand-chrome font-body text-base mb-8"
          >
            {allReady ? "Everything's ready! Come collect your order 🎉" : MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>

        {/* Vendor status rows */}
        <div className="glass rounded-2xl p-4 space-y-3 text-left mb-6">
          <h3 className="font-heading text-lg text-brand-white tracking-wide">ORDER STATUS</h3>
          {order.vendor_items.map((v) => (
            <div key={v.vendor_id} className="flex items-center justify-between">
              <span className="text-sm font-body text-brand-chrome">{v.vendor_name}</span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={{
                  color: STATUS_COLORS[v.status] ?? '#888',
                  backgroundColor: `${STATUS_COLORS[v.status] ?? '#888'}18`,
                }}
              >
                {STATUS_LABELS[v.status] ?? v.status}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push('/order')}
          className="text-brand-dim text-sm hover:text-brand-white transition-colors"
        >
          Start a new order →
        </button>
      </motion.div>
    </div>
  );
}
