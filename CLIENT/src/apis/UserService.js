import axios from "axios";

const API_URL = "http://localhost:5000/api/khachhang";

axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const userApi = {
  getInfo: async () => {
    const res = await axios.get(`${API_URL}/me`);
    console.log("📥 getInfoUser response:", res.data);
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await axios.patch(`${API_URL}/update`, data);
    console.log("📤 updateProfile response:", res.data);
    return res.data;
  },

  changePassword: async (data) => {
    const res = await axios.patch(`${API_URL}/change-password`, data);
    return res.data;
  },
};

export default userApi;
