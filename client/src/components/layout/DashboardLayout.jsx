import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import logoSeal from '../../assets/logo-seal.jpeg';

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-neutral-offwhite dark:bg-gray-900">
      {/* Institute seal watermark — decorative, behind all content, never intercepts clicks. */}
      <img
        src={logoSeal}
        alt=""
        aria-hidden="true"
        className="no-print pointer-events-none fixed top-1/2 left-1/2 z-0 w-[600px] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.05] select-none sm:w-[750px] lg:w-[900px]"
      />

      {/* Desktop sidebar */}
      <div className="no-print relative z-10 hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="relative z-10 flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
