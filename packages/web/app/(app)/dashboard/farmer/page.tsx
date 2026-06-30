'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bird,
  AlertTriangle,
  MessageSquare,
  Syringe,
  Plus,
  FlaskConical,
  ClipboardList,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Clock,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { aiService } from '@/lib/ai-service';
import { farmRecordsService } from '@/lib/farm-records-service';
import { healthEventsService } from '@/lib/health-events-service';
import { consultationsService } from '@/lib/consultations-service';
import { useAuth } from '@/lib/auth-context';

interface ParsedSuggestion {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

interface AiSuggestionData {
  id: string;
  parsed: ParsedSuggestion[];
  generatedAt: string;
}

interface HealthReminder {
  id: string;
  eventType: string;
  productUsed?: string;
  animalGroup?: string;
  nextDueDate: string;
  daysUntilDue: number;
}

export default function FarmerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [suggestion, setSuggestion] = useState<AiSuggestionData | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(true);
  const [stats, setStats] = useState({ animalCount: 0, mortality: 0, consultations: 0 });
  const [reminders, setReminders] = useState<HealthReminder[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [ratingId, setRatingId] = useState<string | null>(null);

  useEffect(() => {
    // Load AI suggestion
    aiService.getLatestSuggestion().then((res) => {
      if (res.success && res.data) {
        const r = res.data as any;
        let parsed: ParsedSuggestion[] = [];
        try {
          const s = typeof r.suggestion === 'string' ? JSON.parse(r.suggestion) : r.suggestion;
          parsed = Array.isArray(s) ? s : [];
        } catch { /* ignore */ }
        setSuggestion({ id: r.id, parsed, generatedAt: r.generatedAt });
      }
      setSuggestionLoading(false);
    }).catch(() => setSuggestionLoading(false));

    // Load stats from recent farm records
    const now = new Date();
    farmRecordsService.getMonthlyStats(now.getFullYear(), now.getMonth() + 1).then((res) => {
      if (res.success && res.data) {
        const s = res.data as any;
        setStats((prev) => ({
          ...prev,
          animalCount: s.avgAnimalCount || 0,
          mortality: s.totalMortality || 0,
        }));
      }
    });

    // Load health reminders
    healthEventsService.getReminders().then((res) => {
      if (res.success && res.data) {
        setReminders((res.data as any[]).slice(0, 3));
      }
    });

    // Load recent consultations for activity
    consultationsService.listConsultations(1, 5).then((res) => {
      if (res.success && res.data) {
        const list = (res.data as any).consultations || [];
        setActivity(list.slice(0, 3));
        setStats((prev) => ({
          ...prev,
          consultations: list.filter((c: any) => c.status === 'ACTIVE' || c.status === 'PENDING').length,
        }));
      }
    });
  }, []);

  const handleRate = async (helpful: boolean) => {
    if (!suggestion || ratingId) return;
    setRatingId(suggestion.id);
    await aiService.rateSuggestion(suggestion.id, helpful);
  };

  const topSuggestion = suggestion?.parsed?.[0];

  return (
    <div className="max-w-content mx-auto space-y-6">
      {/* AI Suggestion */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-brand-50 border border-amber-200/70 rounded-2xl p-5 shadow-elevation-md hover:shadow-elevation-lg transition-all duration-250 relative overflow-hidden stripe-accent">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-300/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-brand-400/8 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between gap-4 relative">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">{t.dashboard.dailySuggestion}</p>
              {suggestionLoading ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Chargement...
                </div>
              ) : topSuggestion ? (
                <>
                  <p className="font-semibold text-sm text-neutral-900 mb-1">{topSuggestion.title}</p>
                  <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">{topSuggestion.content}</p>
                  <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                    topSuggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                    topSuggestion.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {topSuggestion.priority === 'high' ? 'Urgent' : topSuggestion.priority === 'medium' ? 'Important' : 'Conseil'}
                  </span>
                </>
              ) : (
                <div className="text-sm text-neutral-500">
                  <p>Aucune suggestion disponible.</p>
                  <Link href="/ai-suggestions" className="text-amber-700 underline text-xs">Générer une suggestion</Link>
                </div>
              )}
            </div>
          </div>
          {topSuggestion && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => handleRate(true)}
                disabled={!!ratingId}
                aria-label={t.common.yes}
                className={`w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-amber-200 hover:bg-amber-50 hover:scale-110 hover:shadow-elevation-sm text-amber-600 transition-all duration-200 cursor-pointer disabled:opacity-50 ${ratingId ? 'opacity-50' : ''}`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleRate(false)}
                disabled={!!ratingId}
                aria-label={t.common.no}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-amber-200 hover:bg-amber-50 hover:scale-110 hover:shadow-elevation-sm text-neutral-400 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <div className="mt-3 relative">
          <Link href="/ai-suggestions" className="group text-xs font-medium text-amber-700 hover:text-amber-900 transition-all duration-200 flex items-center gap-1">
            {t.dashboard.allSuggestions} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Bird className="w-5 h-5 text-brand-700" />}
          label={t.dashboard.totalLivestock}
          value={stats.animalCount > 0 ? stats.animalCount.toLocaleString() : '—'}
          sub={`${t.dashboard.thisWeek}`}
          subColor="text-brand-600"
          bg="bg-brand-50"
          border="border-brand-100"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          label={t.dashboard.mortality}
          value={stats.mortality > 0 ? String(stats.mortality) : '0'}
          sub={stats.mortality > 5 ? t.dashboard.watchClosely : 'Ce mois'}
          subColor={stats.mortality > 5 ? 'text-red-500' : 'text-neutral-500'}
          bg="bg-red-50"
          border="border-red-100"
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
          label={t.dashboard.consultationsLabel}
          value={stats.consultations > 0 ? `${stats.consultations} ${t.dashboard.ongoing}` : '—'}
          sub={t.dashboard.seeDetails}
          subColor="text-neutral-500"
          bg="bg-blue-50"
          border="border-blue-100"
          href="/consultations"
        />
        <StatCard
          icon={<Syringe className="w-5 h-5 text-amber-600" />}
          label={t.dashboard.nextVaccine}
          value={reminders[0] ? `${reminders[0].daysUntilDue}j` : '—'}
          sub={reminders[0]?.productUsed || 'Aucun prévu'}
          subColor="text-amber-600"
          bg="bg-amber-50"
          border="border-amber-100"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/consultations/new" className="group btn-gradient">
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          {t.dashboard.newConsultation}
        </Link>
        <Link
          href="/lab/new"
          className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-brand-700 text-brand-800 text-sm font-medium rounded-xl hover:bg-brand-50 hover:shadow-elevation-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
        >
          <FlaskConical className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          {t.dashboard.orderLabTest}
        </Link>
        <Link
          href="/farm-records"
          className="group inline-flex items-center gap-2 px-5 py-2.5 text-brand-700 text-sm font-medium rounded-xl hover:bg-brand-50 hover:shadow-elevation-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
        >
          <ClipboardList className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          {t.dashboard.recordData}
        </Link>
      </div>

      {/* Two column */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent consultations */}
        <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-elevation-sm hover:shadow-elevation-md transition-all duration-250">
          <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-4">{t.dashboard.recentActivity}</h3>
          <div className="space-y-3">
            {activity.length > 0 ? activity.map((c: any) => (
              <Link key={c.id} href={`/consultations/${c.id}`} className="group flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-sand-100 transition-all duration-200">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-neutral-800 leading-snug">
                    Consultation — Dr. {c.vet?.user?.fullName || 'N/A'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR')} · <span className={`font-medium ${c.status === 'ACTIVE' ? 'text-green-600' : c.status === 'PENDING' ? 'text-amber-600' : 'text-neutral-400'}`}>{c.status}</span>
                  </p>
                </div>
              </Link>
            )) : (
              <div className="text-sm text-neutral-400 py-4 text-center">
                Aucune consultation récente.{' '}
                <Link href="/consultations/new" className="text-brand-700 underline">Démarrer</Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming reminders */}
        <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-elevation-sm hover:shadow-elevation-md transition-all duration-250">
          <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-4">{t.dashboard.upcomingReminders}</h3>
          <div className="space-y-3">
            {reminders.length > 0 ? reminders.map((r) => (
              <div key={r.id} className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevation-sm ${
                r.daysUntilDue <= 7 ? 'border-amber-200 bg-amber-50 hover:border-amber-300' : 'border-sand-200 bg-sand-100 hover:border-brand-300'
              }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 ${
                  r.daysUntilDue <= 7 ? 'bg-amber-100' : 'bg-white border border-sand-200'
                }`}>
                  <Clock className={`w-4 h-4 ${r.daysUntilDue <= 7 ? 'text-amber-600' : 'text-neutral-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-900">{r.productUsed || r.eventType}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{r.animalGroup || 'Tous les animaux'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    r.daysUntilDue <= 7 ? 'bg-amber-200 text-amber-800' : 'bg-sand-200 text-neutral-600'
                  }`}>
                    {r.daysUntilDue}{t.dashboard.daysShort}
                  </span>
                  <p className="text-xs text-neutral-400 mt-1">
                    {new Date(r.nextDueDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-sm text-neutral-400 py-4 text-center">
                Aucun rappel à venir.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, subColor, bg, border, href,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string; subColor: string; bg: string; border: string; href?: string;
}) {
  const inner = (
    <div className={`group bg-white border ${border} rounded-2xl p-4 shadow-elevation-sm hover:shadow-elevation-md hover:-translate-y-1 hover:border-brand-400/50 transition-all duration-250 relative overflow-hidden ${href ? 'cursor-pointer' : ''}`}>
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-brand-500/50 via-brand-300/30 to-amber-500/30" />
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
        {icon}
      </div>
      <p className="font-heading font-bold text-xl text-neutral-900 leading-none tabular-nums">{value}</p>
      <p className="text-xs text-neutral-600 mt-1">{label}</p>
      <p className={`text-xs mt-0.5 font-medium ${subColor}`}>{sub}</p>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
