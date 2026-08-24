import axiosClient, { axiosClientEnvelope } from './axiosClient';

const resultsApi = {
  create: (payload) => axiosClient.post('/results', payload),
  // Saves an entire student's result sheet in one submission.
  // payload: { studentId, marks: [{ subjectId, marks }, ...] }
  // Resolves to the full marksheet: { studentId, studentName, buildingName, stageName, subjects, total, average, grade }.
  bulkCreate: (payload) => axiosClient.post('/results/bulk', payload),
  update: (id, payload) => axiosClient.put(`/results/${id}`, payload),
  remove: (id) => axiosClient.delete(`/results/${id}`),
  // Returns { success, data: [...], subjectColumns: [...] } in full —
  // callers need both `data` (rows) and `subjectColumns` (dynamic headers).
  byClass: (params = {}) => axiosClientEnvelope.get('/results/by-class', { params }),
  // Admin-only, system-wide marksheet, optionally narrowed by buildingId/classId.
  // Same envelope shape as byClass: { success, data: [...], subjectColumns: [...] }.
  all: (params = {}) => axiosClientEnvelope.get('/results/all', { params }),
  byStudent: (studentId) => axiosClient.get(`/results/student/${studentId}`),
  // Admin/teacher/coordinator Student-ID lookup. Teacher/coordinator are
  // restricted server-side to their own masjid (403 on cross-masjid attempts).
  search: (studentId) => axiosClient.get('/results/search', { params: { studentId } }),
};

export default resultsApi;
