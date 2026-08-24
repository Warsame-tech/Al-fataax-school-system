import axiosClient from './axiosClient';

const dashboardApi = {
  summary: () => axiosClient.get('/dashboard/summary'),
};

export default dashboardApi;
