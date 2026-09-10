function computeTotal(marksArray) {
  return marksArray.reduce((sum, m) => sum + Number(m), 0);
}

function computeAverage(total, subjectCount) {
  if (subjectCount === 0) return 0;
  return Math.round((total / subjectCount) * 100) / 100;
}

function computeGrade(average) {
  if (average >= 90) return 'A+';
  if (average >= 80) return 'A';
  if (average >= 70) return 'B';
  if (average >= 60) return 'C';
  if (average >= 50) return 'D';
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

module.exports = { computeTotal, computeAverage, computeGrade, buildResultRow, assignRanks };
