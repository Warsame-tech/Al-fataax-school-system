import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import subjectsApi from '../../api/subjectsApi';
import useDataSync from '../../hooks/useDataSync';
import ReportDocument from '../../components/reports/ReportDocument';
import ReportToolbar from '../../components/reports/ReportToolbar';
import LoadingState from '../../components/common/LoadingState';
import FanPivotTable from '../../components/common/FanPivotTable';
import { exportElementToPdf } from '../../utils/exportPdf';

export default function BooksReportPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await subjectsApi.list();
      setBooks(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load religious books.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Books are grouped/labelled by fan in this report, so a fan rename
  // needs the same refresh as a book create/update/delete.
  useDataSync(['books', 'fans'], fetchBooks);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportElementToPdf(docRef.current, 'religious-books-report.pdf');
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

      <ReportToolbar onDownload={handleDownload} downloading={downloading} disabled={loading || books.length === 0} />

      {loading ? (
        <LoadingState label="Loading report..." />
      ) : (
        <ReportDocument title="Religious Books Report" innerRef={docRef}>
          <FanPivotTable books={books} emptyMessage="No religious books found." />
        </ReportDocument>
      )}
    </div>
  );
}
