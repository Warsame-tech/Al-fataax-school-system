import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import buildingsApi from '../../api/buildingsApi';
import classesApi from '../../api/classesApi';
import studentsApi from '../../api/studentsApi';
import useAuth from '../../hooks/useAuth';
import useDataSync from '../../hooks/useDataSync';
import ReportDocument from '../../components/reports/ReportDocument';
import ReportToolbar from '../../components/reports/ReportToolbar';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { exportElementToPdf } from '../../utils/exportPdf';

export default function StudentsReportPage() {
  const { user } = useAuth();
  const backTo = user?.userType === 'gudoomiye' ? '/gudoomiye' : '/reports';
  const backLabel = user?.userType === 'gudoomiye' ? '← Back to GUDOOMIYE' : '← Back to Reports';
  const [buildings, setBuildings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [buildingId, setBuildingId] = useState('');
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef(null);

  const fetchFilters = useCallback(() => {
    buildingsApi.list().then((data) => setBuildings(data || [])).catch(() => setBuildings([]));
    classesApi.list().then((data) => setClasses(data || [])).catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useDataSync(['masjids', 'stages'], fetchFilters);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentsApi.list({ buildingId: buildingId || undefined, classId: classId || undefined });
      setStudents(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load students.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [buildingId, classId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // 'masjids'/'stages' too — the student rows carry joined Building/Class
  // names that would otherwise go stale after a rename elsewhere.
  useDataSync(['students', 'masjids', 'stages'], fetchStudents);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportElementToPdf(docRef.current, 'all-students-report.pdf');
    } catch {
      toast.error('Failed to generate the PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="no-print mb-4">
        <Link to={backTo} className="text-sm font-medium text-brand-red hover:underline dark:text-red-400">
          {backLabel}
        </Link>
      </div>

      <div className="no-print mb-6 grid grid-cols-1 gap-4 sm:max-w-lg sm:grid-cols-2">
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

      <ReportToolbar onDownload={handleDownload} downloading={downloading} disabled={loading || students.length === 0} />

      {loading ? (
        <LoadingState label="Loading report..." />
      ) : (
        <ReportDocument title="Students Report" innerRef={docRef}>
          {students.length === 0 ? (
            <EmptyState message="No students found." />
          ) : (
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Name</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Gender</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Masjid</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Educational Stage</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{s.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge color={s.gender === 'Male' ? 'blue' : 'gold'}>{s.gender}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{s.Building?.name || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700 dark:text-gray-100" dir="rtl">
                      {s.Stages?.length ? s.Stages.map((c) => c.name_ar).join(', ') : '—'}
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
