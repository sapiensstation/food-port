'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = useCartStore((s) => s.itemCount());
  const total = useCartStore((s) => s.total());
  const tableNumber = useCartStore((s) => s.tableNumber);

  const isWelcome = pathname === '/order';
  const isConfirmation = pathname.startsWith('/order/confirmation');
  const showCartBar = !isWelcome && !isConfirmation && itemCount > 0;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/6 px-4 py-3 flex items-center gap-3">
        {!isWelcome && (
          <button
            onClick={() => router.back()}
            className="text-brand-dim hover:text-brand-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex-1">
          <span className="font-heading text-xl text-brand-orange tracking-widest">
            FOOD VILLAGE
          </span>
          {tableNumber && (
            <span className="ml-3 text-xs font-mono text-brand-dim">
              Table {tableNumber}
            </span>
          )}
        </div>
        {!isConfirmation && (
          <Link href="/order/cart" className="relative p-2">
            <svg className="w-6 h-6 text-brand-chrome" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.35 2.7A2 2 0 007.5 19h9a2 2 0 001.85-2.3L17 13M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Cart bottom bar */}
      {showCartBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
          <Link
            href="/order/cart"
            className="flex items-center justify-between w-full bg-brand-orange rounded-2xl px-5 py-4 shadow-xl shadow-orange-900/40"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white/20 text-white text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center font-mono">
                {itemCount}
              </span>
              <span className="text-white font-semibold text-sm">View Cart</span>
            </div>
            <span className="text-white font-mono font-bold text-sm">
              ${total.toFixed(2)}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
