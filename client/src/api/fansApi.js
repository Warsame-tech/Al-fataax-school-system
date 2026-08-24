import axiosClient from './axiosClient';

const fansApi = {
  list: (params = {}) => axiosClient.get('/fans', { params }),
  get: (id) => axiosClient.get(`/fans/${id}`),
  create: (payload) => axiosClient.post('/fans', payload),
  update: (id, payload) => axiosClient.put(`/fans/${id}`, payload),
  remove: (id) => axiosClient.delete(`/fans/${id}`),
};

export default fansApi;
