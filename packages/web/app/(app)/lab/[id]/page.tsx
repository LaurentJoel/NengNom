'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Phone, Loader2 } from 'lucide-react';
import { labRequestsService } from '@/lib/lab-requests-service';
import { useLanguage } from '@/lib/i18n';

const STATUS_ORDER = [
  'REQUESTED',
  'SCHEDULED',
  'TECHNICIAN_DISPATCHED',
  'SAMPLES_COLLECTED',
  'ANALYZING',
  'RESULTS_READY',
  'DELIVERED',
];

const TEST_TYPE_LABELS: Record<string, string> = {
  DISEASE_DIAGNOSIS: 'Diagnostic de maladie',
  PARASITOLOGY: 'Parasitologie',
  HEMATOLOGY: 'Hématologie',
  BACTERIOLOGY: 'Bactériologie',
  WATER_QUALITY: "Qualité de l'eau",
  BIOSECURITY_AUDIT: 'Audit biosécurité',
  FEED_QUALITY: 'Qualité des aliments',
};

const STEP_LABELS: Record<string, string> = {
  REQUESTED: 'Demande reçue',
  SCHEDULED: 'Planifiée',
  TECHNICIAN_DISPATCHED: 'Technicien en route',
  SAMPLES_COLLECTED: 'Échantillons collectés',
  ANALYZING: 'Analyse en cours',
  RESULTS_READY: 'Résultats prêts',
  DELIVERED: 'Livré',
};

const STEP_DESCS: Record<string, string> = {
  REQUESTED: 'Votre demande a été reçue et est en cours de traitement.',
  SCHEDULED: 'Un rendez-vous a été fixé pour la collecte.',
  TECHNICIAN_DISPATCHED: 'Le technicien se dirige vers votre ferme.',
  SAMPLES_COLLECTED: 'Les échantillons ont été collectés et envoyés au laboratoire.',
  ANALYZING: 'Les analyses sont en cours au laboratoire.',
  RESULTS_READY: 'Les résultats sont disponibles.',
  DELIVERED: 'Les résultats vous ont été transmis.',
};

interface LabRequestShape {
  id: string;
  status: string;
  testType: string;
  gpsLocation: string;
  priceQuoted?: number;
  scheduledAt?: string;
  resultUrl?: string;
  vetReview?: string;
  instructions?: string;
  createdAt: string;
  vet?: { user?: { fullName?: string; phone?: string } };
  technician?: { user?: { fullName?: string; phone?: string } };
}

export default function LabDetailPage({ params }: { params: { id: string } }) {
  const { t, locale } = useLanguage();
  const [req, setReq] = useState<LabRequestShape | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    labRequestsService.getRequest(params.id).then((res) => {
      if (res.success && res.data) {
        setReq(res.data as unknown as LabRequestShape);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!req) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Analyse introuvable.</p>
        <Link href="/lab" className="text-brand-700 text-sm mt-2 inline-block hover:underline">← Retour aux analyses</Link>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(req.status);
  const testLabel = TEST_TYPE_LABELS[req.testType] || req.testType;

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/lab" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-200 transition-colors text-neutral-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-xl text-brand-900">{testLabel}</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{req.gpsLocation}</p>
        </div>
      </div>

      {/* Progress tracker */}
      <section className="bg-white border border-sand-200 rounded-2xl p-6">
        <ol className="space-y-0">
          {STATUS_ORDER.map((status, i) => {
            const isDone = i < currentIdx;
            const isActive = i === currentIdx;
            return (
              <li key={status} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative ${
                      isDone ? 'bg-brand-600' : isActive ? 'bg-brand-800' : 'bg-sand-200'
                    }`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {isActive && (
                      <span className="absolute inset-0 rounded-full bg-brand-800 animate-pulse-ring" aria-hidden="true" />
                    )}
                    {isDone ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className={`w-3 h-3 rounded-full ${isActive ? 'bg-white' : 'bg-sand-300'}`} />
                    )}
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={`w-0.5 h-8 mt-1 ${isDone ? 'bg-brand-400' : 'bg-sand-200'}`} aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 pt-1 pb-7">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${isActive ? 'text-brand-800' : isDone ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      {STEP_LABELS[status]}
                    </p>
                    {isActive && (
                      <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">{t.lab.inProgress}</span>
                    )}
                  </div>
                  {(isDone || isActive) && (
                    <p className="text-xs text-neutral-500 mt-0.5">{STEP_DESCS[status]}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Info */}
      <section className="mt-4 bg-brand-50 border border-brand-100 rounded-2xl p-5">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {req.scheduledAt && (
            <div>
              <dt className="text-xs text-neutral-500">{t.lab.appointment}</dt>
              <dd className="font-semibold text-neutral-900 mt-0.5">
                <time>{new Date(req.scheduledAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' })}</time>
              </dd>
            </div>
          )}
          {req.priceQuoted && (
            <div>
              <dt className="text-xs text-neutral-500">{t.lab.amount}</dt>
              <dd className="font-semibold text-neutral-900 mt-0.5">{Number(req.priceQuoted).toLocaleString('fr-FR')} FCFA</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-neutral-500">Date de demande</dt>
            <dd className="font-semibold text-neutral-900 mt-0.5">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</dd>
          </div>
          {req.vet?.user?.fullName && (
            <div>
              <dt className="text-xs text-neutral-500">Vétérinaire</dt>
              <dd className="font-semibold text-neutral-900 mt-0.5">Dr. {req.vet.user.fullName}</dd>
            </div>
          )}
        </dl>
        {req.technician?.user?.fullName && (
          <div className="mt-4 pt-4 border-t border-brand-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">{t.lab.assignedTech}</p>
              <p className="text-sm font-medium text-neutral-900 mt-0.5">{req.technician.user.fullName}</p>
            </div>
            {req.technician.user.phone && (
              <a
                href={`tel:${req.technician.user.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-200 text-brand-800 text-xs font-medium rounded-lg hover:bg-brand-100 transition-colors"
              >
                <Phone className="w-3 h-3" />
                {t.lab.call}
              </a>
            )}
          </div>
        )}
        {req.instructions && (
          <div className="mt-3 pt-3 border-t border-brand-100">
            <p className="text-xs text-neutral-500 mb-1">Instructions</p>
            <p className="text-sm text-neutral-700">{req.instructions}</p>
          </div>
        )}
      </section>

      {(req.resultUrl || req.vetReview) && (
        <section className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-green-700 mb-2">{t.lab.resultsAvailable}</p>
          {req.vetReview && (
            <p className="text-sm text-neutral-700 leading-relaxed">{req.vetReview}</p>
          )}
          {req.resultUrl && (
            <a
              href={req.resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              {t.lab.downloadReport}
            </a>
          )}
        </section>
      )}
    </div>
  );
}
