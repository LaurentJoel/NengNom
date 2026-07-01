'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  FlaskConical,
  ClipboardList,
  Users,
  Sparkles,
  User,
  LogOut,
  Stethoscope,
  Bell,
  Wifi,
  WifiOff,
  Menu,
  X,
  Globe,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { consultationsService } from '@/lib/consultations-service';
import { healthEventsService } from '@/lib/health-events-service';
import { labRequestsService } from '@/lib/lab-requests-service';

// ---- Notification helpers ----

interface NotifItem {
  id: string;
  type: 'consultation_pending' | 'consultation_active' | 'health_reminder' | 'lab_results' | 'lab_pending';
  title: string;
  body: string;
  href: string;
  time: string;
  urgent: boolean;
}

async function fetchNotifications(role: string): Promise<NotifItem[]> {
  const items: NotifItem[] = [];

  try {
    const consultRes = await consultationsService.listConsultations(1, 20);
    if (consultRes.success && consultRes.data) {
      const list: any[] = (consultRes.data as any).consultations ?? [];
      if (role === 'VET') {
        list.filter((c) => c.status === 'PENDING').forEach((c) => {
          const name = c.farmer?.user?.fullName ?? 'Éleveur';
          items.push({
            id: c.id,
            type: 'consultation_pending',
            title: `Nouvelle demande de ${name}`,
            body: c.symptomsDescription?.slice(0, 60) ?? '',
            href: `/consultations/${c.id}`,
            time: c.createdAt,
            urgent: true,
          });
        });
        list.filter((c) => c.status === 'ACTIVE').forEach((c) => {
          const name = c.farmer?.user?.fullName ?? 'Éleveur';
          items.push({
            id: c.id + '_active',
            type: 'consultation_active',
            title: `Consultation active — ${name}`,
            body: 'Cliquez pour continuer',
            href: `/consultations/${c.id}`,
            time: c.updatedAt,
            urgent: false,
          });
        });
      } else {
        list.filter((c) => c.status === 'ACTIVE').forEach((c) => {
          const name = c.vet?.user?.fullName ?? 'Vétérinaire';
          items.push({
            id: c.id,
            type: 'consultation_active',
            title: `${name} vous a répondu`,
            body: 'Votre consultation est en cours',
            href: `/consultations/${c.id}`,
            time: c.updatedAt,
            urgent: false,
          });
        });
      }
    }
  } catch {}

  if (role === 'FARMER') {
    try {
      const reminderRes = await healthEventsService.getReminders();
      if (reminderRes.success && reminderRes.data) {
        (reminderRes.data as any[]).forEach((r) => {
          if (!r.nextDueDate) return;
          const daysUntilDue = Math.ceil(
            (new Date(r.nextDueDate).getTime() - Date.now()) / 86_400_000,
          );
          if (daysUntilDue <= 7 && daysUntilDue >= 0) {
            items.push({
              id: r.id,
              type: 'health_reminder',
              title: daysUntilDue === 0
                ? `${r.productUsed ?? r.eventType} — aujourd'hui !`
                : `${r.productUsed ?? r.eventType} dans ${daysUntilDue}j`,
              body: r.animalGroup ?? 'Tous les animaux',
              href: '/farm-records',
              time: r.nextDueDate,
              urgent: daysUntilDue <= 3,
            });
          }
        });
      }
    } catch {}

    try {
      const labRes = await labRequestsService.listRequests(1, 20);
      if (labRes.success && labRes.data) {
        const reqs: any[] =
          (labRes.data as any).requests ??
          (labRes.data as any).labRequests ??
          [];
        reqs.filter((r) => r.status === 'RESULTS_READY').forEach((r) => {
          items.push({
            id: r.id,
            type: 'lab_results',
            title: 'Résultats de labo disponibles',
            body: r.testType,
            href: `/lab/${r.id}`,
            time: r.updatedAt,
            urgent: true,
          });
        });
      }
    } catch {}
  }

  if (role === 'VET') {
    try {
      const pendingRes = await labRequestsService.getPendingRequests();
      if (pendingRes.success && pendingRes.data) {
        const reqs: any[] = Array.isArray(pendingRes.data)
          ? pendingRes.data
          : (pendingRes.data as any).requests ?? [];
        reqs.forEach((r) => {
          items.push({
            id: r.id + '_lab',
            type: 'lab_pending',
            title: `Demande de labo — ${r.testType}`,
            body: `Statut : ${r.status}`,
            href: `/lab-requests/${r.id}`,
            time: r.createdAt,
            urgent: false,
          });
        });
      }
    } catch {}
  }

  return items.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );
}

const NOTIF_EMOJI: Record<NotifItem['type'], string> = {
  consultation_pending: '🔔',
  consultation_active: '💬',
  health_reminder: '💉',
  lab_results: '🧪',
  lab_pending: '📋',
};

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

function NotificationsPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open || !user?.role || fetched) return;
    setLoading(true);
    fetchNotifications(user.role).then((data) => {
      setItems(data);
      setLoading(false);
      setFetched(true);
    });
  }, [open, user?.role, fetched]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const count = items.length;

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-100 transition-all duration-200 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell
          size={16}
          className="text-neutral-600 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-200"
        />
        {count > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        ) : (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-600 rounded-full" />
        )}
      </button>

      {open && mounted && createPortal(
        <div className="fixed top-14 right-6 w-80 bg-white border border-sand-200 rounded-2xl shadow-elevation-lg overflow-hidden z-[9999]">
          <div className="px-4 py-3 border-b border-sand-100 flex items-center justify-between">
            <span className="font-semibold text-sm text-neutral-900">Notifications</span>
            {count > 0 && (
              <span className="text-xs text-neutral-500">{count} non lues</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-sand-50">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              </div>
            )}
            {!loading && count === 0 && (
              <div className="text-center py-10 px-4">
                <Bell size={24} className="mx-auto text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-500">Aucune notification</p>
              </div>
            )}
            {!loading && items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-sand-50 transition-colors ${item.urgent ? 'bg-amber-50/50' : ''}`}
              >
                <span className="text-base mt-0.5 flex-shrink-0">
                  {NOTIF_EMOJI[item.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 leading-snug">{item.title}</p>
                  {item.body && (
                    <p className="text-xs text-neutral-500 truncate mt-0.5">{item.body}</p>
                  )}
                  <p className="text-[10px] text-neutral-400 mt-1">{timeAgo(item.time)}</p>
                </div>
                {item.urgent && (
                  <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </Link>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ---- Sidebar ----

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const isVet = user?.role === 'VET';

  const NAV_ITEMS = isVet ? [
    { href: '/dashboard/vet', icon: LayoutDashboard, label: t.nav.home },
    { href: '/consultations', icon: MessageSquare, label: t.nav.consultations },
    { href: '/lab-requests', icon: FlaskConical, label: t.nav.labRequests },
    { href: '/community', icon: Users, label: t.nav.community },
    { href: '/profile', icon: User, label: t.nav.profile },
  ] : [
    { href: '/dashboard/farmer', icon: LayoutDashboard, label: t.nav.home },
    { href: '/consultations', icon: MessageSquare, label: t.nav.consultations },
    { href: '/lab', icon: FlaskConical, label: t.nav.lab },
    { href: '/farm-records', icon: ClipboardList, label: t.nav.farmRecords },
    { href: '/community', icon: Users, label: t.nav.community },
    { href: '/ai-suggestions', icon: Sparkles, label: t.nav.aiSuggestions },
    { href: '/profile', icon: User, label: t.nav.profile },
  ];

  return (
    <aside className="w-60 bg-brand-800 flex-shrink-0 flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-700/10 via-transparent to-brand-900/20 pointer-events-none" />

      <div className="px-5 py-4 border-b border-brand-700/60 relative z-10">
        <Link href={isVet ? '/dashboard/vet' : '/dashboard/farmer'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 icon-gradient-bg rounded-xl flex items-center justify-center group-hover:shadow-glow-brand transition-shadow duration-300">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-white text-base tracking-tight">Neng-Nom</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto relative z-10">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500/30 to-brand-600/5 text-white shadow-sm border-l-[2px] border-brand-400 pl-[10px]'
                    : 'text-brand-300 hover:bg-white/8 hover:text-white hover:translate-x-0.5'
                }`}
              >
                <item.icon className={`flex-shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} size={17} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-brand-700/60 relative z-10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-700/40 transition-colors duration-200">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ring-2 ring-brand-500/30">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.fullName || '—'}</p>
            <p className="text-brand-400 text-xs truncate">
              {user?.role === 'FARMER' ? 'Éleveur' : user?.role === 'VET' ? 'Vétérinaire' : user?.role || ''}
              {user?.region ? ` · ${user.region}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-brand-400 hover:text-white hover:bg-brand-700/50 rounded-xl text-xs font-medium transition-all duration-200"
        >
          <LogOut size={14} />
          {t.nav.logout}
        </button>
      </div>
    </aside>
  );
}

// ---- Topbar ----

export function AppTopbar() {
  const { isOnline } = useNetworkStatus();
  const { locale, setLocale, t } = useLanguage();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const nameParts = user?.fullName?.split(' ') ?? [];
  const firstName = nameParts[0] === 'Dr.' ? (nameParts[1] ?? '') : (nameParts[0] ?? '');

  return (
    <header className="h-14 bg-white/95 backdrop-blur-sm border-b border-sand-200/80 flex items-center justify-between px-6 flex-shrink-0">
      <span className="font-heading font-semibold text-brand-900 text-sm">
        {t.topbar.greeting}{firstName ? `, ${firstName}` : ''} 👋
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-sand-200 hover:border-brand-400 hover:bg-brand-50 hover:shadow-elevation-sm hover:-translate-y-px transition-all duration-200 text-neutral-700 cursor-pointer"
          aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
        >
          <Globe size={13} />
          {locale === 'fr' ? 'EN' : 'FR'}
        </button>

        {mounted && (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isOnline ? 'text-green-600' : 'text-orange-500'}`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? t.common.online : t.common.offline}
          </div>
        )}

        <NotificationsPanel />
      </div>
    </header>
  );
}

export function MobileSidebarToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-brand-800 rounded-xl flex items-center justify-center text-white shadow-elevation-md hover:shadow-elevation-lg hover:scale-105 transition-all duration-200 cursor-pointer"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={16} />
      </button>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-brand-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-60 h-full shadow-elevation-lg animate-slide-in">
            <AppSidebar />
            <button
              className="absolute top-4 right-4 text-brand-400 hover:text-white transition-colors duration-200 cursor-pointer"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function NetworkBanner() {
  const { isOnline, isSyncing } = useNetworkStatus();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || (isOnline && !isSyncing)) return null;

  return (
    <div
      className={`w-full px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-2 animate-fade-in ${
        !isOnline ? 'bg-amber-50 text-amber-800 border-b border-amber-200' : 'bg-blue-50 text-blue-700 border-b border-blue-100'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff size={13} className="flex-shrink-0" />
          {t.topbar.offlineBanner}
        </>
      ) : (
        <>
          <span className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
          {t.topbar.syncBanner}
        </>
      )}
    </div>
  );
}
