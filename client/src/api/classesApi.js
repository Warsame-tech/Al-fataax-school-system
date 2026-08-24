import axiosClient from './axiosClient';

const classesApi = {
  list: (params = {}) => axiosClient.get('/classes', { params }),
  get: (id) => axiosClient.get(`/classes/${id}`),
  create: (payload) => axiosClient.post('/classes', payload),
  update: (id, payload) => axiosClient.put(`/classes/${id}`, payload),
  remove: (id) => axiosClient.delete(`/classes/${id}`),
};

export default classesApi;
