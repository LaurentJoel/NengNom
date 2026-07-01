'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { adminService } from '@/lib/admin-service';

interface Alert {
  id: string;
  diseaseName: string;
  region: string;
  country: string;
  severity: string;
  isConfirmed: boolean;
  createdAt: string;
  reportedBy?: { fullName: string; role: string };
}

const SEVERITY_COLOR: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const COUNTRIES: Record<string, string> = { CM: 'Cameroun', CG: 'Congo', GA: 'Gabon', SN: 'Sénégal', CI: "Côte d'Ivoire" };

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    diseaseName: '',
    region: '',
    country: 'CM',
    severity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    isConfirmed: false,
  });

  const load = async () => {
    setLoading(true);
    const res = await adminService.listAlerts();
    if (res.success && res.data) setAlerts(res.data as Alert[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette alerte ?')) return;
    setDeleting(id);
    await adminService.deleteAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.diseaseName || !form.region) return;
    setSubmitting(true);
    const res = await adminService.createAlert(form);
    if (res.success && res.data) {
      setAlerts((prev) => [res.data as Alert, ...prev]);
      setForm({ diseaseName: '', region: '', country: 'CM', severity: 'MEDIUM', isConfirmed: false });
      setShowForm(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Alertes maladies</h1>
          <p className="text-sm text-neutral-500 mt-1">{alerts.length} alerte{alerts.length !== 1 ? 's' : ''} active{alerts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Plus size={15} />
          Nouvelle alerte
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-neutral-900">Créer une alerte maladie</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Maladie *</label>
              <input
                value={form.diseaseName}
                onChange={(e) => setForm({ ...form, diseaseName: e.target.value })}
                placeholder="Newcastle, Gumboro..."
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Région *</label>
              <input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="Littoral, Centre..."
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Pays</label>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                {Object.entries(COUNTRIES).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Sévérité</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as any })}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Modérée</option>
                <option value="HIGH">Élevée</option>
                <option value="CRITICAL">Critique</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isConfirmed}
              onChange={(e) => setForm({ ...form, isConfirmed: e.target.checked })}
              className="rounded"
            />
            Cas confirmé
          </label>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Publier
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Alerts list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl">
          <AlertTriangle size={32} className="mx-auto text-neutral-300 mb-2" />
          <p className="text-sm text-neutral-500">Aucune alerte active</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-neutral-900">{alert.diseaseName}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_COLOR[alert.severity]}`}>
                      {alert.severity}
                    </span>
                    {alert.isConfirmed ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                        <CheckCircle size={11} /> Confirmé
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <XCircle size={11} /> Non confirmé
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {alert.region} · {COUNTRIES[alert.country] || alert.country}
                    {alert.reportedBy && ` · Signalé par ${alert.reportedBy.fullName}`}
                    {' · '}{new Date(alert.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(alert.id)}
                disabled={deleting === alert.id}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {deleting === alert.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
