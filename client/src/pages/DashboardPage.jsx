import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import dashboardApi from '../api/dashboardApi';
import StatCard from '../components/common/StatCard';
import LoadingState from '../components/common/LoadingState';

const ICON_PROPS = { className: 'h-6 w-6', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' };
const PATH_PROPS = { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5 };

const CARD_ICONS = {
  totalBuildings: (
    <svg {...ICON_PROPS}>
      <path {...PATH_PROPS} d="M3 21h18M6 21V7a1 1 0 011-1h4a1 1 0 011 1v14M15 21V4a1 1 0 011-1h3a1 1 0 011 1v17M9 9h.01M9 12h.01M9 15h.01" />
    </svg>
  ),
  totalFans: (
    <svg {...ICON_PROPS}>
      <path {...PATH_PROPS} d="M17.657 6.343a8 8 0 10-11.314 11.314M17.657 6.343L12 12m5.657-5.657L12 3m0 9l5.657 5.657M12 12L6.343 17.657" />
    </svg>
  ),
  totalStudents: (
    <svg {...ICON_PROPS}>
      <path {...PATH_PROPS} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12.06 12.06 0 0121 12c0 2.4-.9 4.6-2.4 6.3M12 14l-6.16-3.42A12.06 12.06 0 003 12c0 2.4.9 4.6 2.4 6.3M12 14v7" />
    </svg>
  ),
  totalTeachers: (
    <svg {...ICON_PROPS}>
      <path {...PATH_PROPS} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  totalCoordinators: (
    <svg {...ICON_PROPS}>
      <path {...PATH_PROPS} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm6 3.13a4 4 0 00-3-6.13" />
    </svg>
  ),
  totalClasses: (
    <svg {...ICON_PROPS}>
      <path {...PATH_PROPS} d="M12 3l9 5-9 5-9-5 9-5z" />
      <path {...PATH_PROPS} d="M3 13l9 5 9-5" />
      <path {...PATH_PROPS} d="M3 18l9 5 9-5" />
    </svg>
  ),
  totalSubjects: (
    <svg {...ICON_PROPS}>
      <path
        {...PATH_PROPS}
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  ),
  totalResults: (
    <svg {...ICON_PROPS}>
      <path
        {...PATH_PROPS}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14"
      />
    </svg>
  ),
};

const CARD_DEFS = [
  { key: 'totalBuildings', label: 'Total Masjids' },
  { key: 'totalFans', label: 'Total Fans' },
  { key: 'totalStudents', label: 'Total Students' },
  { key: 'totalTeachers', label: 'Total Teachers' },
  { key: 'totalCoordinators', label: 'Total Coordinators' },
  { key: 'totalClasses', label: 'Total Educational Stages' },
  { key: 'totalSubjects', label: 'Total Religious Books' },
  { key: 'totalResults', label: 'Total Results' },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await dashboardApi.summary();
        if (active) setSummary(data);
      } catch (err) {
        toast.error(err.message || 'Failed to load dashboard summary.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-red dark:text-red-400">Dashboard</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Overview of registered records across the system.</p>

      {loading ? (
        <LoadingState label="Loading dashboard..." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARD_DEFS.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={summary?.[card.key] ?? 0}
              icon={CARD_ICONS[card.key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
