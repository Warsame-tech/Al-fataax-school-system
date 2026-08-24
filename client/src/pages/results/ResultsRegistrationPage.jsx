import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import buildingsApi from '../../api/buildingsApi';
import classesApi from '../../api/classesApi';
import studentsApi from '../../api/studentsApi';
import resultsApi from '../../api/resultsApi';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { gradeToColor } from '../../utils/gradeUtils';

// Merges the stage's full book list with the student's already-entered
// results so every book gets a row (pre-filled if a result already exists),
// even books with no result yet.
function buildSheetRows(books, existingSubjects) {
  const bySubjectId = new Map((existingSubjects || []).map((s) => [s.subjectId, s]));
  return (books || []).map((book) => {
    const existing = bySubjectId.get(book.id);
    return {
      subjectId: book.id,
      subjectName: book.name_ar,
      marks: existing ? String(existing.marks ?? '') : '',
      resultId: existing?.id || null,
    };
  });
}

export default function ResultsRegistrationPage() {
  const [buildings, setBuildings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [buildingId, setBuildingId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [rowErrors, setRowErrors] = useState({});
  const [summary, setSummary] = useState(null); // { total, average, grade }
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    buildingsApi.list().then((data) => setBuildings(data || [])).catch(() => setBuildings([]));
    // Stages are global (not masjid-scoped) — one unfiltered list for the dropdown.
    classesApi.list().then((data) => setClasses(data || [])).catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    setStudentId('');
    setSelectedStudent(null);
    setRows([]);
    setSummary(null);
    if (!buildingId || !classId) {
      setStudents([]);
      return;
    }
    studentsApi
      .list({ buildingId, classId })
      .then((data) => setStudents(data || []))
      .catch(() => setStudents([]));
  }, [buildingId, classId]);

  const loadSheet = useCallback(async (student) => {
    if (!student) {
      setRows([]);
      setSummary(null);
      return;
    }
    setSheetLoading(true);
    try {
      const [classData, resultData] = await Promise.all([
        classesApi.get(student.classId),
        resultsApi.byStudent(student.id).catch(() => null),
      ]);
      const books = classData?.Subjects || [];
      setRows(buildSheetRows(books, resultData?.subjects));
      setSummary(
        resultData
          ? { total: resultData.total, average: resultData.average, grade: resultData.grade }
          : null,
      );
    } catch (err) {
      toast.error(err.message || 'Failed to load the result sheet.');
      setRows([]);
      setSummary(null);
    } finally {
      setSheetLoading(false);
    }
  }, []);

  const handleSelectStudent = (id) => {
    setStudentId(id);
    setRowErrors({});
    const student = students.find((s) => s.id === id) || null;
    setSelectedStudent(student);
    loadSheet(student);
  };

  const handleMarksChange = (subjectId, value) => {
    setRows((prev) => prev.map((r) => (r.subjectId === subjectId ? { ...r, marks: value } : r)));
    setRowErrors((prev) => {
      if (!prev[subjectId]) return prev;
      const next = { ...prev };
      delete next[subjectId];
      return next;
    });
  };

  const validateRows = () => {
    const errs = {};
    rows.forEach((r) => {
      if (r.marks === '' || r.marks == null) return; // blank rows are allowed, server filters them out
      const numMarks = Number(r.marks);
      if (Number.isNaN(numMarks) || numMarks < 0 || numMarks > 100) {
        errs[r.subjectId] = 'Must be 0-100.';
      }
    });
    setRowErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!studentId) return;
    if (!validateRows()) {
      toast.error('Fix the highlighted marks before saving.');
      return;
    }
    const filled = rows.filter((r) => r.marks !== '' && r.marks != null);
    if (filled.length === 0) {
      toast.error('Enter at least one mark before saving.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        studentId,
        marks: rows.map((r) => ({ subjectId: r.subjectId, marks: r.marks })),
      };
      const data = await resultsApi.bulkCreate(payload);
      toast.success('Results saved successfully.');
      setSummary({ total: data.total, average: data.average, grade: data.grade });
      // Re-sync rows with the server's saved values (fills in new result ids).
      const bySubjectId = new Map((data.subjects || []).map((s) => [s.subjectId, s]));
      setRows((prev) =>
        prev.map((r) => {
          const saved = bySubjectId.get(r.subjectId);
          return saved ? { ...r, marks: String(saved.marks ?? ''), resultId: saved.id || null } : r;
        }),
      );
    } catch (err) {
      toast.error(err.message || 'Failed to save results.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.resultId) {
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      await resultsApi.remove(deleteTarget.resultId);
      toast.success('Result cleared successfully.');
      setRows((prev) =>
        prev.map((r) => (r.subjectId === deleteTarget.subjectId ? { ...r, marks: '', resultId: null } : r)),
      );
      setDeleteTarget(null);
      // Refresh the summary since one book's mark was removed.
      if (selectedStudent) {
        const resultData = await resultsApi.byStudent(selectedStudent.id).catch(() => null);
        setSummary(
          resultData
            ? { total: resultData.total, average: resultData.average, grade: resultData.grade }
            : null,
        );
      }
    } catch (err) {
      toast.error(err.message || 'Failed to clear result.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-red dark:text-red-400">Results Registration</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Select a masjid, educational stage and student, then enter marks for every religious book at once.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-3 dark:border-gray-700 dark:bg-gray-800">
        <SelectField
          label="Masjid"
          name="buildingId"
          value={buildingId}
          onChange={(e) => setBuildingId(e.target.value ? Number(e.target.value) : '')}
          options={buildings}
          valueKey="id"
          labelKey="name"
          required
        />
        <SelectField
          label="Educational Stage"
          name="classId"
          value={classId}
          onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : '')}
          options={classes}
          valueKey="id"
          labelKey="name_ar"
          optionsDir="rtl"
          required
        />
        <SelectField
          label="Student"
          name="studentId"
          value={studentId}
          onChange={(e) => handleSelectStudent(e.target.value ? Number(e.target.value) : '')}
          options={students}
          valueKey="id"
          labelKey="name"
          required
          disabled={!buildingId || !classId}
          placeholder={!buildingId || !classId ? 'Select masjid & stage first' : 'Select...'}
        />
      </div>

      {studentId && selectedStudent && (
        <>
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedStudent.name}</p>
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
              <span>
                Student ID: <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedStudent.id}</span>
              </span>
              <span>
                Masjid:{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedStudent.Building?.name || '—'}
                </span>
              </span>
              <span dir="rtl">
                Stage:{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedStudent.Class?.name_ar || '—'}
                </span>
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-brand-red dark:text-red-400">Result Sheet</h2>

            {sheetLoading ? (
              <LoadingState label="Loading result sheet..." />
            ) : rows.length === 0 ? (
              <EmptyState message="No religious books are assigned to this educational stage." />
            ) : (
              <>
                <div className="scroll-thin overflow-x-auto">
                  <table className="w-full min-w-max text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
                        <th className="whitespace-nowrap px-4 py-2 font-semibold text-brand-red dark:text-red-400">Religious Book</th>
                        <th className="whitespace-nowrap px-4 py-2 font-semibold text-brand-red dark:text-red-400">Marks</th>
                        <th className="whitespace-nowrap px-4 py-2 font-semibold text-brand-red dark:text-red-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.subjectId} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                          <td className="whitespace-nowrap px-4 py-2 text-right text-gray-700 dark:text-gray-100" dir="rtl">
                            {row.subjectName}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={row.marks}
                              onChange={(e) => handleMarksChange(row.subjectId, e.target.value)}
                              placeholder="0-100"
                              className={`w-24 rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold dark:bg-gray-800 dark:text-gray-100
                                ${rowErrors[row.subjectId] ? 'border-status-error' : 'border-gray-300 dark:border-gray-600'}`}
                            />
                            {rowErrors[row.subjectId] && (
                              <p className="mt-1 text-xs text-status-error">{rowErrors[row.subjectId]}</p>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2">
                            {row.resultId && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                aria-label={`Clear ${row.subjectName}`}
                                className="rounded p-1.5 text-status-error hover:bg-status-error/10"
                                title="Clear this mark"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{summary?.total ?? '—'}</span>
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Average: <span className="font-semibold text-gray-900 dark:text-gray-100">{summary?.average ?? '—'}</span>
                    </span>
                    {summary?.grade && (
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        Grade: <Badge color={gradeToColor(summary.grade)}>{summary.grade}</Badge>
                      </span>
                    )}
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Results'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Clear Result"
        message={`Are you sure you want to clear the result for "${deleteTarget?.subjectName}"? This action cannot be undone.`}
      />
    </div>
  );
}
