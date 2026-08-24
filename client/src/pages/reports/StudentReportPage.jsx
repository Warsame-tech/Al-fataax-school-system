import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import buildingsApi from '../../api/buildingsApi';
import classesApi from '../../api/classesApi';
import studentsApi from '../../api/studentsApi';
import resultsApi from '../../api/resultsApi';
import useDataSync from '../../hooks/useDataSync';
import ReportDocument from '../../components/reports/ReportDocument';
import ReportToolbar from '../../components/reports/ReportToolbar';
import { SingleStudentMarksheet } from '../../components/results/ResultsMarksheet';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { exportElementToPdf } from '../../utils/exportPdf';

const VARIANTS = [
  { key: 'info', label: 'Student Information' },
  { key: 'results', label: 'Student Results' },
];

export default function StudentReportPage() {
  const [buildings, setBuildings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [buildingId, setBuildingId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');

  const [variant, setVariant] = useState('info');
  const [studentInfo, setStudentInfo] = useState(null);
  const [studentResults, setStudentResults] = useState(null);
  const [loading, setLoading] = useState(false);
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

  // Refetches just the student dropdown for the current masjid/stage
  // selection — kept separate from the reset effect below so a background
  // 'students' change never wipes the report currently on screen.
  const fetchStudentsForSelection = useCallback(() => {
    if (!buildingId || !classId) {
      setStudents([]);
      return;
    }
    studentsApi
      .list({ buildingId, classId })
      .then((data) => setStudents(data || []))
      .catch(() => setStudents([]));
  }, [buildingId, classId]);

  useEffect(() => {
    setStudentId('');
    setStudents([]);
    fetchStudentsForSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId, classId]);

  useDataSync(['students'], fetchStudentsForSelection);

  const fetchStudentDetail = useCallback(async () => {
    if (!studentId) {
      setStudentInfo(null);
      setStudentResults(null);
      return;
    }
    setLoading(true);
    try {
      const [info, results] = await Promise.all([studentsApi.get(studentId), resultsApi.byStudent(studentId)]);
      setStudentInfo(info);
      setStudentResults(results);
    } catch (err) {
      toast.error(err.message || 'Failed to load student report.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentDetail();
  }, [fetchStudentDetail]);

  useDataSync(['students', 'results'], fetchStudentDetail);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const filename = variant === 'info' ? 'student-information-report.pdf' : 'student-results-report.pdf';
      await exportElementToPdf(docRef.current, filename);
    } catch {
      toast.error('Failed to generate the PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="no-print mb-4">
        <Link to="/reports" className="text-sm font-medium text-brand-red hover:underline dark:text-red-400">
          ← Back to Reports
        </Link>
      </div>

      <div className="no-print mb-6 grid grid-cols-1 gap-4 sm:max-w-2xl sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Masjid</label>
          <select
            value={buildingId}
            onChange={(e) => {
              setBuildingId(e.target.value ? Number(e.target.value) : '');
              setClassId('');
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Select masjid...</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Educational Stage</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : '')}
            disabled={!buildingId}
            dir="rtl"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-right text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700"
          >
            <option value="">{buildingId ? 'Select stage...' : 'Select masjid first'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ar}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Student</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : '')}
            disabled={!buildingId || !classId}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700"
          >
            <option value="">{!buildingId || !classId ? 'Select stage first' : 'Select student...'}</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!studentId ? (
        <EmptyState message="Select a student to view their report." />
      ) : (
        <>
          <div className="no-print mb-4 flex gap-2">
            {VARIANTS.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setVariant(v.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  variant === v.key
                    ? 'bg-brand-red text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {loading ? (
            <LoadingState label="Loading report..." />
          ) : (
            <>
              <ReportToolbar onDownload={handleDownload} downloading={downloading} disabled={!studentInfo && !studentResults} />

              {variant === 'info' ? (
                <ReportDocument title="Student Information Report" innerRef={docRef}>
                  {!studentInfo ? (
                    <EmptyState message="Student information unavailable." />
                  ) : (
                    <table className="w-full min-w-max text-left text-sm">
                      <tbody>
                        <tr className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Name</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{studentInfo.name}</td>
                        </tr>
                        <tr className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Gender</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Badge color={studentInfo.gender === 'Male' ? 'blue' : 'gold'}>{studentInfo.gender}</Badge>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Masjid</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{studentInfo.Building?.name || '—'}</td>
                        </tr>
                        <tr className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Educational Stage</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700 dark:text-gray-100" dir="rtl">
                            {studentInfo.Class?.name_ar || '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </ReportDocument>
              ) : (
                <SingleStudentMarksheet ref={docRef} result={studentResults} title="Student Results Report" />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
