import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import teachersApi from '../../api/teachersApi';
import useDataSync from '../../hooks/useDataSync';
import ReportDocument from '../../components/reports/ReportDocument';
import ReportToolbar from '../../components/reports/ReportToolbar';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { exportElementToPdf } from '../../utils/exportPdf';

export default function TeachersReportPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teachersApi.list();
      setTeachers(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load teachers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useDataSync(['teachers'], fetchTeachers);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportElementToPdf(docRef.current, 'all-teachers-report.pdf');
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

      <ReportToolbar onDownload={handleDownload} downloading={downloading} disabled={loading || teachers.length === 0} />

      {loading ? (
        <LoadingState label="Loading report..." />
      ) : (
        <ReportDocument title="All Teachers Report" innerRef={docRef}>
          {teachers.length === 0 ? (
            <EmptyState message="No teachers registered yet." />
          ) : (
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Name</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Masjid</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{t.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{t.Building?.name || '—'}</td>
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
