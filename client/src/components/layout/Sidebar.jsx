import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logoSeal from '../../assets/logo-seal.jpeg';
import useAuth from '../../hooks/useAuth';

const NAV_ICONS = {
  dashboard: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10m-9 11h4" />
    </svg>
  ),
  registrations: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h4" />
    </svg>
  ),
  building: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M6 21V7a1 1 0 011-1h4a1 1 0 011 1v14M15 21V4a1 1 0 011-1h3a1 1 0 011 1v17M9 9h.01M9 12h.01M9 15h.01" />
    </svg>
  ),
  student: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12.06 12.06 0 0121 12c0 2.4-.9 4.6-2.4 6.3M12 14l-6.16-3.42A12.06 12.06 0 003 12c0 2.4.9 4.6 2.4 6.3M12 14v7" />
    </svg>
  ),
  teacher: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  user: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.121 17.804A9 9 0 1118.879 6.196 9 9 0 015.12 17.804zM15 10a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  class: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  subject: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  fan: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 6.343a8 8 0 10-11.314 11.314M17.657 6.343L12 12m5.657-5.657L12 3m0 9l5.657 5.657M12 12L6.343 17.657" />
    </svg>
  ),
  results: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14" />
    </svg>
  ),
  resultsReg: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2a4 4 0 014-4h4m0 0l-3-3m3 3l-3 3M5 5h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
    </svg>
  ),
  viewResults: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14" />
    </svg>
  ),
  coordinator: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm6 3.13a4 4 0 00-3-6.13" />
    </svg>
  ),
  reports: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17V9m6 8V5M3 21h18M6 17v-3a1 1 0 011-1h1a1 1 0 011 1v3" />
    </svg>
  ),
};

const CHEVRON = (
  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Shared color language for both flat items and group headers, kept in one
// place so light/dark never drift apart: white+red in light mode, deep
// green+white in dark mode — two intentionally distinct themes, not an
// inverted palette.
const ITEM_BASE =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-150';
const ITEM_INACTIVE =
  'text-brand-red/75 hover:bg-brand-red/8 hover:text-brand-red dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white';
const ITEM_ACTIVE =
  'bg-brand-red/10 text-brand-red dark:bg-white/15 dark:text-white';

function NavItem({ to, icon, children, onNavigate, indented }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `${ITEM_BASE} border-l-4 ${indented ? 'ml-2' : ''} ${
          isActive
            ? `border-brand-red dark:border-brand-gold ${ITEM_ACTIVE}`
            : `border-transparent ${ITEM_INACTIVE}`
        }`
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}

// Expandable group header (the "Home"-style parent from the reference) with
// a smooth CSS-grid height animation for its children — no layout jump, no
// JS height measurement. Shows a subtle active tint if a descendant route is
// current, even while collapsed, so the active state is never hidden.
function SidebarGroup({ icon, label, defaultExpanded = false, hasActiveChild, children }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={`${ITEM_BASE} w-full ${hasActiveChild && !expanded ? ITEM_ACTIVE : ITEM_INACTIVE}`}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        <span className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>{CHEVRON}</span>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="mt-1 flex flex-col gap-0.5 border-l-2 border-brand-red/10 pl-2 dark:border-white/15">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.userType === 'admin';
  const isCoordinator = user?.userType === 'coordinator';

  const inRegistrations = location.pathname.startsWith('/registrations');
  const inResults = location.pathname.startsWith('/results');
  const inReports = location.pathname.startsWith('/reports');

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white text-brand-red dark:border-brand-green-dark dark:bg-brand-green-dark dark:text-white">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-5 dark:border-white/10">
        <img
          src={logoSeal}
          alt="Al Fataax seal"
          className="h-11 w-11 rounded-full object-cover ring-2 ring-brand-gold"
        />
        <div>
          <p className="text-sm font-bold leading-tight text-brand-red dark:text-white">Al Fataax</p>
          <p className="text-xs leading-tight text-gray-500 dark:text-white/60">Education Management</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {isAdmin && (
          <NavItem to="/dashboard" icon={NAV_ICONS.dashboard} onNavigate={onNavigate}>
            Dashboard
          </NavItem>
        )}

        {(isAdmin || isCoordinator) && (
          <SidebarGroup icon={NAV_ICONS.registrations} label="Registrations" hasActiveChild={inRegistrations} defaultExpanded={inRegistrations}>
            {isAdmin && (
              <>
                <NavItem to="/registrations/buildings" icon={NAV_ICONS.building} onNavigate={onNavigate} indented>
                  Masjid Registration
                </NavItem>
                <NavItem to="/registrations/fans" icon={NAV_ICONS.fan} onNavigate={onNavigate} indented>
                  Fan Registration
                </NavItem>
                <NavItem to="/registrations/subjects" icon={NAV_ICONS.subject} onNavigate={onNavigate} indented>
                  Religious Book Registration
                </NavItem>
                <NavItem to="/registrations/classes" icon={NAV_ICONS.class} onNavigate={onNavigate} indented>
                  Educational Stage Registration
                </NavItem>
              </>
            )}
            <NavItem to="/registrations/students" icon={NAV_ICONS.student} onNavigate={onNavigate} indented>
              Student Registration
            </NavItem>
            {isAdmin && (
              <>
                <NavItem to="/registrations/teachers" icon={NAV_ICONS.teacher} onNavigate={onNavigate} indented>
                  Teacher Registration
                </NavItem>
                <NavItem to="/registrations/coordinators" icon={NAV_ICONS.coordinator} onNavigate={onNavigate} indented>
                  Coordinator Registration
                </NavItem>
                <NavItem to="/registrations/users" icon={NAV_ICONS.user} onNavigate={onNavigate} indented>
                  User Registration
                </NavItem>
              </>
            )}
          </SidebarGroup>
        )}

        <SidebarGroup icon={NAV_ICONS.results} label="Results" hasActiveChild={inResults} defaultExpanded={inResults}>
          {isAdmin && (
            <NavItem to="/results/register" icon={NAV_ICONS.resultsReg} onNavigate={onNavigate} indented>
              Results Registration
            </NavItem>
          )}
          <NavItem to="/results/view" icon={NAV_ICONS.viewResults} onNavigate={onNavigate} indented>
            View Results
          </NavItem>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup icon={NAV_ICONS.reports} label="Reports" hasActiveChild={inReports} defaultExpanded={inReports}>
            <NavItem to="/reports/teachers" icon={NAV_ICONS.teacher} onNavigate={onNavigate} indented>
              All Teachers Report
            </NavItem>
            <NavItem to="/reports/teachers-by-mosque" icon={NAV_ICONS.building} onNavigate={onNavigate} indented>
              Teachers by Mosque
            </NavItem>
            <NavItem to="/reports/students" icon={NAV_ICONS.student} onNavigate={onNavigate} indented>
              All Students Report
            </NavItem>
            <NavItem to="/reports/results-all" icon={NAV_ICONS.results} onNavigate={onNavigate} indented>
              All Students Results
            </NavItem>
            <NavItem to="/reports/results-by-stage" icon={NAV_ICONS.viewResults} onNavigate={onNavigate} indented>
              Stage Results
            </NavItem>
            <NavItem to="/reports/student" icon={NAV_ICONS.user} onNavigate={onNavigate} indented>
              Individual Student
            </NavItem>
            <NavItem to="/reports/books" icon={NAV_ICONS.subject} onNavigate={onNavigate} indented>
              Religious Books Report
            </NavItem>
          </SidebarGroup>
        )}

        {isCoordinator && (
          <NavItem to="/reports" icon={NAV_ICONS.reports} onNavigate={onNavigate}>
            Reports
          </NavItem>
        )}
      </nav>
    </aside>
  );
}
