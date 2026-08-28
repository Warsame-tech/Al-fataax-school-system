import { Link } from 'react-router-dom';

// Same tile pattern as ReportsPage.jsx's ReportTile/REPORT_GROUPS, sized
// for GUDOOMIYE's flat 4-report set (no grouping needed at this count).
const TILES = [
  {
    to: '/gudoomiye/masjid-students',
    title: 'Masjid Students',
    description: 'Pick a masjid to see its full student roster and gender split.',
  },
  {
    to: '/gudoomiye/new-students',
    title: 'New Students',
    description: 'Newly registered students, filterable by masjid, gender and date range.',
  },
  {
    to: '/gudoomiye/all-students',
    title: 'All Madrasa Students',
    description: 'Full student roster across every masjid, optionally filtered.',
  },
  {
    to: '/gudoomiye/overall-stats',
    title: 'Overall Statistics',
    description: 'System-wide totals: masjids, students, teachers, GUDOOMIYE KUXIGEEN, and more.',
  },
];

function GudoomiyeTile({ to, title, description }) {
  return (
    <Link
      to={to}
      className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-gold hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-gold"
    >
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-red dark:text-red-400">
        View Report
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </span>
    </Link>
  );
}

export default function GudoomiyeHomePage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-red dark:text-red-400">GUDOOMIYE</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Choose a report to view.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <GudoomiyeTile key={t.to} to={t.to} title={t.title} description={t.description} />
        ))}
      </div>
    </div>
  );
}
