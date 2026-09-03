import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import buildingsApi from '../../api/buildingsApi';
import classesApi from '../../api/classesApi';
import resultsApi from '../../api/resultsApi';
import useAuth from '../../hooks/useAuth';
import useDataSync from '../../hooks/useDataSync';
import useDebounce from '../../hooks/useDebounce';
import { GroupedStudentResultsMarksheet } from '../../components/results/ResultsMarksheet';
import ReportToolbar from '../../components/reports/ReportToolbar';
import LoadingState from '../../components/common/LoadingState';
import { exportReportToPdf, exportReportToExcel } from '../../utils/reportExport';

export default function ResultsAllReportPage() {
  const { user } = useAuth();
  // GUDOOMIYE KUXIGEEN (coordinator) is strictly limited to their own
  // assigned masjid here — no masjid picker is rendered for that role, and
  // resultController.getAll hard-locks the query to their masjid server-side
  // regardless of what's sent, so the restriction holds even against a
  // tampered direct API call.
  const isCoordinator = user?.userType === 'coordinator';
  const [buildings, setBuildings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [buildingId, setBuildingId] = useState('');
  const [classId, setClassId] = useState('');
  const [gender, setGender] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [rows, setRows] = useState([]);
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

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const envelope = await resultsApi.all({
        buildingId: buildingId || undefined,
        classId: classId || undefined,
        gender: gender || undefined,
        search: debouncedSearch || undefined,
      });
      setRows(envelope?.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load results.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [buildingId, classId, gender, debouncedSearch]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useDataSync(['results', 'students'], fetchResults);

  const buildReport = () => ({
    title: 'All Students Results Report',
    sections: rows.map((row) => ({
      heading: `${row.studentName} (${row.studentId})`,
      meta: [
        ...(row.gender ? [{ label: 'Gender', value: row.gender }] : []),
        ...(row.buildingName ? [{ label: 'Masjid', value: row.buildingName }] : []),
        ...(row.stageName ? [{ label: 'Stage', value: row.stageName }] : []),
      ],
      columns: [
        { key: 'subjectName', label: 'Religious Book' },
        { key: 'marks', label: 'Marks' },
      ],
      rows: (row.subjects || []).map((s) => ({ subjectName: s.subjectName, marks: s.marks })),
      summary: [
        { label: 'Total', value: row.total },
        { label: 'Average', value: row.average },
        { label: 'Grade', value: row.grade },
      ],
    })),
  });

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await exportReportToPdf(buildReport(), 'all-students-results-report.pdf');
    } catch {
      toast.error('Failed to generate the PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      await exportReportToExcel(buildReport(), 'all-students-results-report.xlsx');
    } catch {
      toast.error('Failed to generate the Excel file.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div>
      <div className="no-print mb-4">
        <Link to="/reports" className="text-sm font-medium text-brand-red hover:underline dark:text-red-400">
          ← Back to Reports
        </Link>
      </div>

      {isCoordinator && (
        <p className="no-print mb-4 text-sm text-gray-500 dark:text-gray-400">
          Showing results for your masjid only
          {rows[0]?.buildingName ? (
            <>
              : <span className="font-semibold text-gray-800 dark:text-gray-200">{rows[0].buildingName}</span>
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
        disabled={loading || rows.length === 0}
      />

      {loading ? (
        <LoadingState label="Loading report..." />
      ) : (
        <GroupedStudentResultsMarksheet
          rows={rows}
          title="All Students Results Report"
          emptyMessage="No results found."
        />
      )}
    </div>
  );
}
