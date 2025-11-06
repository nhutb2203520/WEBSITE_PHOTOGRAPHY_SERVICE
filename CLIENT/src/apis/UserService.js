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

  /** 🔹 Upload avatar */
  uploadAvatar: async (formData) => {
    console.log("📤 Upload avatar API gọi...");
    const res = await axios.post(`${API_URL}/upload-avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log("📤 Upload avatar response:", res.data);
    return res.data;
  },

  /** 🔹 Upload ảnh bìa */
  uploadCover: async (formData) => {
    console.log("📤 Upload cover API gọi...");
    const res = await axios.post(`${API_URL}/upload-cover`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log("📤 Upload cover response:", res.data);
    return res.data;
  },
};

export default userApi;
