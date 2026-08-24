import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import buildingsApi from '../../api/buildingsApi';
import classesApi from '../../api/classesApi';
import resultsApi from '../../api/resultsApi';
import { MultiStudentMarksheet } from '../../components/results/ResultsMarksheet';
import ReportToolbar from '../../components/reports/ReportToolbar';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { exportElementToPdf } from '../../utils/exportPdf';

export default function ResultsByStageReportPage() {
  const [buildings, setBuildings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [buildingId, setBuildingId] = useState('');
  const [classId, setClassId] = useState('');
  const [rows, setRows] = useState([]);
  const [subjectColumns, setSubjectColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef(null);

  useEffect(() => {
    buildingsApi.list().then((data) => setBuildings(data || [])).catch(() => setBuildings([]));
    classesApi.list().then((data) => setClasses(data || [])).catch(() => setClasses([]));
  }, []);

  const fetchResults = useCallback(async () => {
    if (!buildingId || !classId) return;
    setLoading(true);
    try {
      const envelope = await resultsApi.byClass({ buildingId, classId });
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

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportElementToPdf(docRef.current, 'stage-results-report.pdf');
    } catch {
      toast.error('Failed to generate the PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const stageName = classes.find((c) => c.id === classId)?.name_ar;

  return (
    <div>
      <div className="no-print mb-4">
        <Link to="/reports" className="text-sm font-medium text-brand-red hover:underline dark:text-red-400">
          ← Back to Reports
        </Link>
      </div>

      <div className="no-print mb-6 grid grid-cols-1 gap-4 sm:max-w-lg sm:grid-cols-2">
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
            <option value="">{buildingId ? 'Select educational stage...' : 'Select masjid first'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!buildingId || !classId ? (
        <EmptyState message="Select a masjid and educational stage to view the report." />
      ) : (
        <>
          <ReportToolbar onDownload={handleDownload} downloading={downloading} disabled={loading || rows.length === 0} />
          {loading ? (
            <LoadingState label="Loading report..." />
          ) : (
            <MultiStudentMarksheet
              ref={docRef}
              rows={rows}
              subjectColumns={subjectColumns}
              title={`Stage Results Report — ${stageName || ''}`}
              emptyMessage="No results found for this stage."
            />
          )}
        </>
      )}
    </div>
  );
}
