import { Fragment, useMemo, useState } from 'react';
import logoBanner from '../../assets/logo-banner.png';
import EmptyState from '../common/EmptyState';
import Badge from '../common/Badge';
import { gradeToColor, marksTextClass } from '../../utils/gradeUtils';

// Shared "official document" banner + title-bar treatment used by every
// marksheet-style result display (View Results and Reports alike): the
// full-width banner image, a bold brand-red title bar flush against it, and
// the table flush against that.
export function MarksheetDocument({ title = 'Results Marksheet', children }) {
  return (
    <div className="w-full">
      <img src={logoBanner} alt="Al Fataax" className="block w-full" />
      <div className="bg-brand-red py-2.5 text-center text-lg font-bold tracking-wide text-white dark:bg-brand-red-dark">
        {title}
      </div>
      <div className="report-table-wrap scroll-thin w-full overflow-x-auto rounded-b-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {children}
      </div>
    </div>
  );
}

// Multi-student marksheet table: one row per student, one column per book
// in the union `subjectColumns` set. Used by View Results' "Browse by Masjid
// & Stage" and "All Students" modes, and by the Stage/All-Students Reports.
export function MultiStudentMarksheet({ rows, subjectColumns = [], title = 'Results Marksheet', emptyMessage = 'No results found.' }) {
  return (
    <MarksheetDocument title={title}>
      {!rows || rows.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Student ID</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Student Name</th>
              {rows?.some((r) => r.gender) && (
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Gender</th>
              )}
              {rows?.some((r) => r.buildingName) && (
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Masjid</th>
              )}
              {rows?.some((r) => r.stageName) && (
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Stage</th>
              )}
              {subjectColumns.map((sub) => (
                <th key={sub.id} className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">
                  {sub.name}
                </th>
              ))}
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Total</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Average</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Grade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const marksBySubject = Object.fromEntries(
                (row.subjects || []).map((s) => [s.subjectId, s.marks]),
              );
              return (
                <tr key={row.studentId} className="border-b border-gray-100 last:border-0 hover:bg-brand-gold-light/10 dark:border-gray-700 dark:hover:bg-brand-gold/10">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{row.studentId}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{row.studentName}</td>
                  {rows?.some((r) => r.gender) && (
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.gender ? <Badge color={row.gender === 'Male' ? 'blue' : 'gold'}>{row.gender}</Badge> : '—'}
                    </td>
                  )}
                  {rows?.some((r) => r.buildingName) && (
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{row.buildingName || '—'}</td>
                  )}
                  {rows?.some((r) => r.stageName) && (
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700 dark:text-gray-100" dir="rtl">
                      {row.stageName || '—'}
                    </td>
                  )}
                  {subjectColumns.map((sub) => (
                    <td
                      key={sub.id}
                      className={`whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100 ${marksTextClass(marksBySubject[sub.id])}`}
                    >
                      {marksBySubject[sub.id] ?? '—'}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{row.total ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{row.average ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {row.grade ? <Badge color={gradeToColor(row.grade)}>{row.grade}</Badge> : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </MarksheetDocument>
  );
}

// One stage's subjects + Total/Average/Grade summary — the expanded-row
// content for GroupedStudentResultsMarksheet below. Deliberately never
// mixes marks from a different stage into this block's own total/average.
function StageResultBlock({ stage }) {
  const subjects = stage.subjects || [];
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
      {stage.stageName && (
        <h4 className="mb-3 text-right text-sm font-bold text-brand-red dark:text-red-400" dir="rtl">
          {stage.stageName}
        </h4>
      )}
      {subjects.length === 0 ? (
        <EmptyState message="No results have been entered for this stage yet." />
      ) : (
        <>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="whitespace-nowrap px-3 py-2 font-semibold text-brand-red dark:text-red-400">Religious Book</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold text-brand-red dark:text-red-400">Marks</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.subjectId} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                    <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700 dark:text-gray-100" dir="rtl">
                      {s.subjectName}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2 text-gray-700 dark:text-gray-100 ${marksTextClass(s.marks)}`}>
                      {s.marks ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-300">
              Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{stage.total ?? '—'}</span>
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              Average: <span className="font-semibold text-gray-900 dark:text-gray-100">{stage.average ?? '—'}</span>
            </span>
            {stage.grade && (
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                Result: <Badge color={gradeToColor(stage.grade)}>{stage.grade}</Badge>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Grouped student results table: exactly ONE row per student, regardless of
// how many stages they have results for — never the old design of one row
// per (student, stage) pair. Each row carries only the student's basic
// info plus a "+ View Results" toggle; expanding it reveals every stage's
// results as its own separate StageResultBlock underneath; stages are never
// combined into a single total. Used by View Results' "All Students" mode
// and the "All Students Results Report".
export function GroupedStudentResultsMarksheet({ rows, title = 'Results Marksheet', emptyMessage = 'No results found.' }) {
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const students = useMemo(() => {
    const map = new Map();
    (rows || []).forEach((row) => {
      if (!map.has(row.studentId)) {
        map.set(row.studentId, {
          studentId: row.studentId,
          studentName: row.studentName,
          gender: row.gender,
          buildingName: row.buildingName,
          stages: [],
        });
      }
      map.get(row.studentId).stages.push(row);
    });
    return Array.from(map.values());
  }, [rows]);

  const toggle = (studentId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const hasGender = students.some((s) => s.gender);
  const hasBuilding = students.some((s) => s.buildingName);
  const columnCount = 2 + (hasGender ? 1 : 0) + (hasBuilding ? 1 : 0) + 1;

  return (
    <MarksheetDocument title={title}>
      {students.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Student ID</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Student Name</th>
              {hasGender && (
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Gender</th>
              )}
              {hasBuilding && (
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Masjid</th>
              )}
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Results</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const isOpen = expandedIds.has(student.studentId);
              return (
                <Fragment key={student.studentId}>
                  <tr className="border-b border-gray-100 last:border-0 hover:bg-brand-gold-light/10 dark:border-gray-700 dark:hover:bg-brand-gold/10">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{student.studentId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{student.studentName}</td>
                    {hasGender && (
                      <td className="whitespace-nowrap px-4 py-3">
                        {student.gender ? <Badge color={student.gender === 'Male' ? 'blue' : 'gold'}>{student.gender}</Badge> : '—'}
                      </td>
                    )}
                    {hasBuilding && (
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">{student.buildingName || '—'}</td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggle(student.studentId)}
                        className="no-print inline-flex items-center gap-1 rounded-lg border border-brand-red/30 px-3 py-1.5 text-sm font-medium text-brand-red transition-colors hover:bg-brand-red/10 dark:border-red-400/40 dark:text-red-400 dark:hover:bg-red-400/10"
                      >
                        {isOpen ? '− Hide Results' : '+ View Results'}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                      <td colSpan={columnCount} className="bg-gray-50/60 px-4 py-4 dark:bg-gray-900/20">
                        <div className="flex flex-col gap-4">
                          {student.stages.map((stage, i) => (
                            <StageResultBlock key={stage.stageName || i} stage={stage} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </MarksheetDocument>
  );
}

// Single-student marksheet: one row per religious book, plus a
// Total/Average/Grade summary strip. Used by the student's own results
// view, the admin/coordinator "Search by Student ID" result, and
// the Individual Student "Student Results" report variant.
export function SingleStudentMarksheet({ result, title = 'Results Marksheet', emptyMessage = 'No results have been entered for this student yet.' }) {
  const subjects = result?.subjects || [];
  return (
    <MarksheetDocument title={title}>
      <div className="p-5">
        {result && (
          <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{result.studentName}</span>
            <span>
              Student ID: <span className="font-semibold text-gray-900 dark:text-gray-100">{result.studentId}</span>
            </span>
            {result.buildingName && (
              <span>
                Masjid: <span className="font-semibold text-gray-900 dark:text-gray-100">{result.buildingName}</span>
              </span>
            )}
            {result.stageName && (
              <span dir="rtl">
                Stage: <span className="font-semibold text-gray-900 dark:text-gray-100">{result.stageName}</span>
              </span>
            )}
          </div>
        )}

        {subjects.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <>
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
                    <th className="whitespace-nowrap px-4 py-2 font-semibold text-brand-red dark:text-red-400">Religious Book</th>
                    <th className="whitespace-nowrap px-4 py-2 font-semibold text-brand-red dark:text-red-400">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s.subjectId} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                      <td className="whitespace-nowrap px-4 py-2 text-right text-gray-700 dark:text-gray-100" dir="rtl">
                        {s.subjectName}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-2 text-gray-700 dark:text-gray-100 ${marksTextClass(s.marks)}`}>
                        {s.marks ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-sm dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-300">
                Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{result.total ?? '—'}</span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                Average: <span className="font-semibold text-gray-900 dark:text-gray-100">{result.average ?? '—'}</span>
              </span>
              {result.grade && (
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  Grade: <Badge color={gradeToColor(result.grade)}>{result.grade}</Badge>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </MarksheetDocument>
  );
}
