'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import { adminService } from '@/lib/admin-service';

interface AdminUser {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  region?: string;
  country?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  farmerProfile?: { farmName: string; farmType: string; animalCount: number } | null;
  vetProfile?: { specialization: string; licenseNumber: string } | null;
}

const ROLE_COLOR: Record<string, string> = {
  FARMER: 'bg-green-100 text-green-700',
  VET: 'bg-blue-100 text-blue-700',
  LAB_TECH: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-red-100 text-red-700',
};

const ROLE_LABEL: Record<string, string> = {
  FARMER: 'Éleveur',
  VET: 'Vétérinaire',
  LAB_TECH: 'Labo',
  ADMIN: 'Admin',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [query, setQuery] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminService.listUsers(page, 20, roleFilter || undefined, query || undefined);
    if (res.success && res.data) {
      const d = res.data as any;
      setUsers(d.users || []);
      setTotal(d.total || 0);
    }
    setLoading(false);
  }, [page, roleFilter, query]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (user: AdminUser) => {
    if (user.role === 'ADMIN') return;
    setToggling(user.id);
    const res = await adminService.toggleUserStatus(user.id, !user.isActive);
    if (res.success) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    }
    setToggling(null);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Gestion des utilisateurs</h1>
        <p className="text-sm text-neutral-500 mt-1">{total} utilisateur{total !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 flex-1 min-w-48">
          <Search size={14} className="text-neutral-400 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Rechercher par nom ou téléphone..."
            className="bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none flex-1"
          />
        </div>
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2">
          <Filter size={14} className="text-neutral-400" />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-neutral-700 focus:outline-none"
          >
            <option value="">Tous les rôles</option>
            <option value="FARMER">Éleveurs</option>
            <option value="VET">Vétérinaires</option>
            <option value="LAB_TECH">Lab Techs</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users size={32} className="mx-auto text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Téléphone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Rôle</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Région</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Inscrit le</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Statut</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-neutral-900">{u.fullName}</p>
                    {u.farmerProfile && (
                      <p className="text-xs text-neutral-400">{u.farmerProfile.farmName} · {u.farmerProfile.animalCount.toLocaleString()} têtes</p>
                    )}
                    {u.vetProfile && (
                      <p className="text-xs text-neutral-400">{u.vetProfile.specialization}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-600 font-mono text-xs">{u.phone}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[u.role] || 'bg-neutral-100 text-neutral-600'}`}>
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-neutral-600 text-xs">{u.region || '—'}</td>
                  <td className="px-4 py-3.5 text-neutral-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className={`text-xs font-medium ${u.isActive ? 'text-green-700' : 'text-red-600'}`}>
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleToggle(u)}
                        disabled={toggling === u.id}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          u.isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        }`}
                      >
                        {toggling === u.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : u.isActive ? (
                          <XCircle size={12} />
                        ) : (
                          <CheckCircle size={12} />
                        )}
                        {u.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                    )}
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
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-40 transition-colors"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-40 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
