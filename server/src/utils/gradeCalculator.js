function computeTotal(marksArray) {
  return marksArray.reduce((sum, m) => sum + Number(m), 0);
}

function computeAverage(total, subjectCount) {
  if (subjectCount === 0) return 0;
  return Math.round((total / subjectCount) * 100) / 100;
}

// 11-tier letter grade: ten passing bands from 50-100 (A+ down to D+,
// 5-point each except D+'s 6-point band absorbing the remainder down to
// 50), then a single "D" for everything below 50 — D *is* the fail grade
// here, there is no separate F. This pass/fail line (50) matches
// FAILING_MARKS_THRESHOLD in client/src/utils/gradeUtils.js (a separate,
// unrelated rule for coloring an individual subject's marks red) purely
// by coincidence of the current thresholds — that constant governs
// per-subject marks, this one the overall stage grade.
function computeGrade(average) {
  if (average >= 96) return 'A+';
  if (average >= 91) return 'A';
  if (average >= 86) return 'A-';
  if (average >= 81) return 'B+';
  if (average >= 76) return 'B';
  if (average >= 71) return 'B-';
  if (average >= 66) return 'C+';
  if (average >= 61) return 'C';
  if (average >= 56) return 'C-';
  if (average >= 50) return 'D+';
  return 'D';
}

/**
 * results: array of { subjectId, subjectName, marks }
 * Returns { subjects: [...], total, average, grade }
 */
function buildResultRow(results) {
  const marks = results.map((r) => Number(r.marks));
  const total = computeTotal(marks);
  const average = computeAverage(total, results.length);
  const grade = computeGrade(average);
  return { subjects: results, total, average, grade };
}

// Standard competition ranking (1, 2, 2, 4, ...): equal scores share the
// same rank, and the next distinct (lower) score's rank skips ahead by how
// many are tied above it. This is the one place rank numbers are assigned,
// so every view that shows a rank (results tables, a student's own summary,
// reports) is guaranteed to agree with every other.
function assignRanks(items, scoreKey = 'average') {
  const sorted = [...items].sort((a, b) => {
    if (b[scoreKey] !== a[scoreKey]) return b[scoreKey] - a[scoreKey];
    // Deterministic ordering among ties — the rank *number* they share is
    // unaffected, this only fixes the array's own order.
    return String(a.studentId).localeCompare(String(b.studentId));
  });

  let lastScore = null;
  let lastRank = 0;
  return sorted.map((item, index) => {
    const score = item[scoreKey];
    const rank = score === lastScore ? lastRank : index + 1;
    lastScore = score;
    lastRank = rank;
    return { ...item, rank };
  });
}

// Top-N selection that never splits a tie: if the score at the cutoff
// position is shared by students beyond position `limit`, all of them are
// included too, so a Top 3/Top 10 list can never silently drop a student
// who tied with whoever landed in last place. `ranked` must already be
// sorted ascending by rank (assignRanks + a rank sort, as
// computeStageLeaderboard produces).
function takeTopWithTies(ranked, limit) {
  if (ranked.length <= limit) return ranked;
  const cutoffRank = ranked[limit - 1].rank;
  return ranked.filter((r) => r.rank <= cutoffRank);
}

module.exports = { computeTotal, computeAverage, computeGrade, buildResultRow, assignRanks, takeTopWithTies };
