import axiosClient from './axiosClient';

const reportsApi = {
  students: () => axiosClient.get('/reports/students'),
  teachers: () => axiosClient.get('/reports/teachers'),
  byBuilding: () => axiosClient.get('/reports/by-building'),
  myBuilding: () => axiosClient.get('/reports/my-building'),
};

export default reportsApi;
