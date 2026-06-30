'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bird, Star, Check, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { usersService } from '@/lib/users-service';
import { consultationsService } from '@/lib/consultations-service';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3;

const ANIMAL_GROUPS_CONFIG = {
  fr: ['Poulets de chair', 'Pondeuses', 'Porcs', 'Bovins', 'Autre'],
  en: ['Broilers', 'Layers', 'Pigs', 'Cattle', 'Other'],
};

interface VetProfile {
  id: string;
  licenseNumber: string;
  specialization?: string;
  hourlyRate: number;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  user?: { id: string; fullName: string; country?: string; region?: string };
}

export default function NewConsultationPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedVet, setSelectedVet] = useState<VetProfile | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [vets, setVets] = useState<VetProfile[]>([]);
  const [loadingVets, setLoadingVets] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const animalGroups = ANIMAL_GROUPS_CONFIG[locale as 'fr' | 'en'] || ANIMAL_GROUPS_CONFIG.fr;

  useEffect(() => {
    setLoadingVets(true);
    usersService.getVets(true).then((res) => {
      if (res.success && res.data) {
        setVets(res.data as VetProfile[]);
      }
      setLoadingVets(false);
    }).catch(() => setLoadingVets(false));
  }, []);

  const handleFinish = async () => {
    setSubmitting(true);
    const res = await consultationsService.createConsultation({
      symptomsDescription: `${selectedGroup}: ${symptoms}`,
      type: isUrgent ? 'EMERGENCY' : 'CHAT',
      vetId: selectedVet?.id,
      mediaUrls: [],
    });
    if (res.success && res.data) {
      const consultation = res.data as any;
      router.push(`/consultations/${consultation.id}`);
    }
    setSubmitting(false);
  };

  const stepDescriptions = [t.newConsult.describeSymptoms, t.newConsult.chooseVet, t.newConsult.confirmPayment];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/consultations"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-200 transition-colors text-neutral-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-900">{t.newConsult.title}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{stepDescriptions[step - 1]}</p>
        </div>
      </div>

      {/* Progress */}
      <nav className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: t.newConsult.symptoms },
          { n: 2, label: t.newConsult.vet },
          { n: 3, label: t.newConsult.payment },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              s.n < step ? 'bg-brand-600 text-white' : s.n === step ? 'bg-brand-800 text-white' : 'bg-sand-200 text-neutral-400'
            }`}>
              {s.n < step ? <Check className="w-3.5 h-3.5" /> : s.n}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${s.n === step ? 'text-brand-800' : s.n < step ? 'text-brand-600' : 'text-neutral-400'}`}>
              {s.label}
            </span>
            {s.n < 3 && <ChevronRight className="w-4 h-4 text-sand-300" />}
          </div>
        ))}
      </nav>

      {step === 1 && (
        <div className="bg-white border border-sand-200 rounded-2xl p-6 space-y-6">
          <fieldset>
            <legend className="block text-xs font-medium text-neutral-600 mb-3 uppercase tracking-wide">{t.newConsult.animalGroup}</legend>
            <div className="flex flex-wrap gap-2" role="group">
              {animalGroups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGroup(g)}
                  aria-pressed={selectedGroup === g}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
                    selectedGroup === g
                      ? 'bg-brand-800 text-white border-brand-800'
                      : 'bg-white text-neutral-700 border-sand-200 hover:border-brand-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="consult-symptoms" className="block text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">
              {t.newConsult.symptomDescription}
            </label>
            <textarea
              id="consult-symptoms"
              rows={4}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={t.newConsult.symptomPlaceholder}
              className="w-full bg-sand-100 border border-sand-200 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600/20 transition-colors resize-none"
            />
          </div>

          <fieldset>
            <legend className="block text-xs font-medium text-neutral-600 mb-3 uppercase tracking-wide">{t.newConsult.urgencyLevel}</legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: false, label: t.newConsult.normal, desc: t.newConsult.normalDesc, icon: '🩺' },
                { id: true, label: t.newConsult.urgency, desc: t.newConsult.urgencyDesc, icon: '🚨' },
              ].map((opt) => (
                <button
                  key={String(opt.id)}
                  type="button"
                  onClick={() => setIsUrgent(opt.id)}
                  aria-pressed={isUrgent === opt.id}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                    isUrgent === opt.id
                      ? opt.id ? 'border-red-500 bg-red-50' : 'border-brand-800 bg-brand-50'
                      : 'border-sand-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-xl mb-1">{opt.icon}</div>
                  <p className={`font-semibold text-sm ${opt.id ? 'text-red-600' : 'text-neutral-900'}`}>{opt.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </fieldset>

          <button
            onClick={() => setStep(2)}
            disabled={!selectedGroup || !symptoms}
            className="w-full btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.common.continue}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-800 flex items-center gap-2">
            <Bird className="w-4 h-4 flex-shrink-0" />
            {t.newConsult.autoAssign}
          </div>
          {loadingVets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {vets.map((vet) => (
                <button
                  key={vet.id}
                  type="button"
                  onClick={() => setSelectedVet(vet)}
                  aria-pressed={selectedVet?.id === vet.id}
                  className={`w-full text-left bg-white border-2 rounded-xl p-5 transition-all duration-150 ${
                    selectedVet?.id === vet.id ? 'border-brand-800 bg-brand-50' : 'border-sand-200 hover:border-brand-400'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-800 font-semibold text-sm flex-shrink-0">
                      {vet.user?.fullName?.split(' ').slice(-1)[0]?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-neutral-900">{vet.user?.fullName}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{vet.specialization}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${vet.isAvailable ? 'bg-green-100 text-green-700' : 'bg-sand-200 text-neutral-500'}`}>
                          {vet.isAvailable ? t.newConsult.available : t.newConsult.busy}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-medium text-neutral-700">{vet.rating.toFixed(1)}</span>
                          <span className="text-xs text-neutral-400">({vet.reviewCount})</span>
                        </div>
                        <span className="text-xs font-semibold text-brand-800">
                          {Number(vet.hourlyRate).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </div>
                    {selectedVet?.id === vet.id && (
                      <div className="w-5 h-5 bg-brand-800 rounded-full flex items-center justify-center flex-shrink-0 mt-2">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {vets.length === 0 && (
                <div className="text-center py-8 text-neutral-400 text-sm">
                  Aucun vétérinaire disponible en ce moment.
                </div>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="flex-1 bg-white border border-sand-200 text-neutral-700 font-medium text-sm py-3 rounded-lg hover:bg-sand-100 transition-colors">
              {t.common.back}
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 btn-gradient"
            >
              {t.common.continue}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <section className="bg-white border border-sand-200 rounded-2xl p-5">
            <h3 className="font-semibold text-sm text-neutral-900 mb-4">{t.newConsult.summary}</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-600">{t.newConsult.vet}</dt>
                <dd className="font-medium text-neutral-900">{selectedVet?.user?.fullName || 'Auto-assigné'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">{t.newConsult.type}</dt>
                <dd className="font-medium text-neutral-900">{isUrgent ? t.newConsult.urgency : t.newConsult.normal}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">{t.newConsult.animalGroupLabel}</dt>
                <dd className="font-medium text-neutral-900">{selectedGroup}</dd>
              </div>
              <div className="h-px bg-sand-200 my-2" />
              <div className="flex justify-between text-base">
                <dt className="font-semibold text-neutral-900">{t.newConsult.totalEstimated}</dt>
                <dd className="font-bold text-brand-900">
                  {selectedVet
                    ? (Number(selectedVet.hourlyRate) * (isUrgent ? 1.5 : 1)).toLocaleString('fr-FR') + ' FCFA'
                    : '—'}
                </dd>
              </div>
            </dl>
          </section>

          <fieldset>
            <legend className="text-xs font-medium text-neutral-600 mb-3 uppercase tracking-wide">{t.newConsult.paymentMethod}</legend>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'mtn', label: 'MTN Money', icon: '📱' },
                { id: 'orange', label: 'Orange Money', icon: '🟠' },
                { id: 'card', label: locale === 'fr' ? 'Carte bancaire' : 'Bank card', icon: '💳' },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  aria-pressed={paymentMethod === pm.id}
                  className={`p-3 rounded-xl border-2 text-center transition-all duration-150 ${
                    paymentMethod === pm.id ? 'border-brand-800 bg-brand-50' : 'border-sand-200 hover:border-brand-400'
                  }`}
                >
                  <div className="text-xl mb-1">{pm.icon}</div>
                  <p className="text-xs font-medium text-neutral-700">{pm.label}</p>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="flex-1 bg-white border border-sand-200 text-neutral-700 font-medium text-sm py-3 rounded-lg hover:bg-sand-100 transition-colors">
              {t.common.back}
            </button>
            <button
              onClick={handleFinish}
              disabled={!paymentMethod || submitting}
              className="flex-1 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.newConsult.confirmAndStart}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
