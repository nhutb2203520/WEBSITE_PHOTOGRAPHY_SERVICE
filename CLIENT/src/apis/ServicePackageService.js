import axios from "axios";

const API_URL = "http://localhost:5000/api/service-packages";

// Interceptor để tự động thêm token
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
  
  /**
   * 📦 Tạo gói dịch vụ mới
   */
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

  /**
   * 📋 Lấy tất cả gói dịch vụ
   */
  getAllPackages: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.loaiGoi) params.append('loaiGoi', filters.loaiGoi);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.photographerId) params.append('photographerId', filters.photographerId);
      if (filters.sort) params.append('sort', filters.sort);

      const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
      console.log("📥 Fetching packages from:", url);
      
      const res = await axios.get(url);
      console.log("✅ Packages fetched:", res.data.total);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching packages:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 🔍 Lấy chi tiết 1 gói
   */
  getPackageById: async (id) => {
    try {
      console.log("📥 Fetching package:", id);
      const res = await axios.get(`${API_URL}/${id}`);
      console.log("✅ Package fetched:", res.data);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching package:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 🔍 Lấy gói của photographer theo username
   */
  getPackagesByPhotographer: async (username) => {
    try {
      console.log("📥 Fetching packages for photographer:", username);
      const res = await axios.get(`${API_URL}/photographer/${username}`);
      console.log("✅ Photographer packages fetched:", res.data.total);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching photographer packages:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 🔍 Lấy gói của tôi (photographer hiện tại)
   */
  getMyPackages: async () => {
    try {
      console.log("📥 Fetching my packages...");
      const res = await axios.get(`${API_URL}/my/packages`);
      console.log("✅ My packages fetched:", res.data.total);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching my packages:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * ✏️ Cập nhật gói
   */
  updatePackage: async (id, updates) => {
    try {
      console.log("📤 Updating package:", id, updates);
      const res = await axios.patch(`${API_URL}/${id}`, updates);
      console.log("✅ Package updated:", res.data);
      return res.data;
    } catch (error) {
      console.error("❌ Error updating package:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 🗑️ Xóa gói
   */
  deletePackage: async (id) => {
    try {
      console.log("🗑️ Deleting package:", id);
      const res = await axios.delete(`${API_URL}/${id}`);
      console.log("✅ Package deleted:", res.data);
      return res.data;
    } catch (error) {
      console.error("❌ Error deleting package:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * ⭐ Đánh giá gói
   */
  ratePackage: async (id, rating) => {
    try {
      console.log("⭐ Rating package:", id, "rating:", rating);
      const res = await axios.post(`${API_URL}/${id}/rate`, { rating });
      console.log("✅ Package rated:", res.data);
      return res.data;
    } catch (error) {
      console.error("❌ Error rating package:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 📸 Upload ảnh gói dịch vụ
   */
  uploadPackageImage: async (id, formData) => {
    try {
      console.log("📤 Uploading package image for:", id);
      const res = await axios.post(`${API_URL}/${id}/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("✅ Package image uploaded:", res.data);
      return res.data;
    } catch (error) {
      console.error("❌ Error uploading package image:", error.response?.data || error.message);
      throw error;
    }
  },

};

export default servicePackageApi;