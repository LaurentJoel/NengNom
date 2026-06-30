'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { labRequestsService } from '@/lib/lab-requests-service';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3;

const TEST_ID_TO_ENUM: Record<string, string> = {
  disease: 'DISEASE_DIAGNOSIS',
  parasito: 'PARASITOLOGY',
  hemato: 'HEMATOLOGY',
  bacterio: 'BACTERIOLOGY',
  water: 'WATER_QUALITY',
  biosec: 'BIOSECURITY_AUDIT',
};

const TEST_TYPES_CONFIG = [
  { id: 'disease', icon: '🦠', fr: { label: 'Diagnostic de maladies', desc: 'ND, Gumboro, Salmonella...' }, en: { label: 'Disease Diagnosis', desc: 'ND, Gumboro, Salmonella...' }, price: 15000 },
  { id: 'parasito', icon: '🔬', fr: { label: 'Parasitologie', desc: 'Parasites internes et externes' }, en: { label: 'Parasitology', desc: 'Internal and external parasites' }, price: 10000 },
  { id: 'hemato', icon: '🩸', fr: { label: 'Hématologie', desc: 'Analyse de sang complète' }, en: { label: 'Hematology', desc: 'Complete blood analysis' }, price: 20000 },
  { id: 'bacterio', icon: '🧫', fr: { label: 'Bactériologie', desc: 'Identification bactérienne' }, en: { label: 'Bacteriology', desc: 'Bacterial identification' }, price: 25000 },
  { id: 'water', icon: '💧', fr: { label: "Qualité de l'eau", desc: 'Eau potable pour vos animaux' }, en: { label: 'Water Quality', desc: 'Drinking water for your animals' }, price: 15000 },
  { id: 'biosec', icon: '🛡️', fr: { label: 'Audit biosécurité', desc: 'Évaluation complète' }, en: { label: 'Biosecurity Audit', desc: 'Complete assessment' }, price: 30000 },
];

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

// Cameroon cities with approximate GPS coordinates
const LOCATION_PRESETS: Record<string, string> = {
  'Douala, Littoral': '4.0511,9.7679',
  'Yaoundé, Centre': '3.8480,11.5021',
  'Bafoussam, Ouest': '5.4780,10.4175',
  'Garoua, Nord': '9.3017,13.3932',
  'Bamenda, Nord-Ouest': '5.9631,10.1591',
};

export default function NewLabPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedTest, setSelectedTest] = useState('');
  const [location, setLocation] = useState('');
  const [gpsCoords, setGpsCoords] = useState('4.0511,9.7679');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const testTypes = TEST_TYPES_CONFIG.map((tt) => ({
    ...tt,
    label: tt[locale as 'fr' | 'en']?.label ?? tt.fr.label,
    desc: tt[locale as 'fr' | 'en']?.desc ?? tt.fr.desc,
  }));

  const selectedTestData = testTypes.find((t) => t.id === selectedTest);

  const handleFinish = async () => {
    const testType = TEST_ID_TO_ENUM[selectedTest];
    if (!testType) return;
    setSubmitting(true);
    const res = await labRequestsService.createRequest({
      testType,
      gpsLocation: gpsCoords,
      instructions: location ? `Adresse: ${location}. Date souhaitée: ${date} ${slot}` : undefined,
    });
    if (res.success && res.data) {
      const req = res.data as any;
      router.push(`/lab/${req.id}`);
    }
    setSubmitting(false);
  };

  const stepLabels = [t.newLab.testType, t.newLab.scheduling, t.newLab.confirmation];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/lab" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-200 transition-colors text-neutral-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-heading font-bold text-2xl text-brand-900">{t.newLab.title}</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              i + 1 < step ? 'bg-brand-600 text-white' : i + 1 === step ? 'bg-brand-800 text-white' : 'bg-sand-200 text-neutral-400'
            }`}>
              {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? 'text-brand-800' : 'text-neutral-400'}`}>{label}</span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-sand-300" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {testTypes.map((tt) => (
              <button
                key={tt.id}
                type="button"
                onClick={() => setSelectedTest(tt.id)}
                aria-pressed={selectedTest === tt.id}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                  selectedTest === tt.id ? 'border-brand-800 bg-brand-50' : 'border-sand-200 bg-white hover:border-brand-400'
                }`}
              >
                <div className="text-2xl mb-2">{tt.icon}</div>
                <p className="font-semibold text-sm text-neutral-900">{tt.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5 mb-2">{tt.desc}</p>
                <p className="text-xs font-semibold text-amber-600">{t.newLab.startingFrom} {tt.price.toLocaleString('fr-FR')} FCFA</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!selectedTest}
            className="w-full btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.common.continue} →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white border border-sand-200 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">{t.newLab.farmAddress}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t.newLab.farmAddressPlaceholder}
                className="w-full bg-sand-100 border border-sand-200 rounded-lg pl-10 pr-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 transition-colors"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(LOCATION_PRESETS).map(([label, coords]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setLocation(label); setGpsCoords(coords); }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    gpsCoords === coords ? 'bg-brand-100 border-brand-400 text-brand-800' : 'border-sand-200 text-neutral-600 hover:border-brand-400'
                  }`}
                >
                  📍 {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">{t.newLab.preferredDate}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-sand-100 border border-sand-200 rounded-lg px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-brand-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-3 uppercase tracking-wide">{t.newLab.timeSlot}</label>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  aria-pressed={slot === s}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150 ${
                    slot === s ? 'bg-brand-800 text-white border-brand-800' : 'bg-white border-sand-200 text-neutral-700 hover:border-brand-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 bg-white border border-sand-200 text-neutral-700 font-medium text-sm py-3 rounded-lg hover:bg-sand-100 transition-colors">← {t.common.back}</button>
            <button
              onClick={() => setStep(3)}
              disabled={!location || !date || !slot}
              className="flex-1 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.common.continue} →
            </button>
          </div>
        </div>
      )}

      {step === 3 && selectedTestData && (
        <div className="space-y-4">
          <div className="bg-white border border-sand-200 rounded-xl p-5">
            <h3 className="font-semibold text-sm text-neutral-900 mb-4">{t.newLab.orderSummary}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-sand-100">
                <span className="text-2xl">{selectedTestData.icon}</span>
                <div>
                  <p className="font-medium text-neutral-900">{selectedTestData.label}</p>
                  <p className="text-xs text-neutral-500">{selectedTestData.desc}</p>
                </div>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-neutral-600">{t.newLab.location}</span>
                <span className="font-medium text-neutral-900 text-right max-w-48 text-xs">{location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">{t.newLab.date}</span>
                <span className="font-medium text-neutral-900">{date} — {slot}</span>
              </div>
              <div className="h-px bg-sand-200 my-2" />
              <div className="flex justify-between text-base">
                <span className="font-semibold text-neutral-900">{t.newLab.total}</span>
                <span className="font-bold text-amber-600">{selectedTestData.price.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 bg-white border border-sand-200 text-neutral-700 font-medium text-sm py-3 rounded-lg hover:bg-sand-100 transition-colors">← {t.common.back}</button>
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="flex-1 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.newLab.confirmOrder}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
