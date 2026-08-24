import { forwardRef } from 'react';
import logoBanner from '../../assets/logo-banner.png';
import EmptyState from '../common/EmptyState';
import Badge from '../common/Badge';
import { gradeToColor } from '../../utils/gradeUtils';

// Shared "official document" banner + title-bar treatment used by every
// marksheet-style result display (View Results and Reports alike): the
// full-width banner image, a bold brand-red title bar flush against it, and
// the table flush against that. `innerRef` lets callers (Reports pages)
// capture this whole block for print/PDF export.
export function MarksheetDocument({ title = 'Results Marksheet', children, innerRef }) {
  return (
    <div ref={innerRef} className="w-full">
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
export const MultiStudentMarksheet = forwardRef(function MultiStudentMarksheet(
  { rows, subjectColumns = [], title = 'Results Marksheet', emptyMessage = 'No results found.' },
  ref,
) {
  return (
    <MarksheetDocument title={title} innerRef={ref}>
      {!rows || rows.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Student ID</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400">Student Name</th>
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
                  {subjectColumns.map((sub) => (
                    <td key={sub.id} className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">
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
});

// Single-student marksheet: one row per religious book, plus a
// Total/Average/Grade summary strip. Used by the student's own results
// view, the admin/teacher/coordinator "Search by Student ID" result, and
// the Individual Student "Student Results" report variant.
export const SingleStudentMarksheet = forwardRef(function SingleStudentMarksheet(
  { result, title = 'Results Marksheet', emptyMessage = 'No results have been entered for this student yet.' },
  ref,
) {
  const subjects = result?.subjects || [];
  return (
    <MarksheetDocument title={title} innerRef={ref}>
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
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700 dark:text-gray-100">{s.marks ?? '—'}</td>
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
});
