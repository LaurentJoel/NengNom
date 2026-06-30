'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Check, Stethoscope, Phone } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3;

const COUNTRIES = [
  { code: 'CM', label: 'Cameroun' },
  { code: 'CG', label: 'Congo Brazzaville' },
  { code: 'CD', label: 'Congo Kinshasa' },
  { code: 'GA', label: 'Gabon' },
  { code: 'CI', label: "Côte d'Ivoire" },
  { code: 'SN', label: 'Sénégal' },
  { code: 'BF', label: 'Burkina Faso' },
];

const ROLES_CONFIG = [
  { id: 'FARMER', icon: '🐔' },
  { id: 'VET', icon: '👨‍⚕️' },
];

const ROLE_LABELS: Record<string, { fr: { title: string; desc: string }; en: { title: string; desc: string } }> = {
  FARMER: {
    fr: { title: 'Éleveur', desc: 'Je gère un élevage et cherche des conseils vétérinaires' },
    en: { title: 'Farmer', desc: 'I manage a farm and need veterinary advice' },
  },
  VET: {
    fr: { title: 'Vétérinaire', desc: 'Je suis professionnel de santé animale' },
    en: { title: 'Veterinarian', desc: 'I am an animal health professional' },
  },
};

interface FormData {
  phone: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  country: string;
  region: string;
  role: 'FARMER' | 'VET' | '';
}

export default function RegisterPage() {
  const { t, locale } = useLanguage();
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    phone: '+237',
    password: '',
    confirmPassword: '',
    fullName: '',
    country: 'CM',
    region: '',
    role: '',
  });

  const update = (fields: Partial<FormData>) => setForm((f) => ({ ...f, ...fields }));

  const handleFinish = async () => {
    if (!form.role) return;
    setError(null);
    setLoading(true);
    try {
      const registeredUser = await register({
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
        fullName: form.fullName,
        role: form.role as 'FARMER' | 'VET',
        country: form.country,
        region: form.region || undefined,
      });
      router.push(registeredUser.role === 'VET' ? '/dashboard/vet' : '/dashboard/farmer');
    } catch (err: any) {
      setError(err.message || "L'inscription a échoué. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 bg-brand-800 flex-col p-12">
        <div className="flex items-center gap-2 mb-16">
          <div className="w-8 h-8 icon-gradient-bg rounded-lg flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-white text-lg">Neng-Nom</span>
        </div>
        <h2 className="font-heading font-bold text-3xl text-white mb-4 leading-tight">
          {t.auth.registerHeroTitle}
        </h2>
        <p className="text-brand-400 text-sm leading-relaxed mb-8">
          {t.auth.registerHeroDesc}
        </p>
        <div className="space-y-4">
          {t.auth.stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                step >= i + 1 ? 'bg-brand-600 text-white' : 'bg-brand-700 text-brand-500'
              }`}>
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm ${step >= i + 1 ? 'text-white' : 'text-brand-600'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-sand-100">
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-brand-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t.common.back}
          </Link>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-brand-800' : s < step ? 'w-4 bg-brand-600' : 'w-4 bg-sand-300'
              }`} />
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            {step === 1 && <Step1 form={form} update={update} onNext={() => setStep(2)} />}
            {step === 2 && <Step2 form={form} update={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && (
              <Step3
                form={form}
                update={update}
                onBack={() => setStep(2)}
                onFinish={handleFinish}
                loading={loading}
                locale={locale}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step1({ form, update, onNext }: {
  form: FormData;
  update: (f: Partial<FormData>) => void;
  onNext: () => void;
}) {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = form.phone.trim();
    if (!/^\+\d{10,15}$/.test(phone)) {
      setErr('Numéro invalide. Format: +237 6XX XXX XXX');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErr('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 8) {
      setErr('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setErr('Le mot de passe doit contenir au moins une majuscule');
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      setErr('Le mot de passe doit contenir au moins un chiffre');
      return;
    }
    setErr('');
    onNext();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-brand-900">{t.auth.createAccount}</h1>
        <p className="text-neutral-600 text-sm mt-1">{t.auth.step1}</p>
      </div>
      {err && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{err}</p>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">{t.auth.phone}</label>
          <div className="flex">
            <span className="inline-flex items-center gap-1.5 px-3 bg-white border border-r-0 border-sand-300 rounded-l-lg text-sm text-neutral-600 font-medium">
              <Phone className="w-3.5 h-3.5" /> +237
            </span>
            <input
              type="tel"
              required
              value={form.phone.replace(/^\+?237/, '')}
              onChange={(e) => update({ phone: '+237' + e.target.value.replace(/^\+?237/, '') })}
              placeholder="6XX XXX XXX"
              className="flex-1 bg-white border border-sand-300 rounded-r-lg px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 transition-colors"
            />
          </div>
          <p className="text-xs text-neutral-400 mt-1">Votre numéro sera votre identifiant de connexion</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">{t.auth.password}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={(e) => update({ password: e.target.value })}
              placeholder="Min. 8 caract., 1 majuscule, 1 chiffre"
              className="w-full bg-white border border-sand-300 rounded-lg px-4 py-3 pr-11 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 transition-colors"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">{t.auth.confirmPassword}</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              value={form.confirmPassword}
              onChange={(e) => update({ confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-white border border-sand-300 rounded-lg px-4 py-3 pr-11 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 transition-colors"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" className="w-full btn-gradient">
          {t.common.continue} →
        </button>
        <p className="text-center text-xs text-neutral-500">
          {t.auth.alreadyHaveAccount}{' '}
          <Link href="/auth/login" className="text-brand-700 font-medium hover:text-brand-900 transition-colors">
            {t.auth.signIn}
          </Link>
        </p>
      </form>
    </div>
  );
}

function Step2({ form, update, onNext, onBack }: {
  form: FormData;
  update: (f: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-brand-900">{t.auth.fullName}</h1>
        <p className="text-neutral-600 text-sm mt-1">{t.auth.step2}</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onNext(); }} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">{t.auth.fullName}</label>
          <input
            type="text"
            required
            value={form.fullName}
            onChange={(e) => update({ fullName: e.target.value })}
            placeholder="Prénom et Nom"
            className="w-full bg-white border border-sand-300 rounded-lg px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">{t.auth.country}</label>
          <select
            value={form.country}
            onChange={(e) => update({ country: e.target.value })}
            className="w-full bg-white border border-sand-300 rounded-lg px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:border-brand-600 transition-colors"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">{t.auth.region}</label>
          <input
            type="text"
            value={form.region}
            onChange={(e) => update({ region: e.target.value })}
            placeholder="Ex: Littoral, Centre, Pool..."
            className="w-full bg-white border border-sand-300 rounded-lg px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 transition-colors"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack} className="flex-1 bg-white border border-sand-200 text-neutral-700 font-medium text-sm py-3 rounded-lg hover:bg-sand-100 transition-colors">
            ← {t.common.back}
          </button>
          <button type="submit" className="flex-1 btn-gradient">
            {t.common.continue} →
          </button>
        </div>
      </form>
    </div>
  );
}

function Step3({ form, update, onBack, onFinish, loading, locale }: {
  form: FormData;
  update: (f: Partial<FormData>) => void;
  onBack: () => void;
  onFinish: () => void;
  loading: boolean;
  locale: string;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-brand-900">{t.auth.yourRole}</h1>
        <p className="text-neutral-600 text-sm mt-1">{t.auth.step3}</p>
      </div>
      <div className="space-y-3 mb-6">
        {ROLES_CONFIG.map((role) => {
          const labels = ROLE_LABELS[role.id][locale as 'fr' | 'en'];
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => update({ role: role.id as 'FARMER' | 'VET' })}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                form.role === role.id
                  ? 'border-brand-800 bg-brand-50'
                  : 'border-sand-200 bg-white hover:border-brand-400 hover:bg-sand-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{role.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-neutral-900">{labels.title}</p>
                  <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{labels.desc}</p>
                </div>
                {form.role === role.id && (
                  <div className="ml-auto w-5 h-5 bg-brand-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 bg-white border border-sand-200 text-neutral-700 font-medium text-sm py-3 rounded-lg hover:bg-sand-100 transition-colors">
          ← {t.common.back}
        </button>
        <button
          type="button"
          onClick={onFinish}
          disabled={!form.role || loading}
          className="flex-1 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t.auth.creating}
            </>
          ) : (
            t.auth.createMyAccount
          )}
        </button>
      </div>
    </div>
  );
}
