'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FlaskConical, Loader2 } from 'lucide-react';
import { labRequestsService } from '@/lib/lab-requests-service';
import { useLanguage } from '@/lib/i18n';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  REQUESTED: { label: 'Reçue', cls: 'bg-sand-200 text-neutral-600' },
  SCHEDULED: { label: 'Planifiée', cls: 'bg-blue-100 text-blue-700' },
  TECHNICIAN_DISPATCHED: { label: 'Technicien en route', cls: 'bg-amber-100 text-amber-700' },
  SAMPLES_COLLECTED: { label: 'Échantillons collectés', cls: 'bg-brand-100 text-brand-700' },
  ANALYZING: { label: 'Analyse en cours', cls: 'bg-blue-100 text-blue-700' },
  RESULTS_READY: { label: 'Résultats prêts', cls: 'bg-green-100 text-green-700' },
  DELIVERED: { label: 'Livré', cls: 'bg-sand-200 text-neutral-600' },
};

const TEST_TYPE_LABELS: Record<string, string> = {
  DISEASE_DIAGNOSIS: 'Diagnostic de maladie',
  PARASITOLOGY: 'Parasitologie',
  HEMATOLOGY: 'Hématologie',
  BACTERIOLOGY: 'Bactériologie',
  WATER_QUALITY: 'Qualité de l\'eau',
  BIOSECURITY_AUDIT: 'Audit biosécurité',
  FEED_QUALITY: 'Qualité des aliments',
};

interface LabRequest {
  id: string;
  status: string;
  testType: string;
  gpsLocation: string;
  priceQuoted?: number;
  scheduledAt?: string;
  resultUrl?: string;
  vetReview?: string;
  createdAt: string;
  vet?: { user?: { fullName?: string } };
}

export default function LabPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    labRequestsService.listRequests(1, 20).then((res) => {
      if (res.success && res.data) {
        const list = (res.data as any).requests || [];
        setRequests(list);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-900">{t.lab.title}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t.lab.subtitle}</p>
        </div>
        <Link href="/lab/new" className="btn-gradient">
          <Plus className="w-4 h-4" />
          {t.lab.orderTest}
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <FlaskConical className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">{t.lab.noRequests}</p>
          <Link href="/lab/new" className="btn-gradient inline-flex">
            <Plus className="w-4 h-4" />
            {t.lab.orderTest}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const statusInfo = STATUS_CONFIG[req.status] || { label: req.status, cls: 'bg-neutral-100 text-neutral-600' };
            return (
              <Link
                key={req.id}
                href={`/lab/${req.id}`}
                className="group block bg-white border border-sand-200 rounded-2xl p-4 shadow-elevation-sm hover:shadow-elevation-md hover:-translate-y-0.5 hover:border-brand-300/50 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <FlaskConical className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900">
                        {TEST_TYPE_LABELS[req.testType] || req.testType}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    {req.vet?.user?.fullName && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Revue par Dr. {req.vet.user.fullName}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs text-neutral-400">
                        {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {req.priceQuoted && (
                        <p className="text-xs font-medium text-brand-700">
                          {Number(req.priceQuoted).toLocaleString()} FCFA
                        </p>
                      )}
                      {req.resultUrl && (
                        <span className="text-xs text-green-600 font-medium">✓ Résultats disponibles</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
