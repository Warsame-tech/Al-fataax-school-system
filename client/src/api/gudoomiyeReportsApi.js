import axiosClient from './axiosClient';

const gudoomiyeReportsApi = {
  masjidStudents: (params = {}) => axiosClient.get('/gudoomiye/reports/masjid-students', { params }),
  newStudents: (params = {}) => axiosClient.get('/gudoomiye/reports/new-students', { params }),
  summary: () => axiosClient.get('/gudoomiye/reports/summary'),
  // The only write GUDOOMIYE can perform: flips a student's status to
  // 'accepted'. See dataSync.js's RESOURCE_PATTERNS — this URL is mapped to
  // the 'students' resource so every open report auto-refreshes on accept.
  acceptStudent: (id) => axiosClient.patch(`/gudoomiye/reports/students/${id}/accept`),
};

export default gudoomiyeReportsApi;
