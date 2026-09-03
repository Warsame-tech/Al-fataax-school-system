import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import gudoomiyeReportsApi from '../../api/gudoomiyeReportsApi';
import useDataSync from '../../hooks/useDataSync';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

function StatPill({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

export default function SummaryReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gudoomiyeReportsApi.summary();
      setReport(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load the summary report.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useDataSync(['students', 'masjids'], fetchReport);

  return (
    <div>
      <div className="mb-4">
        <Link to="/gudoomiye" className="text-sm font-medium text-brand-red hover:underline dark:text-red-400">
          ← Back to GUDOOMIYE
        </Link>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-brand-red dark:text-red-400">Summary Report</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        System-wide student statistics, calculated live from the database.
      </p>

      {loading ? (
        <LoadingState label="Loading summary..." />
      ) : !report ? (
        <EmptyState message="No report data available." />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatPill label="Total Students" value={report.total} />
            <StatPill label="Male" value={report.male} />
            <StatPill label="Female" value={report.female} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatPill label="New / Pending" value={report.pending} />
            <StatPill label="Accepted" value={report.accepted} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-brand-red dark:text-red-400">Students by Masjid</h2>
            {!report.byBuilding || report.byBuilding.length === 0 ? (
              <EmptyState message="No masjids registered yet." />
            ) : (
              <div className="scroll-thin w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full min-w-max text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
                      <th className="whitespace-nowrap px-4 py-2.5 font-semibold text-brand-red dark:text-red-400">Masjid</th>
                      <th className="whitespace-nowrap px-4 py-2.5 font-semibold text-brand-red dark:text-red-400">Total Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byBuilding.map((b) => (
                      <tr key={b.buildingId} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                        <td className="whitespace-nowrap px-4 py-2.5 text-gray-700 dark:text-gray-100">{b.buildingName}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-gray-700 dark:text-gray-100">{b.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
