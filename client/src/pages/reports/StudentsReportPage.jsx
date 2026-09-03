import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import buildingsApi from '../../api/buildingsApi';
import classesApi from '../../api/classesApi';
import studentsApi from '../../api/studentsApi';
import reportsApi from '../../api/reportsApi';
import useAuth from '../../hooks/useAuth';
import useDataSync from '../../hooks/useDataSync';
import useDebounce from '../../hooks/useDebounce';
import ReportDocument from '../../components/reports/ReportDocument';
import ReportToolbar from '../../components/reports/ReportToolbar';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { exportReportToPdf, exportReportToExcel } from '../../utils/reportExport';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function StudentsReportPage() {
  const { user } = useAuth();
  // GUDOOMIYE KUXIGEEN (coordinator) is strictly limited to their own
  // assigned masjid for this report — no masjid picker is rendered for
  // that role, and reportsApi.allStudents() is backed by a server endpoint
  // that hard-locks the query to their masjid regardless of what's sent
  // (see reportController.allStudentsReport), so the restriction holds even
  // against a tampered direct API call. Admin/GUDOOMIYE keep using
  // studentsApi.list, already unscoped for them.
  const isCoordinator = user?.userType === 'coordinator';
  const backTo = user?.userType === 'gudoomiye' ? '/gudoomiye' : '/reports';
  const backLabel = user?.userType === 'gudoomiye' ? '← Back to GUDOOMIYE' : '← Back to Reports';
  const [buildings, setBuildings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [buildingId, setBuildingId] = useState('');
  const [classId, setClassId] = useState('');
  const [gender, setGender] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const fetchFilters = useCallback(() => {
    // A coordinator never sees a masjid picker, so there's no reason to
    // hand their browser the full cross-masjid buildings list either.
    if (!isCoordinator) {
      buildingsApi.list().then((data) => setBuildings(data || [])).catch(() => setBuildings([]));
    }
    classesApi.list().then((data) => setClasses(data || [])).catch(() => setClasses([]));
  }, [isCoordinator]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useDataSync(['masjids', 'stages'], fetchFilters);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        buildingId: buildingId || undefined,
        classId: classId || undefined,
        gender: gender || undefined,
        search: debouncedSearch || undefined,
      };
      const data = isCoordinator ? await reportsApi.allStudents(params) : await studentsApi.list(params);
      setStudents(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load students.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [buildingId, classId, gender, debouncedSearch, isCoordinator]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // 'masjids'/'stages' too — the student rows carry joined Building/Class
  // names that would otherwise go stale after a rename elsewhere.
  useDataSync(['students', 'masjids', 'stages'], fetchStudents);

  const buildReport = () => ({
    title: 'Students Report',
    sections: [
      {
        columns: [
          { key: 'id', label: 'Student ID' },
          { key: 'name', label: 'Name' },
          { key: 'gender', label: 'Gender' },
          { key: 'masjid', label: 'Masjid' },
          { key: 'stage', label: 'Educational Stage' },
          { key: 'registeredOn', label: 'Registered On' },
          { key: 'status', label: 'Status' },
        ],
        rows: students.map((s) => ({
          id: s.id,
          name: s.name,
          gender: s.gender,
          masjid: s.Building?.name,
          stage: s.Stages?.length ? s.Stages.map((c) => c.name_ar).join(', ') : null,
          registeredOn: formatDate(s.createdAt),
          status: s.registrationStatus === 'pending' ? 'Pending' : 'Accepted',
        })),
      },
    ],
  });

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await exportReportToPdf(buildReport(), 'all-students-report.pdf');
    } catch {
      toast.error('Failed to generate the PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      await exportReportToExcel(buildReport(), 'all-students-report.xlsx');
    } catch {
      toast.error('Failed to generate the Excel file.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div>
      <div className="no-print mb-4">
        <Link to={backTo} className="text-sm font-medium text-brand-red hover:underline dark:text-red-400">
          {backLabel}
        </Link>
      </div>

      {isCoordinator && (
        <p className="no-print mb-4 text-sm text-gray-500 dark:text-gray-400">
          Showing students for your masjid only
          {students[0]?.Building?.name ? (
            <>
              : <span className="font-semibold text-gray-800 dark:text-gray-200">{students[0].Building.name}</span>
            </>
          ) : (
            '.'
          )}
        </p>
      )}

      <div className={`no-print mb-6 grid grid-cols-1 gap-4 sm:max-w-3xl sm:grid-cols-2 ${isCoordinator ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Search (Student ID or Name)</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. STD001 or Ahmed"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        {!isCoordinator && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Masjid (optional)</label>
            <select
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All masjids</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Gender (optional)</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">All genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Educational Stage (optional)</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : '')}
            dir="rtl"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-right text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">All stages</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ReportToolbar
        onDownloadPdf={handleDownloadPdf}
        onDownloadExcel={handleDownloadExcel}
        downloadingPdf={downloadingPdf}
        downloadingExcel={downloadingExcel}
        disabled={loading || students.length === 0}
      />

      {loading ? (
        <LoadingState label="Loading report..." />
      ) : (
        <ReportDocument title="Students Report">
          {students.length === 0 ? (
            <EmptyState message="No students found." />
          ) : (
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Student ID</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Name</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Gender</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Masjid</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Educational Stage</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Registered On</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{s.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{s.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge color={s.gender === 'Male' ? 'blue' : 'gold'}>{s.gender}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{s.Building?.name || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700 dark:text-gray-100" dir="rtl">
                      {s.Stages?.length ? s.Stages.map((c) => c.name_ar).join(', ') : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{formatDate(s.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge color={s.registrationStatus === 'pending' ? 'gold' : 'green'}>
                        {s.registrationStatus === 'pending' ? 'Pending' : 'Accepted'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportDocument>
      )}
    </div>
  );
}
