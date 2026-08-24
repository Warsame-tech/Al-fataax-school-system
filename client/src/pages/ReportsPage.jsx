import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import reportsApi from '../api/reportsApi';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

function ReportCard({ title, children }) {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-lg font-semibold text-brand-red dark:text-red-400">{title}</h2>
      {children}
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function SimpleTable({ columns, rows, rowKey = 'id', emptyMessage = 'No data.' }) {
  if (!rows || rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }
  return (
    <div className="scroll-thin w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-2.5 font-semibold text-brand-red dark:text-red-400">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              className="border-b border-gray-100 last:border-0 hover:bg-brand-gold-light/10 dark:border-gray-700 dark:hover:bg-brand-gold/10"
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-2.5 text-gray-700 dark:text-gray-100">
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STAGE_STUDENT_COLUMNS = [
  { key: 'stageName', header: 'Educational Stage' },
  { key: 'count', header: 'Students' },
  { key: 'male', header: 'Male' },
  { key: 'female', header: 'Female' },
];

// Every report type an admin can open, grouped by category. Each links to
// its own sub-route (clean support for a real browser "print this report"
// action per report, and a bookmarkable/shareable URL per report).
const REPORT_GROUPS = [
  {
    label: 'Teachers',
    reports: [
      { to: '/reports/teachers', title: 'All Teachers Report', description: 'Every registered teacher, system-wide.' },
      { to: '/reports/teachers-by-mosque', title: 'Teachers by Mosque Report', description: 'Teachers filtered to a single masjid.' },
    ],
  },
  {
    label: 'Students',
    reports: [
      { to: '/reports/students', title: 'All Students Report', description: 'Full student roster, optionally filtered.' },
    ],
  },
  {
    label: 'Results',
    reports: [
      { to: '/reports/results-all', title: 'All Students Results', description: 'System-wide results marksheet.' },
      { to: '/reports/results-by-stage', title: 'Stage Results', description: 'Results marksheet for one masjid & stage.' },
      { to: '/reports/student', title: 'Individual Student', description: 'One student’s information or results.' },
    ],
  },
  {
    label: 'Curriculum',
    reports: [
      { to: '/reports/books', title: 'Religious Books Report', description: 'Every religious book, grouped by fan.' },
    ],
  },
];

function ReportTile({ to, title, description }) {
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

export default function ReportsPage() {
  const { user } = useAuth();
  const isCoordinator = user?.userType === 'coordinator';

  const [loading, setLoading] = useState(isCoordinator);
  const [myBuilding, setMyBuilding] = useState(null);

  useEffect(() => {
    if (!isCoordinator) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await reportsApi.myBuilding();
        if (active) setMyBuilding(data);
      } catch (err) {
        toast.error(err.message || 'Failed to load reports.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isCoordinator]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-red dark:text-red-400">Reports</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {isCoordinator ? 'Overview of your masjid.' : 'Choose a report to view, print, or download.'}
      </p>

      {isCoordinator ? (
        loading ? (
          <LoadingState label="Loading reports..." />
        ) : !myBuilding ? (
          <EmptyState message="No report data available." />
        ) : (
          <ReportCard title={myBuilding.buildingName || 'My Masjid'}>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatPill label="Total Students" value={myBuilding.studentCount ?? 0} />
              <StatPill label="Total Teachers" value={myBuilding.teacherCount ?? 0} />
            </div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Students by Educational Stage</h3>
            <SimpleTable
              columns={STAGE_STUDENT_COLUMNS}
              rows={myBuilding.studentsByStage || []}
              rowKey="stageId"
              emptyMessage="No students registered yet."
            />
          </ReportCard>
        )
      ) : (
        REPORT_GROUPS.map((group) => (
          <div key={group.label} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {group.label}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.reports.map((r) => (
                <ReportTile key={r.to} to={r.to} title={r.title} description={r.description} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
