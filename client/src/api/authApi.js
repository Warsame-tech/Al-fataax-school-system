import axiosClient from './axiosClient';

const authApi = {
  login: (username, password) => axiosClient.post('/auth/login', { username, password }),
  logout: () => axiosClient.post('/auth/logout'),
  me: () => axiosClient.get('/auth/me'),
  heartbeat: () => axiosClient.post('/auth/heartbeat'),
};

export default authApi;
