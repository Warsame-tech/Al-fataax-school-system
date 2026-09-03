import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import subjectsApi from '../../api/subjectsApi';
import useDataSync from '../../hooks/useDataSync';
import ReportDocument from '../../components/reports/ReportDocument';
import ReportToolbar from '../../components/reports/ReportToolbar';
import LoadingState from '../../components/common/LoadingState';
import FanPivotTable from '../../components/common/FanPivotTable';
import { exportReportToPdf, exportReportToExcel } from '../../utils/reportExport';

export default function BooksReportPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

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

  const buildReport = () => {
    const groups = new Map();
    books.forEach((book) => {
      const fanId = book.Fan?.id ?? book.fanId ?? 'unknown';
      const fanName = book.Fan?.name_ar ?? '—';
      if (!groups.has(fanId)) groups.set(fanId, { fanName, books: [] });
      groups.get(fanId).books.push(book);
    });
    return {
      title: 'Religious Books Report',
      sections: Array.from(groups.values()).map((g) => ({
        heading: g.fanName,
        columns: [{ key: 'name', label: 'Religious Book' }],
        rows: g.books.map((b) => ({ name: b.name_ar })),
      })),
    };
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await exportReportToPdf(buildReport(), 'religious-books-report.pdf');
    } catch {
      toast.error('Failed to generate the PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      await exportReportToExcel(buildReport(), 'religious-books-report.xlsx');
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

      <ReportToolbar
        onDownloadPdf={handleDownloadPdf}
        onDownloadExcel={handleDownloadExcel}
        downloadingPdf={downloadingPdf}
        downloadingExcel={downloadingExcel}
        disabled={loading || books.length === 0}
      />

      {loading ? (
        <LoadingState label="Loading report..." />
      ) : (
        <ReportDocument title="Religious Books Report">
          <FanPivotTable books={books} emptyMessage="No religious books found." />
        </ReportDocument>
      )}
    </div>
  );
}
