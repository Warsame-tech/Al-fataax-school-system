import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import resultsApi from '../../api/resultsApi';
import useDataSync from '../../hooks/useDataSync';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { gradeToColor } from '../../utils/gradeUtils';

const RANK_BADGE_COLOR = { 1: 'gold', 2: 'neutral', 3: 'blue' };

// Shared by the "Top 3 Each Stage" and "Top 10 Each Stage" menu items —
// same leaderboard data, just a different `limit`. A coordinator only ever
// sees their own masjid's students here (server-enforced via
// ownBuildingId, same as every other results view for that role), but each
// still carries their true Stage-wide rank, not a masjid-relative one.
export default function TopStudentsPage({ limit, title, description }) {
  const { user } = useAuth();
  const isCoordinator = user?.userType === 'coordinator';
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await resultsApi.leaderboard(limit);
      setStages(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load the leaderboard.');
      setStages([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useDataSync(['results', 'students', 'stages'], fetchLeaderboard);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-red dark:text-red-400">{title}</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {description}
        {isCoordinator && ' Showing your masjid’s students only.'}
      </p>

      {loading ? (
        <LoadingState label="Loading leaderboard..." />
      ) : stages.length === 0 ? (
        <EmptyState message="No results have been registered yet." />
      ) : (
        <div className="flex flex-col gap-6">
          {stages.map((stage) => (
            <div
              key={stage.stageId}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="bg-brand-red px-4 py-2.5 text-right text-base font-bold text-white dark:bg-brand-red-dark" dir="rtl">
                {stage.stageName}
              </div>
              <div className="scroll-thin overflow-x-auto">
                <table className="w-full min-w-max text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Rank</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Student ID</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Student Name</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Masjid</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Average</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stage.students.map((s) => (
                      <tr key={s.studentId} className="border-b border-gray-100 last:border-0 hover:bg-brand-gold-light/10 dark:border-gray-700 dark:hover:bg-brand-gold/10">
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge color={RANK_BADGE_COLOR[s.rank] || 'neutral'}>#{s.rank}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{s.studentId}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{s.studentName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{s.buildingName || '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{s.average}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge color={gradeToColor(s.grade)}>{s.grade}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
