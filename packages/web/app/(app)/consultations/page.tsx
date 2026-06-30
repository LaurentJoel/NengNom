'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, MessageSquare, Loader2 } from 'lucide-react';
import { consultationsService } from '@/lib/consultations-service';
import { useLanguage } from '@/lib/i18n';

type Tab = 'ACTIVE' | 'PENDING' | 'CLOSED';

interface Consultation {
  id: string;
  status: string;
  type: string;
  symptomsDescription?: string;
  createdAt: string;
  vet?: { user?: { fullName?: string } };
  farmer?: { user?: { fullName?: string } };
  messages?: any[];
}

export default function ConsultationsPage() {
  const [tab, setTab] = useState<Tab>('ACTIVE');
  const { t } = useLanguage();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    consultationsService.listConsultations(1, 50).then((res) => {
      if (res.success && res.data) {
        const list = (res.data as any).consultations || [];
        setConsultations(list);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = consultations.filter((c) => c.status === tab);

  const counts = {
    ACTIVE: consultations.filter((c) => c.status === 'ACTIVE').length,
    PENDING: consultations.filter((c) => c.status === 'PENDING').length,
    CLOSED: consultations.filter((c) => c.status === 'CLOSED' || c.status === 'CANCELLED').length,
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'ACTIVE', label: t.consultations.active, count: counts.ACTIVE },
    { id: 'PENDING', label: t.consultations.pending, count: counts.PENDING },
    { id: 'CLOSED', label: t.consultations.history, count: counts.CLOSED },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-900">{t.consultations.title}</h1>
          <p className="text-sm text-neutral-600 mt-1">{t.consultations.subtitle}</p>
        </div>
        <Link href="/consultations/new" className="btn-gradient">
          <Plus className="w-4 h-4" />
          {t.consultations.new}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-sand-200 rounded-xl p-1 w-fit">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === item.id ? 'tab-active' : 'text-neutral-600 hover:text-neutral-900 hover:bg-sand-100'
            }`}
          >
            {item.label}
            {item.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === item.id ? 'bg-brand-700 text-white' : 'bg-sand-200 text-neutral-600'
              }`}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Consultation cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune consultation dans cette catégorie.</p>
            {tab === 'PENDING' || tab === 'ACTIVE' ? (
              <Link href="/consultations/new" className="mt-3 inline-block text-sm text-brand-700 underline">
                Démarrer une consultation
              </Link>
            ) : null}
          </div>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.id}
              href={`/consultations/${c.id}`}
              className="group block bg-white border border-sand-200 rounded-2xl p-4 shadow-elevation-sm hover:shadow-elevation-md hover:-translate-y-0.5 hover:border-brand-300/50 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      Dr. {c.vet?.user?.fullName || 'Vétérinaire'}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      c.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                    {c.symptomsDescription || 'Consultation ' + c.type}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1.5">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
