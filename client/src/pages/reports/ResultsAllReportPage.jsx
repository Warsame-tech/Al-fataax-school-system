import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import buildingsApi from '../../api/buildingsApi';
import classesApi from '../../api/classesApi';
import resultsApi from '../../api/resultsApi';
import useDataSync from '../../hooks/useDataSync';
import { MultiStudentMarksheet } from '../../components/results/ResultsMarksheet';
import ReportToolbar from '../../components/reports/ReportToolbar';
import LoadingState from '../../components/common/LoadingState';
import { exportElementToPdf } from '../../utils/exportPdf';

export default function ResultsAllReportPage() {
  const [buildings, setBuildings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [buildingId, setBuildingId] = useState('');
  const [classId, setClassId] = useState('');
  const [rows, setRows] = useState([]);
  const [subjectColumns, setSubjectColumns] = useState([]);
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

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const envelope = await resultsApi.all({ buildingId: buildingId || undefined, classId: classId || undefined });
      setRows(envelope?.data || []);
      setSubjectColumns(envelope?.subjectColumns || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load results.');
      setRows([]);
      setSubjectColumns([]);
    } finally {
      setLoading(false);
    }
  }, [buildingId, classId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useDataSync(['results', 'students'], fetchResults);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportElementToPdf(docRef.current, 'all-students-results-report.pdf');
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

      <ReportToolbar onDownload={handleDownload} downloading={downloading} disabled={loading || rows.length === 0} />

      {loading ? (
        <LoadingState label="Loading report..." />
      ) : (
        <MultiStudentMarksheet
          ref={docRef}
          rows={rows}
          subjectColumns={subjectColumns}
          title="All Students Results Report"
          emptyMessage="No results found."
        />
      )}
    </div>
  );
}
