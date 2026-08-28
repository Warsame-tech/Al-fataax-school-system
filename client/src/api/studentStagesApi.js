import axiosClient from './axiosClient';

const studentStagesApi = {
  list: (studentId) => axiosClient.get(`/students/${studentId}/stages`),
  add: (studentId, classId) => axiosClient.post(`/students/${studentId}/stages`, { classId }),
  remove: (studentId, regId) => axiosClient.delete(`/students/${studentId}/stages/${regId}`),
};

export default studentStagesApi;
