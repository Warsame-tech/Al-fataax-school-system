import axiosClient from './axiosClient';

const studentsApi = {
  list: (params = {}) => axiosClient.get('/students', { params }),
  get: (id) => axiosClient.get(`/students/${id}`),
  create: (payload) => axiosClient.post('/students', payload),
  update: (id, payload) => axiosClient.put(`/students/${id}`, payload),
  remove: (id) => axiosClient.delete(`/students/${id}`),
};

export default studentsApi;
