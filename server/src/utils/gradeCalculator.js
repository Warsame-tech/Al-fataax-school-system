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

module.exports = { computeTotal, computeAverage, computeGrade, buildResultRow };
