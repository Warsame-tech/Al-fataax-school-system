import axiosClient from './axiosClient';

const usersApi = {
  list: (params = {}) => axiosClient.get('/users', { params }),
  get: (id) => axiosClient.get(`/users/${id}`),
  create: (payload) => axiosClient.post('/users', payload),
  update: (id, payload) => axiosClient.put(`/users/${id}`, payload),
  remove: (id) => axiosClient.delete(`/users/${id}`),
};

export default usersApi;
