'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch, apiPost } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import type { AdminOrder, OrderStatus } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'partially_ready', 'ready', 'completed', 'cancelled'];
const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#F59E0B', partially_ready: '#8B5CF6',
  ready: '#10B981', completed: '#6B7280', cancelled: '#EF4444',
};

interface OrdersResult {
  orders: AdminOrder[];
  total: number;
  page: number;
  pages: number;
}

export default function AdminOrdersPage() {
  const [data, setData] = useState<OrdersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiFetch<OrdersResult>(`/admin/orders?${params}`);
      setData(res);
    } catch {}
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleCancel() {
    if (!selected || !cancelReason) return;
    setCancelling(true);
    try {
      await apiPost(`/admin/orders/${selected.id}/cancel`, { reason: cancelReason });
      addToast({ message: `Order #${String(selected.token_number).padStart(3,'0')} cancelled`, type: 'success' });
      setCancelOpen(false);
      setSelected(null);
      load();
    } catch {
      addToast({ message: 'Failed to cancel order', type: 'error' });
    } finally {
      setCancelling(false);
    }
  }

  function exportCSV() {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/export${statusFilter ? `?status=${statusFilter}` : ''}`, '_blank');
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-4xl text-brand-white tracking-widest">ORDERS</h1>
        <Button variant="secondary" size="sm" onClick={exportCSV}>Export CSV</Button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!statusFilter ? 'bg-brand-orange text-white' : 'bg-brand-card text-brand-dim hover:text-brand-white'}`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${statusFilter === s ? 'bg-brand-orange text-white' : 'bg-brand-card text-brand-dim hover:text-brand-white'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <GlassCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/6">
                <tr className="text-brand-dim text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Token</th>
                  <th className="text-left px-4 py-3">Table</th>
                  <th className="text-left px-4 py-3">Items</th>
                  <th className="text-left px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {(data?.orders ?? []).map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelected(order)}
                    className="hover:bg-white/2 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 font-heading text-2xl text-brand-orange">
                      #{String(order.token_number).padStart(3, '0')}
                    </td>
                    <td className="px-4 py-3 text-brand-chrome">T{order.table_number}</td>
                    <td className="px-4 py-3 text-brand-dim">{order.item_count} item{order.item_count !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 font-mono text-brand-yellow">${order.total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={{ backgroundColor: `${STATUS_COLOR[order.status] ?? '#888'}22`, color: STATUS_COLOR[order.status] ?? '#888' }}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-brand-dim text-xs font-mono">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-brand-dim font-mono">{data.total} total</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <span className="px-3 py-1.5 text-brand-dim">{page} / {data.pages}</span>
                <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order detail modal */}
      <Modal isOpen={!!selected && !cancelOpen} onClose={() => setSelected(null)} title={`Order #${String(selected?.token_number ?? 0).padStart(3,'0')}`} size="lg">
        {selected && (
          <div className="p-5 space-y-4">
            <div className="flex gap-4 text-sm">
              <div><p className="text-brand-dim text-xs">Table</p><p className="text-brand-white">T{selected.table_number}</p></div>
              <div><p className="text-brand-dim text-xs">Status</p>
                <span className="capitalize" style={{ color: STATUS_COLOR[selected.status] }}>{selected.status.replace('_', ' ')}</span>
              </div>
              <div><p className="text-brand-dim text-xs">Total</p><p className="font-mono text-brand-yellow">${selected.total.toFixed(2)}</p></div>
            </div>

            <div>
              <p className="text-xs text-brand-dim uppercase tracking-wider mb-2">Items</p>
              <div className="space-y-1.5">
                {selected.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center px-3 py-2 bg-brand-bg/60 rounded-lg">
                    <div>
                      <p className="text-sm text-brand-white">{item.quantity}× {item.item_name}</p>
                      <p className="text-xs font-mono" style={{ color: item.vendor?.booth_color ?? '#888' }}>{item.vendor?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-brand-yellow text-sm">${item.total_price.toFixed(2)}</p>
                      <span className="text-xs capitalize" style={{ color: STATUS_COLOR[item.status] }}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selected.status !== 'cancelled' && selected.status !== 'completed' && (
              <Button
                variant="danger"
                size="md"
                className="w-full"
                onClick={() => setCancelOpen(true)}
              >
                Cancel Order
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel reason modal */}
      <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Order" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-brand-dim">Provide a reason for cancellation:</p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            placeholder="e.g. Customer request, kitchen closed…"
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60 resize-none"
          />
          <div className="flex gap-2">
            <Button variant="danger" size="md" className="flex-1" loading={cancelling} onClick={handleCancel} disabled={!cancelReason}>
              Confirm Cancel
            </Button>
            <Button variant="ghost" size="md" onClick={() => setCancelOpen(false)}>Back</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
