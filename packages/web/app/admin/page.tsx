'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, FlaskConical, AlertTriangle, TrendingUp, Bird, Loader2 } from 'lucide-react';
import { adminService } from '@/lib/admin-service';

interface Stats {
  users: { total: number; farmers: number; vets: number; labTechs: number };
  consultations: { total: number; active: number };
  labRequests: number;
  communityPosts: number;
  diseaseAlerts: number;
  totalRevenueFCFA: number;
  recentUsers: Array<{ id: string; fullName: string; role: string; createdAt: string; isActive: boolean }>;
}

const ROLE_LABEL: Record<string, string> = {
  FARMER: 'Éleveur',
  VET: 'Vétérinaire',
  LAB_TECH: 'Labo',
  ADMIN: 'Admin',
};

const ROLE_COLOR: Record<string, string> = {
  FARMER: 'bg-green-100 text-green-700',
  VET: 'bg-blue-100 text-blue-700',
  LAB_TECH: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats().then((res) => {
      if (res.success && res.data) setStats(res.data as Stats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-neutral-500 text-sm">Impossible de charger les statistiques.</p>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Tableau de bord</h1>
        <p className="text-sm text-neutral-500 mt-1">Vue globale de la plateforme Neng-Nom</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Utilisateurs" value={stats.users.total} bg="bg-blue-50" />
        <StatCard icon={<Bird className="w-5 h-5 text-green-600" />} label="Éleveurs" value={stats.users.farmers} bg="bg-green-50" />
        <StatCard icon={<MessageSquare className="w-5 h-5 text-indigo-600" />} label="Consultations" value={stats.consultations.total} sub={`${stats.consultations.active} actives`} bg="bg-indigo-50" />
        <StatCard icon={<FlaskConical className="w-5 h-5 text-purple-600" />} label="Demandes labo" value={stats.labRequests} bg="bg-purple-50" />
        <StatCard icon={<Users className="w-5 h-5 text-teal-600" />} label="Vétérinaires" value={stats.users.vets} bg="bg-teal-50" />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} label="Alertes maladies" value={stats.diseaseAlerts} bg="bg-amber-50" />
        <StatCard icon={<Users className="w-5 h-5 text-violet-600" />} label="Posts communauté" value={stats.communityPosts} bg="bg-violet-50" />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          label="Revenus FCFA"
          value={stats.totalRevenueFCFA > 0 ? (stats.totalRevenueFCFA / 1_000_000).toFixed(1) + 'M' : '—'}
          bg="bg-emerald-50"
        />
      </div>

      {/* User breakdown + recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Role breakdown */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h2 className="font-semibold text-sm text-neutral-900 mb-4">Répartition des utilisateurs</h2>
          <div className="space-y-3">
            {[
              { role: 'FARMER', count: stats.users.farmers },
              { role: 'VET', count: stats.users.vets },
              { role: 'LAB_TECH', count: stats.users.labTechs },
            ].map(({ role, count }) => (
              <div key={role} className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[role]}`}>
                  {ROLE_LABEL[role]}
                </span>
                <div className="flex items-center gap-3 flex-1 ml-4">
                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${stats.users.total > 0 ? (count / stats.users.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-neutral-700 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent registrations */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h2 className="font-semibold text-sm text-neutral-900 mb-4">Derniers inscrits</h2>
          <div className="space-y-2">
            {stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-neutral-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{u.fullName}</p>
                  <p className="text-xs text-neutral-400">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[u.role] || 'bg-neutral-100 text-neutral-600'}`}>
                    {ROLE_LABEL[u.role] || u.role}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, bg }: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string; bg: string;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
      <p className="text-xs text-neutral-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-emerald-600 font-medium mt-0.5">{sub}</p>}
    </div>
  );
}
