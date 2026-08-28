import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import buildingsApi from '../../api/buildingsApi';
import gudoomiyeReportsApi from '../../api/gudoomiyeReportsApi';
import useDataSync from '../../hooks/useDataSync';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';

function StatPill({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

const GENDER_FILTERS = [
  { value: '', label: 'All' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

export default function MasjidStudentReportPage() {
  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState('');
  const [gender, setGender] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBuildings = useCallback(() => {
    buildingsApi.list().then((data) => setBuildings(data || [])).catch(() => setBuildings([]));
  }, []);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  useDataSync(['masjids'], fetchBuildings);

  const fetchReport = useCallback(async () => {
    if (!buildingId) {
      setReport(null);
      return;
    }
    setLoading(true);
    try {
      const data = await gudoomiyeReportsApi.masjidStudents({ buildingId, gender: gender || undefined });
      setReport(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load report.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [buildingId, gender]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useDataSync(['students', 'masjids', 'stages'], fetchReport);

  return (
    <div>
      <div className="mb-4">
        <Link to="/gudoomiye" className="text-sm font-medium text-brand-red hover:underline dark:text-red-400">
          ← Back to GUDOOMIYE
        </Link>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-brand-red dark:text-red-400">Masjid Students</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Choose a masjid to see its full student roster and gender split.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:max-w-lg sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Masjid <span className="text-status-error">*</span>
          </label>
          <select
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Select a masjid...</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {GENDER_FILTERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!buildingId ? (
        <EmptyState message="Select a masjid to view its report." />
      ) : loading ? (
        <LoadingState label="Loading report..." />
      ) : !report ? (
        <EmptyState message="No report data available." />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-brand-red dark:text-red-400">{report.buildingName}</h2>

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatPill label="Total Students" value={report.total} />
            <StatPill label="Male" value={report.male} />
            <StatPill label="Female" value={report.female} />
          </div>

          {!report.students || report.students.length === 0 ? (
            <EmptyState message="No students registered at this masjid." />
          ) : (
            <div className="scroll-thin w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full min-w-max text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
                    <th className="whitespace-nowrap px-4 py-2.5 font-semibold text-brand-red dark:text-red-400">Name</th>
                    <th className="whitespace-nowrap px-4 py-2.5 font-semibold text-brand-red dark:text-red-400">Gender</th>
                    <th className="whitespace-nowrap px-4 py-2.5 font-semibold text-brand-red dark:text-red-400">Educational Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {report.students.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-brand-gold-light/10 dark:border-gray-700 dark:hover:bg-brand-gold/10"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-700 dark:text-gray-100">{s.name}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <Badge color={s.gender === 'Male' ? 'blue' : 'gold'}>{s.gender}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-700 dark:text-gray-100">{s.stageName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
