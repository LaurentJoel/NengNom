'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { farmRecordsService } from '@/lib/farm-records-service';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface FarmRecord {
  id: string;
  recordDate: string;
  animalCount: number;
  mortalityCount: number;
  feedConsumedKg?: number;
  expenses?: number;
  revenue?: number;
  notes?: string;
}

export default function FarmRecordsPage() {
  const { t } = useLanguage();
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [entry, setEntry] = useState({
    recordDate: new Date().toISOString().split('T')[0],
    animalCount: '',
    mortalityCount: '',
    feedConsumedKg: '',
    expenses: '',
    revenue: '',
    notes: '',
  });

  const now = new Date();

  const load = () => {
    setLoading(true);
    farmRecordsService.listRecords(1, 30).then((res) => {
      if (res.success && res.data) {
        const list = (res.data as any).records || [];
        setRecords(list);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.animalCount || !entry.recordDate) return;
    setSubmitting(true);
    await farmRecordsService.createRecord({
      recordDate: entry.recordDate,
      animalCount: Number(entry.animalCount),
      mortalityCount: Number(entry.mortalityCount) || 0,
      feedConsumedKg: Number(entry.feedConsumedKg) || 0,
      expenses: Number(entry.expenses) || 0,
      revenue: Number(entry.revenue) || 0,
      notes: entry.notes || undefined,
    });
    setEntry({
      recordDate: new Date().toISOString().split('T')[0],
      animalCount: '',
      mortalityCount: '',
      feedConsumedKg: '',
      expenses: '',
      revenue: '',
      notes: '',
    });
    setShowForm(false);
    setSubmitting(false);
    load();
  };

  const last7 = records.slice(0, 7).reverse();
  const mortalityChartData = last7.map((r) => ({
    day: new Date(r.recordDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    morts: r.mortalityCount,
  }));
  const animalChartData = last7.map((r) => ({
    day: new Date(r.recordDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    effectif: r.animalCount,
  }));

  const totalMortality7d = last7.reduce((s, r) => s + r.mortalityCount, 0);
  const avgAnimals = last7.length > 0 ? Math.round(last7.reduce((s, r) => s + r.animalCount, 0) / last7.length) : 0;

  return (
    <div className="max-w-content space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-900">{t.farmRecords.title}</h1>
          <p className="text-sm text-neutral-600 mt-1">{t.farmRecords.subtitle}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-gradient">
          <Plus className="w-4 h-4" />
          {t.farmRecords.newEntry}
        </button>
      </div>

      {/* Add entry form */}
      {showForm && (
        <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-elevation-sm">
          <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-4">Nouvelle entrée</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-2 lg:col-span-1">
              <label className="block text-xs font-medium text-neutral-600 mb-1 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={entry.recordDate}
                onChange={(e) => setEntry({ ...entry, recordDate: e.target.value })}
                required
                className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1 uppercase tracking-wide">{t.farmRecords.livestock}</label>
              <input
                type="number"
                value={entry.animalCount}
                onChange={(e) => setEntry({ ...entry, animalCount: e.target.value })}
                required
                placeholder="Ex: 2450"
                className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1 uppercase tracking-wide">{t.farmRecords.mortality}</label>
              <input
                type="number"
                value={entry.mortalityCount}
                onChange={(e) => setEntry({ ...entry, mortalityCount: e.target.value })}
                placeholder="0"
                className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1 uppercase tracking-wide">Aliment (kg)</label>
              <input
                type="number"
                value={entry.feedConsumedKg}
                onChange={(e) => setEntry({ ...entry, feedConsumedKg: e.target.value })}
                placeholder="Ex: 250"
                className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1 uppercase tracking-wide">Dépenses (FCFA)</label>
              <input
                type="number"
                value={entry.expenses}
                onChange={(e) => setEntry({ ...entry, expenses: e.target.value })}
                placeholder="Ex: 125000"
                className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1 uppercase tracking-wide">Revenus (FCFA)</label>
              <input
                type="number"
                value={entry.revenue}
                onChange={(e) => setEntry({ ...entry, revenue: e.target.value })}
                placeholder="Ex: 650000"
                className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-600"
              />
            </div>
            <div className="col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-neutral-600 mb-1 uppercase tracking-wide">Notes</label>
              <input
                type="text"
                value={entry.notes}
                onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
                placeholder="Observations du jour..."
                className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-600"
              />
            </div>
            <div className="col-span-2 lg:col-span-3 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white border border-sand-200 text-neutral-700 font-medium text-sm py-2.5 rounded-xl hover:bg-sand-100 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={submitting} className="flex-1 btn-gradient disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-sand-200 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Effectif moyen (7j)</p>
          <p className="font-heading font-bold text-xl text-neutral-900">{avgAnimals > 0 ? avgAnimals.toLocaleString() : '—'}</p>
        </div>
        <div className="bg-white border border-sand-200 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Mortalité totale (7j)</p>
          <div className="flex items-center gap-1">
            <p className="font-heading font-bold text-xl text-neutral-900">{totalMortality7d}</p>
            {totalMortality7d > 10 && <TrendingDown className="w-4 h-4 text-red-500" />}
          </div>
        </div>
      </div>

      {/* Charts */}
      {last7.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-sand-200 rounded-xl p-5">
            <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-1">{t.farmRecords.weeklyMortality}</h3>
            <p className="text-xs text-neutral-500 mb-4">{t.farmRecords.last5Weeks}</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={mortalityChartData} barSize={28}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                <Bar dataKey="morts" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-sand-200 rounded-xl p-5">
            <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-1">Effectif (7 derniers jours)</h3>
            <p className="text-xs text-neutral-500 mb-4">Évolution quotidienne</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={animalChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                <Line type="monotone" dataKey="effectif" stroke="#2D6A4F" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Records table */}
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden shadow-elevation-sm">
        <div className="p-5 border-b border-sand-100">
          <h3 className="font-heading font-semibold text-sm text-neutral-900">{t.farmRecords.history}</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">
            Aucune entrée pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-sand-100">
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Effectif</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Mortalité</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Aliment</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-sand-50 hover:bg-sand-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-neutral-700">
                      {new Date(r.recordDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900 tabular-nums">
                      {r.animalCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums">
                      <span className={r.mortalityCount > 5 ? 'text-red-600 font-medium' : 'text-neutral-700'}>
                        {r.mortalityCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 tabular-nums">
                      {r.feedConsumedKg ? `${r.feedConsumedKg}kg` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500 max-w-40 truncate">
                      {r.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
