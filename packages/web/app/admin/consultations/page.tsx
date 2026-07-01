'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Loader2, Filter } from 'lucide-react';
import { adminService } from '@/lib/admin-service';

interface Consultation {
  id: string;
  status: string;
  type: string;
  fee?: number;
  symptomsDescription?: string;
  createdAt: string;
  farmer?: { user?: { fullName: string; phone: string } };
  vet?: { user?: { fullName: string; phone: string } };
  _count?: { messages: number };
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-green-100 text-green-700',
  CLOSED: 'bg-neutral-100 text-neutral-600',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Active',
  CLOSED: 'Terminée',
};

export default function AdminConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminService.listConsultations(page, 20, statusFilter || undefined);
    if (res.success && res.data) {
      const d = res.data as any;
      setConsultations(d.consultations || []);
      setTotal(d.total || 0);
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Consultations</h1>
        <p className="text-sm text-neutral-500 mt-1">{total} consultation{total !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Filter */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex gap-3">
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2">
          <Filter size={14} className="text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-neutral-700 focus:outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="ACTIVE">Actives</option>
            <option value="CLOSED">Terminées</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          </div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={32} className="mx-auto text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500">Aucune consultation</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Éleveur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Vétérinaire</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Messages</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Frais</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {consultations.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-neutral-900">{c.farmer?.user?.fullName || '—'}</p>
                    <p className="text-xs text-neutral-400 font-mono">{c.farmer?.user?.phone || ''}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-neutral-800">{c.vet?.user?.fullName || 'Non assigné'}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status] || 'bg-neutral-100 text-neutral-600'}`}>
                      {STATUS_LABEL[c.status] || c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-neutral-600 text-xs">
                    {c._count?.messages ?? 0} msg
                  </td>
                  <td className="px-4 py-3.5 text-neutral-600 text-xs">
                    {c.fee ? `${Number(c.fee).toLocaleString('fr-FR')} FCFA` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-500 text-xs">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-40 transition-colors">Précédent</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-40 transition-colors">Suivant</button>
          </div>
        </div>
      )}
    </div>
  );
}
