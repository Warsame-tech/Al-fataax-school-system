import axiosClient from './axiosClient';

const gudoomiyeReportsApi = {
  masjidStudents: (params = {}) => axiosClient.get('/gudoomiye/reports/masjid-students', { params }),
  newStudents: (params = {}) => axiosClient.get('/gudoomiye/reports/new-students', { params }),
};

export default gudoomiyeReportsApi;
