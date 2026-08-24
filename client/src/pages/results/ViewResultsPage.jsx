import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import buildingsApi from '../../api/buildingsApi';
import classesApi from '../../api/classesApi';
import resultsApi from '../../api/resultsApi';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { gradeToColor } from '../../utils/gradeUtils';
import { MultiStudentMarksheet, SingleStudentMarksheet } from '../../components/results/ResultsMarksheet';

const MODES = [
  { key: 'browse', label: 'Browse by Masjid & Stage' },
  { key: 'all', label: 'All Students' },
  { key: 'search', label: 'Search by Student ID' },
];

// Student-ID search box, shared by admin's "Search by Student ID" mode and
// the entire teacher/coordinator view (they never see masjid/stage pickers —
// the backend already scopes them to their own masjid).
function StudentIdSearch() {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!studentId) return;
    setLoading(true);
    setResult(null); // never render a stale result while a new search is in flight
    try {
      const data = await resultsApi.search(studentId);
      setResult(data);
    } catch (err) {
      toast.error(err.message || 'Failed to search for this student.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-6 flex max-w-sm items-end gap-3">
        <div className="flex-1">
          <label htmlFor="searchStudentId" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Student ID
          </label>
          <input
            id="searchStudentId"
            type="number"
            min={1}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter student ID..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <Button type="submit" disabled={loading || !studentId}>
          {loading ? 'Searching...' : 'Search Results'}
        </Button>
      </form>

      {loading ? (
        <LoadingState label="Searching..." />
      ) : (
        result && <SingleStudentMarksheet result={result} />
      )}
    </div>
  );
}

export default function ViewResultsPage() {
  const { user } = useAuth();
  const isStudent = user?.userType === 'student';
  const isTeacher = user?.userType === 'teacher';
  const isCoordinator = user?.userType === 'coordinator';
  const isAdmin = user?.userType === 'admin';
  // Teachers and coordinators are both scoped to a single masjid (their own),
  // so any gating logic that pre-locks the masjid from the logged-in user's
  // profile applies equally to both roles.
  const isTeacherOrCoordinator = isTeacher || isCoordinator;

  // Student flow (unchanged)
  const [studentResult, setStudentResult] = useState(null);
  const [studentLoading, setStudentLoading] = useState(isStudent);

  // Admin mode switcher
  const [mode, setMode] = useState('browse');

  // Browse-by-masjid-&-stage flow (admin only)
  const [buildingId, setBuildingId] = useState('');
  const [classId, setClassId] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [subjectColumns, setSubjectColumns] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  // All-students flow (admin only)
  const [allBuildingId, setAllBuildingId] = useState('');
  const [allClassId, setAllClassId] = useState('');
  const [allRows, setAllRows] = useState([]);
  const [allSubjectColumns, setAllSubjectColumns] = useState([]);
  const [allLoading, setAllLoading] = useState(false);

  useEffect(() => {
    if (!isStudent) return;
    let active = true;
    (async () => {
      setStudentLoading(true);
      try {
        const data = await resultsApi.byStudent(user?.studentId || 'self');
        if (active) setStudentResult(data);
      } catch (err) {
        toast.error(err.message || 'Failed to load your results.');
      } finally {
        if (active) setStudentLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isStudent, user]);

  // Admin: load masjids list up front for the browse and all-students modes.
  useEffect(() => {
    if (!isAdmin) return;
    buildingsApi.list().then((data) => setBuildings(data || [])).catch(() => setBuildings([]));
    classesApi.list().then((data) => setClasses(data || [])).catch(() => setClasses([]));
  }, [isAdmin]);

  // Browse mode: load educational stages once the masjid is known.
  useEffect(() => {
    if (!isAdmin || mode !== 'browse' || !buildingId) return;
    setClassesLoading(true);
    setClassId('');
    classesApi
      .list()
      .then((data) => setClasses(data || []))
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  }, [isAdmin, mode, buildingId]);

  const fetchClassResults = useCallback(async () => {
    if (!buildingId || !classId) return;
    setTableLoading(true);
    try {
      const envelope = await resultsApi.byClass({ buildingId, classId });
      setRows(envelope?.data || []);
      setSubjectColumns(envelope?.subjectColumns || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load results.');
      setRows([]);
      setSubjectColumns([]);
    } finally {
      setTableLoading(false);
    }
  }, [buildingId, classId]);

  useEffect(() => {
    if (mode === 'browse') fetchClassResults();
  }, [mode, fetchClassResults]);

  // All-students mode: loads immediately, optionally narrowed by the same
  // masjid/stage selects (both optional here — unlike browse mode).
  const fetchAllResults = useCallback(async () => {
    setAllLoading(true);
    try {
      const envelope = await resultsApi.all({
        buildingId: allBuildingId || undefined,
        classId: allClassId || undefined,
      });
      setAllRows(envelope?.data || []);
      setAllSubjectColumns(envelope?.subjectColumns || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load results.');
      setAllRows([]);
      setAllSubjectColumns([]);
    } finally {
      setAllLoading(false);
    }
  }, [allBuildingId, allClassId]);

  useEffect(() => {
    if (mode === 'all') fetchAllResults();
  }, [mode, fetchAllResults]);

  const resetToMasjid = () => {
    setBuildingId('');
    setClassId('');
    setRows([]);
    setSubjectColumns([]);
  };

  if (isStudent) {
    return (
      <div>
        {studentLoading ? (
          <LoadingState label="Loading your results..." />
        ) : !studentResult || !studentResult.subjects || studentResult.subjects.length === 0 ? (
          <EmptyState message="No results have been entered for you yet." />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">{studentResult.studentName}</h2>
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
                    <th className="whitespace-nowrap px-4 py-2 font-semibold text-brand-red dark:text-red-400">Religious Book</th>
                    <th className="whitespace-nowrap px-4 py-2 font-semibold text-brand-red dark:text-red-400">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResult.subjects.map((s) => (
                    <tr key={s.subjectId} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                      <td className="whitespace-nowrap px-4 py-2 text-right text-gray-700 dark:text-gray-100" dir="rtl">
                        {s.subjectName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700 dark:text-gray-100">{s.marks ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-sm dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-300">
                Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{studentResult.total ?? '—'}</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                Average: <span className="font-semibold text-gray-900 dark:text-gray-100">{studentResult.average ?? '—'}</span>
              </span>
              {studentResult.grade && (
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  Grade: <Badge color={gradeToColor(studentResult.grade)}>{studentResult.grade}</Badge>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isTeacherOrCoordinator) {
    return (
      <div>
        <h1 className="mb-1 text-2xl font-bold text-brand-red dark:text-red-400">View Results</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Search for a student in your masjid by their Student ID.
        </p>
        <StudentIdSearch />
      </div>
    );
  }

  // Admin
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-red dark:text-red-400">View Results</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Browse results by masjid and stage, view every student system-wide, or search by Student ID.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === m.key
                ? 'bg-brand-red text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'browse' && (
        <div>
          {!buildingId ? (
            <div className="max-w-sm">
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">Select a masjid</p>
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
          ) : (
            <div>
              <div className="mb-4 max-w-sm">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">Select an educational stage</p>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : '')}
                  disabled={classesLoading}
                  dir="rtl"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-right text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">{classesLoading ? 'Loading educational stages...' : 'Select educational stage...'}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              {classId && (
                <div className="mt-6">
                  {tableLoading ? <LoadingState label="Loading results..." /> : <MultiStudentMarksheet rows={rows} subjectColumns={subjectColumns} />}
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <Button variant="ghost" size="sm" onClick={resetToMasjid}>
              Start over
            </Button>
          </div>
        </div>
      )}

      {mode === 'all' && (
        <div>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-lg">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Masjid (optional)</label>
              <select
                value={allBuildingId}
                onChange={(e) => setAllBuildingId(e.target.value ? Number(e.target.value) : '')}
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
                value={allClassId}
                onChange={(e) => setAllClassId(e.target.value ? Number(e.target.value) : '')}
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

          {allLoading ? (
            <LoadingState label="Loading results..." />
          ) : (
            <MultiStudentMarksheet rows={allRows} subjectColumns={allSubjectColumns} emptyMessage="No results found." />
          )}
        </div>
      )}

      {mode === 'search' && <StudentIdSearch />}
    </div>
  );
}
