'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { AuditLog } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

const ACTION_COLOR: Record<string, string> = {
  'order.cancel': '#EF4444',
  'vendor.delete': '#EF4444',
  'vendor.suspend': '#F59E0B',
  'promotion.delete': '#EF4444',
  'staff.remove': '#EF4444',
  'vendor.create': '#10B981',
  'promotion.create': '#10B981',
  'vendor.update': '#3B82F6',
  'order.status_update': '#3B82F6',
  'promotion.update': '#3B82F6',
  'cash.log': '#8B5CF6',
};

interface AuditResult { logs: AuditLog[]; total: number; page: number; pages: number; }

export default function AdminAuditPage() {
  const [data, setData] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10); });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30', from, to });
      if (actionFilter) params.set('action', actionFilter);
      const res = await apiFetch<AuditResult>(`/admin/audit?${params}`);
      setData(res);
    } catch {}
    setLoading(false);
  }, [page, from, to, actionFilter]);

  useEffect(() => { load(); }, [load]);

  const COMMON_ACTIONS = ['order.cancel', 'vendor.create', 'vendor.suspend', 'vendor.update', 'promotion.create', 'promotion.delete', 'staff.remove', 'cash.log'];

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-heading text-4xl text-brand-white tracking-widest mb-6">AUDIT LOG</h1>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap mb-5">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-brand-card border border-white/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
        <span className="text-brand-dim">to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-brand-card border border-white/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60" />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-brand-card border border-white/10 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-orange/60"
        >
          <option value="">All Actions</option>
          {COMMON_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          <GlassCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/6">
                <tr className="text-brand-dim text-xs uppercase tracking-wider">
                  {['Time', 'Actor', 'Role', 'Action', 'Entity', 'Details'].map((h) => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {(data?.logs ?? []).map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-brand-dim text-xs font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-brand-chrome text-sm">{log.actor_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-brand-steel text-brand-dim capitalize">{log.actor_role.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs font-semibold"
                          style={{ color: ACTION_COLOR[log.action] ?? '#888888' }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brand-dim text-xs font-mono">{log.entity_type}{log.entity_id ? `/${log.entity_id.slice(0, 8)}` : ''}</td>
                      <td className="px-4 py-3 text-brand-dim text-xs">{expanded === log.id ? '▲' : '▼'}</td>
                    </tr>
                    {expanded === log.id && (
                      <tr key={`${log.id}-exp`} className="bg-brand-bg/40">
                        <td colSpan={6} className="px-6 py-3">
                          <pre className="text-xs text-brand-dim font-mono bg-brand-bg rounded-lg p-3 overflow-auto max-h-32">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {(data?.logs ?? []).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-dim">No audit log entries for this range</td></tr>
                )}
              </tbody>
            </table>
          </GlassCard>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-brand-dim font-mono">{data.total} entries</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <span className="px-3 py-1.5 text-brand-dim">{page} / {data.pages}</span>
                <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
