import axiosClient from './axiosClient';

const authApi = {
  login: (username, password) => axiosClient.post('/auth/login', { username, password }),
  logout: () => axiosClient.post('/auth/logout'),
  me: () => axiosClient.get('/auth/me'),
  heartbeat: () => axiosClient.post('/auth/heartbeat'),
  // Forgot Password flow — all unauthenticated.
  getAdminEmail: () => axiosClient.get('/auth/admin-email'),
  forgotPassword: (email) => axiosClient.post('/auth/forgot-password', { email }),
  verifyResetOtp: (email, otp) => axiosClient.post('/auth/verify-reset-otp', { email, otp }),
  resetPassword: (resetToken, newPassword) => axiosClient.post('/auth/reset-password', { resetToken, newPassword }),
};

export default authApi;
