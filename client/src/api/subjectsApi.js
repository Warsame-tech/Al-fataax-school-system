import axiosClient from './axiosClient';

const subjectsApi = {
  list: (params = {}) => axiosClient.get('/subjects', { params }),
  get: (id) => axiosClient.get(`/subjects/${id}`),
  create: (payload) => axiosClient.post('/subjects', payload),
  update: (id, payload) => axiosClient.put(`/subjects/${id}`, payload),
  remove: (id) => axiosClient.delete(`/subjects/${id}`),
};

export default subjectsApi;
