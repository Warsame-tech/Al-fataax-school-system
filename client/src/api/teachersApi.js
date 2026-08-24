import axiosClient from './axiosClient';

const teachersApi = {
  list: (params = {}) => axiosClient.get('/teachers', { params }),
  get: (id) => axiosClient.get(`/teachers/${id}`),
  create: (payload) => axiosClient.post('/teachers', payload),
  update: (id, payload) => axiosClient.put(`/teachers/${id}`, payload),
  remove: (id) => axiosClient.delete(`/teachers/${id}`),
};

export default teachersApi;
