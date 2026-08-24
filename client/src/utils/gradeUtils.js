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
