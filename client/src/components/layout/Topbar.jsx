import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import useTheme from '../../hooks/useTheme';
import useAuth from '../../hooks/useAuth';
import settingsApi from '../../api/settingsApi';
import { USER_TYPE_LABELS } from '../../utils/constants';
import ToggleSwitch from '../common/ToggleSwitch';

// The one global Results Visibility control in the entire system — admin
// only. OFF blocks every non-admin role from every results endpoint
// (enforced server-side in enforceResultsVisibility.js, not just hidden
// here); there is no per-masjid/per-stage/per-role variant anymore.
function ResultsVisibilityToggle() {
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const data = await settingsApi.getResultsVisibility();
      setVisible(data.resultsVisible);
    } catch {
      // Leave the last-known state on a transient failure rather than
      // flashing a wrong value.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleToggle = async (next) => {
    setSaving(true);
    try {
      const resultsVisible = await settingsApi.updateResultsVisibility(next);
      setVisible(resultsVisible);
      toast.success(
        resultsVisible
          ? 'Results turned ON. Users can now view results according to their permissions.'
          : 'Results turned OFF. Only the admin can view results until this is turned back on.',
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update results visibility.');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 dark:border-gray-600">
      <ToggleSwitch checked={visible} disabled={saving} label="Global Results Visibility" onChange={handleToggle} />
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
        Results: <span className={visible ? 'text-brand-green dark:text-green-400' : 'text-status-error dark:text-red-400'}>{visible ? 'ON' : 'OFF'}</span>
      </span>
    </div>
  );
}

export default function Topbar({ onMenuClick, title }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const isAdmin = user?.userType === 'admin';

  return (
    <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:justify-end md:border-b-0 md:bg-transparent md:px-6 md:py-3 md:shadow-none dark:md:bg-transparent">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg p-2 text-brand-red hover:bg-brand-red/10 dark:text-red-400 dark:hover:bg-brand-red/20 md:hidden"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span className="flex-1 text-base font-semibold text-brand-red dark:text-red-400 md:hidden">{title || 'Al Fataax'}</span>

      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          {isAdmin && <ResultsVisibilityToggle />}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {theme === 'dark' ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-brand-red/30 px-3 py-1.5 text-sm font-medium text-brand-red hover:bg-brand-red/10 dark:border-red-400/30 dark:text-red-400 dark:hover:bg-brand-red/20"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 5v1a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {user && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
            <span> · {USER_TYPE_LABELS[user.userType] || user.userType}</span>
          </p>
        )}
      </div>
    </header>
  );
}
