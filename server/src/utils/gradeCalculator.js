function computeTotal(marksArray) {
  return marksArray.reduce((sum, m) => sum + Number(m), 0);
}

function computeAverage(total, subjectCount) {
  if (subjectCount === 0) return 0;
  return Math.round((total / subjectCount) * 100) / 100;
}

// 13-tier letter grade. The pass/fail line stays at 50 (unchanged —
// matches FAILING_MARKS_THRESHOLD in client/src/utils/gradeUtils.js and
// the old lowest-passing-grade cutoff), with the 50-100 passing range
// split into 4-point bands per letter family (A/B/C/D), each divided into
// +/plain/-; the top band (A+) absorbs the remainder up to 100.
function computeGrade(average) {
  if (average >= 94) return 'A+';
  if (average >= 90) return 'A';
  if (average >= 86) return 'A-';
  if (average >= 82) return 'B+';
  if (average >= 78) return 'B';
  if (average >= 74) return 'B-';
  if (average >= 70) return 'C+';
  if (average >= 66) return 'C';
  if (average >= 62) return 'C-';
  if (average >= 58) return 'D+';
  if (average >= 54) return 'D';
  if (average >= 50) return 'D-';
  return 'F';
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
