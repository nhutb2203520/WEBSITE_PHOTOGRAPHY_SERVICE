import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Interceptor tự động thêm token từ sessionStorage
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const userApi = {
  getUserById: async () => {
    const response = await axios.get(`${API_URL}/my-profile`);
    return response.data; // { customer, message }
  },

  uploadAvatar: async (data) => {
    const response = await axios.post(`${API_URL}/upload/avatar`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { message, fileUrl }
  },


  uploadCover: async (data) => {
    const response = await axios.post(`${API_URL}/upload/cover`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { message, fileUrl }
  },

  
  updateProfile: async (data) => {
    const response = await axios.patch(`${API_URL}/khachhang/update`, data);
    return response.data; // { message, updatedUser }
  },

  
  changePassword: async (data) => {
    const response = await axios.patch(`${API_URL}/khachhang/change-password`, data);
    return response.data; // { message }
  },

  /**
   * ✅ Nâng cấp tài khoản thành nhà cung cấp
   * POST /api/khachhang/upgrade
   */
  upgradeToProvider: async (data) => {
    const response = await axios.post(`${API_URL}/khachhang/upgrade`, data);
    return response.data; // { message }
  },
};

export default userApi;
