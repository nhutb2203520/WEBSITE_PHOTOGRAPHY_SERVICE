import axiosClient from './axiosUser';

const authApi = {
  register(data) {
    return axiosClient.post('/auth/register', data);
  },
  login(data) {
    return axiosClient.post('/auth/login', data);
  },
  forgotPassword(data) {
    return axiosClient.post('/auth/forgot-password', data);
  },
  resetPassword(data) {
    return axiosClient.post(`/auth/reset-password/${data.token}`, data);
  }
};
export default authApi;