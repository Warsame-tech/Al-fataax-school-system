import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import buildingsApi from '../../api/buildingsApi';
import teachersApi from '../../api/teachersApi';
import ReportDocument from '../../components/reports/ReportDocument';
import ReportToolbar from '../../components/reports/ReportToolbar';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { exportElementToPdf } from '../../utils/exportPdf';

export default function TeachersByMosqueReportPage() {
  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef(null);

  useEffect(() => {
    buildingsApi.list().then((data) => setBuildings(data || [])).catch(() => setBuildings([]));
  }, []);

  useEffect(() => {
    if (!buildingId) {
      setTeachers([]);
      return;
    }
    let active = true;
    setLoading(true);
    teachersApi
      .list({ buildingId })
      .then((data) => {
        if (active) setTeachers(data || []);
      })
      .catch((err) => toast.error(err.message || 'Failed to load teachers.'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [buildingId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportElementToPdf(docRef.current, 'teachers-by-mosque-report.pdf');
    } catch {
      toast.error('Failed to generate the PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const selectedBuildingName = buildings.find((b) => b.id === buildingId)?.name;

  return (
    <div>
      <div className="no-print mb-4">
        <Link to="/reports" className="text-sm font-medium text-brand-red hover:underline dark:text-red-400">
          ← Back to Reports
        </Link>
      </div>

      <div className="no-print mb-6 max-w-sm">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Masjid</label>
        <select
          value={buildingId}
          onChange={(e) => setBuildingId(e.target.value ? Number(e.target.value) : '')}
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

      {!buildingId ? (
        <EmptyState message="Select a masjid to view its teachers report." />
      ) : (
        <>
          <ReportToolbar onDownload={handleDownload} downloading={downloading} disabled={loading || teachers.length === 0} />

          {loading ? (
            <LoadingState label="Loading report..." />
          ) : (
            <ReportDocument title={`Teachers Report — ${selectedBuildingName || ''}`} innerRef={docRef}>
              {teachers.length === 0 ? (
                <EmptyState message="No teachers registered at this masjid yet." />
              ) : (
                <table className="w-full min-w-max text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{t.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ReportDocument>
          )}
        </>
      )}
    </div>
  );
}
