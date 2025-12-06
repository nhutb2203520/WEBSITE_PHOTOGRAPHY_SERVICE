import axios from "axios";

const API_URL = "http://localhost:5000/api/service-packages";

axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const servicePackageApi = {
  
  createPackage: async (packageData) => {
    try {
      console.log("📤 Creating package:", packageData);
      const res = await axios.post(`${API_URL}/create`, packageData);
      console.log("✅ Package created:", res.data);
      return res.data;
    } catch (error) {
      console.error("❌ Error creating package:", error.response?.data || error.message);
      throw error;
    }
  },

  getAllPackages: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.loaiGoi) params.append('loaiGoi', filters.loaiGoi);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.photographerId) params.append('photographerId', filters.photographerId);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.search) params.append('search', filters.search);

      const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
      const res = await axios.get(url);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching packages:", error.response?.data || error.message);
      throw error;
    }
  },

  // ✅ Search Image (Đã đúng vì bạn đã xóa headers ở đây)
  searchByImage: async (formData) => {
    try {
      console.log("🔍 Searching by image...");
      // 👇 ĐÚNG: Không có headers thủ công
      const res = await axios.post(`${API_URL}/search-image`, formData);
      return res.data;
    } catch (error) {
      console.error("❌ Error searching image:", error.response?.data || error.message);
      throw error;
    }
  },

  getPackageById: async (id) => {
    try {
      const res = await axios.get(`${API_URL}/${id}`);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching package:", error.response?.data || error.message);
      throw error;
    }
  },

  getPackagesByPhotographer: async (username) => {
    try {
      const res = await axios.get(`${API_URL}/photographer/${username}`);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching photographer packages:", error.response?.data || error.message);
      throw error;
    }
  },

  getMyPackages: async () => {
    try {
      const res = await axios.get(`${API_URL}/my/packages`);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching my packages:", error.response?.data || error.message);
      throw error;
    }
  },

  updatePackage: async (id, updates) => {
    try {
      const res = await axios.patch(`${API_URL}/${id}`, updates);
      return res.data;
    } catch (error) {
      console.error("❌ Error updating package:", error.response?.data || error.message);
      throw error;
    }
  },

  deletePackage: async (id) => {
    try {
      const res = await axios.delete(`${API_URL}/${id}`);
      return res.data;
    } catch (error) {
      console.error("❌ Error deleting package:", error.response?.data || error.message);
      throw error;
    }
  },

  ratePackage: async (id, rating) => {
    try {
      const res = await axios.post(`${API_URL}/${id}/rate`, { rating });
      return res.data;
    } catch (error) {
      console.error("❌ Error rating package:", error.response?.data || error.message);
      throw error;
    }
  },

  // 10. Upload ảnh bìa -> ⚠️ CẦN SỬA CHỖ NÀY
  uploadPackageImage: async (id, formData) => {
    try {
      console.log("📤 Uploading package image for:", id);
      // ✅ ĐÃ SỬA: Xóa headers thủ công, để Axios tự xử lý boundary
      const res = await axios.post(`${API_URL}/${id}/upload-image`, formData);
      console.log("✅ Package image uploaded:", res.data);
      return res.data;
    } catch (error) {
      console.error("❌ Error uploading package image:", error.response?.data || error.message);
      throw error;
    }
  },

  // 11. Upload nhiều ảnh -> ⚠️ CẦN SỬA CHỖ NÀY
  uploadPackageImages: async (id, formData) => {
    try {
      console.log("📤 Uploading package images for:", id);
      // ✅ ĐÃ SỬA: Xóa headers thủ công
      const res = await axios.post(`${API_URL}/${id}/upload-images`, formData);
      console.log("✅ Package images uploaded:", res.data);
      return res.data;
    } catch (error) {
      console.error("❌ Error uploading package images:", error.response?.data || error.message);
      throw error;
    }
  },

  deletePackageImage: async (id, imageUrl) => {
    try {
      const res = await axios.delete(`${API_URL}/${id}/delete-image`, {
        data: { imageUrl }
      });
      return res.data;
    } catch (error) {
      console.error("❌ Error deleting image:", error.response?.data || error.message);
      throw error;
    }
  },

};

export default servicePackageApi;