import { AppSidebar, AppTopbar, NetworkBanner, MobileSidebarToggle } from '@/components/app/AppLayout';
import { AuthGuard } from '@/components/app/AuthGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-sand-100 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <AppSidebar />
        </div>
        {/* Mobile sidebar toggle */}
        <MobileSidebarToggle />

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <NetworkBanner />
          <AppTopbar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
