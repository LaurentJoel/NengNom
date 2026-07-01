'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, MessageSquare, AlertTriangle, LogOut, Stethoscope } from 'lucide-react';
import { AdminGuard } from '@/components/app/AdminGuard';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Utilisateurs' },
  { href: '/admin/consultations', icon: MessageSquare, label: 'Consultations' },
  { href: '/admin/alerts', icon: AlertTriangle, label: 'Alertes maladies' },
];

function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-neutral-950 flex-shrink-0 flex flex-col h-full">
        <div className="px-5 py-4 border-b border-neutral-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">Neng-Nom</p>
              <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-widest mt-0.5">Admin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border-l-2 border-emerald-500 pl-[10px]'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <item.icon size={17} className="flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-neutral-800">
          <div className="px-3 py-2 mb-1">
            <p className="text-white text-xs font-medium truncate">{user?.fullName}</p>
            <p className="text-neutral-500 text-xs">Administrateur</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl text-xs font-medium transition-all"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center px-6 gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Interface Admin</span>
          </div>
          <span className="text-neutral-300 text-sm">·</span>
          <span className="text-sm text-neutral-700">Neng-Nom Platform</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}
