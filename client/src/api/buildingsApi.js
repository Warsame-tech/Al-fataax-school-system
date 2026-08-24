import axiosClient from './axiosClient';

const buildingsApi = {
  list: (params = {}) => axiosClient.get('/buildings', { params }),
  get: (id) => axiosClient.get(`/buildings/${id}`),
  create: (payload) => axiosClient.post('/buildings', payload),
  update: (id, payload) => axiosClient.put(`/buildings/${id}`, payload),
  remove: (id) => axiosClient.delete(`/buildings/${id}`),
};

export default buildingsApi;
