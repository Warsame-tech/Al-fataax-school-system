// DISPLAY-ONLY helper mirroring the grade band colors for Badge styling.
// Total/Average/Grade are always computed server-side — this is never used
// as a source of truth for calculation, only to pick a badge color client-side.
export function gradeToColor(grade) {
  if (!grade) return 'neutral';
  const g = String(grade).toUpperCase();
  if (g === 'A+' || g === 'A') return 'green';
  if (g === 'B' || g === 'C') return 'gold';
  return 'red'; // D, F, or anything else
}

// A single subject's marks below this are flagged red everywhere marks are
// displayed (marksheets, reports, results registration). Display-only —
// never used for grade/pass-fail calculation, which stays server-side.
export const FAILING_MARKS_THRESHOLD = 50;

export function isFailingMarks(marks) {
  if (marks === null || marks === undefined || marks === '') return false;
  const n = Number(marks);
  return !Number.isNaN(n) && n < FAILING_MARKS_THRESHOLD;
}

// Tailwind classes to make a failing mark stand out in red; empty string
// (no override) otherwise, so the caller's normal text color still applies.
export function marksTextClass(marks) {
  return isFailingMarks(marks) ? 'font-semibold text-status-error dark:text-red-400' : '';
}
