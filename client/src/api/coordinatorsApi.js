import axiosClient from './axiosClient';

const coordinatorsApi = {
  list: (params = {}) => axiosClient.get('/coordinators', { params }),
  get: (id) => axiosClient.get(`/coordinators/${id}`),
  create: (payload) => axiosClient.post('/coordinators', payload),
  update: (id, payload) => axiosClient.put(`/coordinators/${id}`, payload),
  remove: (id) => axiosClient.delete(`/coordinators/${id}`),
};

export default coordinatorsApi;
