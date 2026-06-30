'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, Loader2, RefreshCw } from 'lucide-react';
import { aiService } from '@/lib/ai-service';
import { useLanguage } from '@/lib/i18n';

interface Suggestion {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

interface SuggestionRecord {
  id: string;
  parsed: Suggestion[];
  generatedAt: string;
  wasHelpful?: boolean | null;
}

export default function AiSuggestionsPage() {
  const { t, locale } = useLanguage();
  const [records, setRecords] = useState<SuggestionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

  const priorityConfig = {
    high: { label: t.aiSuggestions.priority.high, cls: 'bg-red-100 text-red-700 border-red-200' },
    medium: { label: t.aiSuggestions.priority.medium, cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    low: { label: t.aiSuggestions.priority.low, cls: 'bg-brand-100 text-brand-700 border-brand-200' },
  };

  const load = async () => {
    setLoading(true);
    const res = await aiService.getSuggestions();
    if (res.success && res.data) {
      const raw = res.data as any[];
      setRecords(raw.map((r) => ({
        id: r.id,
        generatedAt: r.generatedAt,
        wasHelpful: r.wasHelpful,
        parsed: (() => {
          try {
            const s = typeof r.suggestion === 'string' ? JSON.parse(r.suggestion) : r.suggestion;
            return Array.isArray(s) ? s : [];
          } catch { return []; }
        })(),
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    const res = await aiService.generateSuggestions();
    if (res.success && res.data) {
      await load();
    }
    setGenerating(false);
  };

  const rate = async (id: string, helpful: boolean) => {
    if (ratedIds.has(id)) return;
    await aiService.rateSuggestion(id, helpful);
    setRatedIds((s) => new Set(s).add(id));
  };

  const latest = records[0];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-900">{t.aiSuggestions.title}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {latest
              ? `${t.aiSuggestions.lastUpdated} : ${new Date(latest.generatedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`
              : 'Aucune suggestion générée'}
          </p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 font-medium text-sm rounded-xl hover:bg-amber-200 transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Générer
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-amber-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">Aucune suggestion disponible</p>
          <button
            onClick={generate}
            disabled={generating}
            className="btn-gradient"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Générer mes premières suggestions
          </button>
        </div>
      ) : (
        <>
          {/* Latest batch */}
          {latest && (
            <div className="bg-gradient-to-br from-amber-50 via-white to-brand-50 border border-amber-200/60 rounded-2xl p-6 shadow-elevation-sm relative overflow-hidden stripe-accent">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">{t.aiSuggestions.featuredLabel}</span>
              </div>
              <div className="space-y-4">
                {latest.parsed?.map((s, i) => (
                  <div key={i} className="bg-white/70 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-neutral-900">{s.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${priorityConfig[s.priority]?.cls || 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                        {priorityConfig[s.priority]?.label || s.priority}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed">{s.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-amber-100">
                <span className="text-xs text-neutral-500">{t.aiSuggestions.wasUseful}</span>
                <button
                  onClick={() => rate(latest.id, true)}
                  disabled={ratedIds.has(latest.id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                    ratedIds.has(latest.id) ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-neutral-600 border-sand-200 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  <ThumbsUp className="w-3 h-3" /> Oui
                </button>
                <button
                  onClick={() => rate(latest.id, false)}
                  disabled={ratedIds.has(latest.id)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-white text-neutral-600 border-sand-200 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  <ThumbsDown className="w-3 h-3" /> Non
                </button>
              </div>
            </div>
          )}

          {/* History */}
          {records.slice(1).length > 0 && (
            <div className="space-y-3">
              <h2 className="font-heading font-semibold text-sm text-neutral-700 uppercase tracking-wide">Historique</h2>
              {records.slice(1).map((record) => (
                <div key={record.id} className="bg-white border border-sand-200 rounded-xl p-4 shadow-elevation-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-neutral-400">
                      {new Date(record.generatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      record.wasHelpful === true ? 'bg-green-100 text-green-700' :
                      record.wasHelpful === false ? 'bg-red-100 text-red-700' :
                      'bg-neutral-100 text-neutral-500'
                    }`}>
                      {record.wasHelpful === true ? '👍 Utile' : record.wasHelpful === false ? '👎 Pas utile' : 'Non évalué'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">
                    {record.parsed?.[0]?.title || 'Suggestions générées'}
                    {record.parsed?.length > 1 && ` +${record.parsed.length - 1} autres`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
