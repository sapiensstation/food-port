'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

const TAX_RATE = 0.0825;

interface CartStore {
  items: CartItem[];
  sessionId: string | null;
  tableId: string | null;
  tableNumber: string | null;

  addItem: (item: Omit<CartItem, 'itemKey'>) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  removeItem: (itemKey: string) => void;
  clearCart: () => void;
  setSession: (sessionId: string, tableId: string, tableNumber: string) => void;

  itemCount: () => number;
  subtotal: () => number;
  tax: () => number;
  total: () => number;
  itemsByVendor: () => Record<string, CartItem[]>;
}

function makeItemKey(item: Omit<CartItem, 'itemKey'>): string {
  const modKey = item.selectedModifiers
    .map((m) => m.modifierId)
    .sort()
    .join(',');
  return `${item.menuItemId}::${modKey}::${item.specialInstructions}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: null,
      tableId: null,
      tableNumber: null,

      addItem: (item) => {
        const key = makeItemKey(item);
        set((state) => {
          const existing = state.items.find((i) => i.itemKey === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.itemKey === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, itemKey: key }] };
        });
      },

      updateQuantity: (itemKey, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemKey);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.itemKey === itemKey ? { ...i, quantity } : i,
          ),
        }));
      },

      removeItem: (itemKey) => {
        set((state) => ({
          items: state.items.filter((i) => i.itemKey !== itemKey),
        }));
      },

      clearCart: () => set({ items: [] }),

      setSession: (sessionId, tableId, tableNumber) => {
        set({ sessionId, tableId, tableNumber });
      },

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => {
          const modTotal = i.selectedModifiers.reduce(
            (ms, m) => ms + m.priceDelta,
            0,
          );
          return sum + (i.unitPrice + modTotal) * i.quantity;
        }, 0),

      tax: () => get().subtotal() * TAX_RATE,

      total: () => get().subtotal() + get().tax(),

      itemsByVendor: () => {
        const grouped: Record<string, CartItem[]> = {};
        for (const item of get().items) {
          if (!grouped[item.vendorId]) grouped[item.vendorId] = [];
          grouped[item.vendorId].push(item);
        }
        return grouped;
      },
    }),
    { name: 'fv-cart' },
  ),
);
