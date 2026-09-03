import axiosClient from './axiosClient';

const reportsApi = {
  students: () => axiosClient.get('/reports/students'),
  // Unscoped (system-wide) flat student list, used by GUDOOMIYE KUXIGEEN's
  // "All Students Report" — unlike studentsApi.list, never restricted to
  // the caller's own masjid.
  allStudents: (params = {}) => axiosClient.get('/reports/all-students', { params }),
  byBuilding: () => axiosClient.get('/reports/by-building'),
  myBuilding: () => axiosClient.get('/reports/my-building'),
};

export default reportsApi;
