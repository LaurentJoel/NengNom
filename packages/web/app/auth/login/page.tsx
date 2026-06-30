'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Stethoscope, Check, Phone } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { t } = useLanguage();
  const { login, user } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ phone: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Normalize phone: ensure it starts with +
    let phone = form.phone.trim();
    if (!phone.startsWith('+')) phone = '+' + phone;

    try {
      const loggedUser = await login(phone, form.password);
      router.push(loggedUser.role === 'VET' ? '/dashboard/vet' : '/dashboard/farmer');
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects. Vérifiez votre numéro et mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 bg-brand-800 flex-col justify-between p-12">
        <AuthLeftPanel />
      </div>

      <div className="flex-1 flex flex-col bg-sand-100">
        <div className="p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-brand-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.common.backToHome}
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="font-heading font-bold text-2xl text-brand-900">{t.auth.login}</h1>
              <p className="text-neutral-600 text-sm mt-1">
                {t.auth.noAccount}{' '}
                <Link href="/auth/register" className="text-brand-700 font-medium hover:text-brand-900 transition-colors">
                  {t.auth.signUp}
                </Link>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-2 uppercase tracking-wide">
                  {t.auth.phone}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center gap-1.5 px-3 bg-white border border-r-0 border-sand-300 rounded-l-lg text-sm text-neutral-600 font-medium">
                    <Phone className="w-3.5 h-3.5" /> +237
                  </span>
                  <input
                    type="tel"
                    required
                    value={form.phone.replace(/^\+?237/, '')}
                    onChange={(e) => setForm({ ...form, phone: '+237' + e.target.value.replace(/^\+?237/, '') })}
                    placeholder="6XX XXX XXX"
                    className="flex-1 bg-white border border-sand-300 rounded-r-lg px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 transition-colors"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-1">Format: +237 6XX XXX XXX</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wide">
                    {t.auth.password}
                  </label>
                  <Link href="#" className="text-xs text-brand-700 hover:text-brand-900 font-medium transition-colors">
                    {t.auth.forgotPassword}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-sand-300 rounded-lg px-4 py-3 pr-11 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gradient disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.auth.signingIn}
                  </>
                ) : (
                  t.auth.signIn
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthLeftPanel() {
  const { t } = useLanguage();
  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-16">
          <div className="w-8 h-8 icon-gradient-bg rounded-lg flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-white text-lg">Neng-Nom</span>
        </div>

        <h2 className="font-heading font-bold text-3xl text-white mb-4 leading-tight">
          {t.auth.heroTitle}
        </h2>
        <p className="text-brand-400 text-sm leading-relaxed mb-8">
          {t.auth.heroDesc}
        </p>

        <ul className="space-y-4">
          {t.auth.features.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-white">
              <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        <svg viewBox="0 0 320 160" className="w-full" fill="none">
          <rect width="320" height="160" fill="#1B4332" />
          <rect y="110" width="320" height="50" fill="#2D6A4F" />
          <rect x="100" y="70" width="80" height="50" fill="#40916C" />
          <polygon points="90,70 180,70 135,35" fill="#74C69D" />
          <rect x="125" y="90" width="20" height="30" fill="#1B4332" />
          <rect x="50" y="85" width="6" height="25" fill="#D4C9B8" />
          <circle cx="53" cy="78" r="16" fill="#2D6A4F" />
          <rect x="240" y="85" width="6" height="25" fill="#D4C9B8" />
          <circle cx="243" cy="78" r="16" fill="#2D6A4F" />
          <circle cx="270" cy="30" r="14" fill="#D4831A" opacity="0.7" />
          <ellipse cx="80" cy="118" rx="6" ry="4" fill="#FEF3C7" />
          <circle cx="85" cy="114" r="3" fill="#FEF3C7" />
          <ellipse cx="200" cy="120" rx="6" ry="4" fill="#FEF3C7" />
          <circle cx="205" cy="116" r="3" fill="#FEF3C7" />
        </svg>
      </div>
    </>
  );
}
