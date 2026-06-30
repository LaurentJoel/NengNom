'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, Phone, Mail, Edit3, Bell, Shield, LogOut, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';

interface FarmerProfile {
  farmName?: string;
  farmType?: string;
  totalAnimals?: number;
  landArea?: number;
  country?: string;
  region?: string;
}

export default function ProfilePage() {
  const [notificationsOn, setNotificationsOn] = useState(true);
  const { t } = useLanguage();
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'FARMER') {
      setLoadingProfile(true);
      apiClient.get('/users/me').then((res) => {
        if (res.success && res.data) {
          const data = res.data as any;
          setProfile(data.farmerProfile || null);
        }
        setLoadingProfile(false);
      }).catch(() => setLoadingProfile(false));
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  if (authLoading) {
    return <div className="flex items-center justify-center h-48"><Loader2 className="w-5 h-5 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-brand-900">{t.profile.title}</h1>
        <button className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 px-4 py-2 bg-brand-50 border border-brand-100 rounded-xl hover:bg-brand-100 transition-colors">
          <Edit3 className="w-4 h-4" />
          {t.common.edit}
        </button>
      </div>

      {/* Profile card */}
      <section aria-label="Informations personnelles" className="bg-white border border-sand-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 icon-gradient-bg rounded-xl flex items-center justify-center text-white text-2xl font-bold font-heading flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-semibold text-xl text-neutral-900">{user?.fullName || '—'}</h2>
            <p className="text-brand-700 font-medium text-sm mt-0.5">
              {user?.role === 'FARMER' ? 'Éleveur' : user?.role === 'VET' ? 'Vétérinaire' : user?.role}
              {profile?.farmType ? ` · ${profile.farmType}` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {(user as any)?.region && (
                <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <MapPin className="w-3.5 h-3.5" />
                  {(user as any).region}, {(user as any).country || 'Cameroun'}
                </span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {t.profile.memberSince} {memberSince}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-sand-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sand-100 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">{t.profile.phone}</p>
              <p className="text-sm font-medium text-neutral-900">{(user as any)?.phone || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sand-100 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">{t.profile.email}</p>
              <p className="text-sm font-medium text-neutral-900">{user?.email || '—'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Farm info */}
      {user?.role === 'FARMER' && (
        <section aria-label="Informations de ferme" className="bg-white border border-sand-200 rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-sm text-neutral-900 mb-4">{t.profile.farmInfo}</h3>
          {loadingProfile ? (
            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-brand-600" /></div>
          ) : (
            <dl className="grid sm:grid-cols-2 gap-4">
              {[
                { label: t.profile.farmName, value: profile?.farmName || '—' },
                { label: t.profile.farmType, value: profile?.farmType || '—' },
                { label: t.profile.currentLivestock, value: profile?.totalAnimals ? `${profile.totalAnimals.toLocaleString()} animaux` : '—' },
                { label: t.profile.area, value: profile?.landArea ? `${profile.landArea} ha` : '—' },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-neutral-400 mb-0.5">{item.label}</dt>
                  <dd className="text-sm font-medium text-neutral-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      )}

      {/* Settings */}
      <section aria-label="Paramètres" className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-sand-100">
          <h3 className="font-heading font-semibold text-sm text-neutral-900">{t.profile.settings}</h3>
        </div>
        <div className="divide-y divide-sand-100">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-9 h-9 bg-sand-100 rounded-lg flex items-center justify-center text-neutral-600 flex-shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">{t.profile.notifications}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{t.profile.notificationsDesc}</p>
            </div>
            <button
              onClick={() => setNotificationsOn(!notificationsOn)}
              role="switch"
              aria-checked={notificationsOn}
              aria-label="Notifications"
              className={`relative w-11 h-6 rounded-full transition-colors ${notificationsOn ? 'bg-brand-600' : 'bg-sand-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notificationsOn ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <button className="flex items-center gap-4 px-5 py-4 w-full hover:bg-sand-100 transition-colors text-left">
            <div className="w-9 h-9 bg-sand-100 rounded-lg flex items-center justify-center text-neutral-600 flex-shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">{t.profile.privacy}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{t.profile.privacyDesc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-4 w-full hover:bg-red-50 transition-colors text-left"
          >
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">{t.profile.logout}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{t.profile.logoutDesc}</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
