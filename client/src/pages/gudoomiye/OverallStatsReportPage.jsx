import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import dashboardApi from '../../api/dashboardApi';
import StatCard from '../../components/common/StatCard';
import LoadingState from '../../components/common/LoadingState';
import useDataSync from '../../hooks/useDataSync';
import { CARD_DEFS, CARD_ICONS } from '../dashboardCards';

export default function OverallStatsReportPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const fetchSummary = useCallback(async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const data = await dashboardApi.summary();
      setSummary(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load overall statistics.');
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useDataSync('*', fetchSummary);

  return (
    <div>
      <div className="mb-4">
        <Link to="/gudoomiye" className="text-sm font-medium text-brand-red hover:underline dark:text-red-400">
          ← Back to GUDOOMIYE
        </Link>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-brand-red dark:text-red-400">Overall Statistics</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Overview of registered records across the system.</p>

      {loading ? (
        <LoadingState label="Loading statistics..." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARD_DEFS.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={summary?.[card.key] ?? 0}
              icon={CARD_ICONS[card.key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
