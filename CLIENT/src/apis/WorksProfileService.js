import axios from "axios";

// Đảm bảo URL này khớp với file server.js (app.use("/api/worksprofile", ...))
const API_URL = "http://localhost:5000/api/worksprofile";

// ============================================================
// ✅ INTERCEPTOR QUAN TRỌNG: XỬ LÝ TOKEN VÀ FORM DATA
// ============================================================
axios.interceptors.request.use((config) => {
  // 1. Tự động gắn Token
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Tự động xử lý Header cho File Upload (Fix lỗi 400 Bad Request)
  // Nếu dữ liệu gửi đi là FormData (có ảnh/file), ta xóa Content-Type
  // để trình duyệt tự động điền boundary chính xác.
  if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

const worksProfileApi = {
  
  // 1. 🔍 TÌM KIẾM BẰNG HÌNH ẢNH (AI)
  searchByImage: async (formData) => {
    try {
      console.log("🔍 WorksProfile: Searching by image...");
      // Không cần set headers thủ công, Interceptor đã lo
      const res = await axios.post(`${API_URL}/search-image`, formData);
      return res.data;
    } catch (error) {
      console.error("❌ Error searching works:", error.response?.data || error.message);
      throw error;
    }
  },

  // 2. Lấy danh sách hồ sơ của tôi (Logged in user)
  getMyWorks: async () => {
    try {
      const res = await axios.get(`${API_URL}/my`);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching my works:", error.response?.data || error.message);
      throw error;
    }
  },

  // 3. Lấy danh sách hồ sơ theo User ID (Public view)
  getWorksByUserId: async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/user/${userId}`);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching user works:", error.response?.data || error.message);
      throw error;
    }
  },

  // 4. Lấy chi tiết 1 hồ sơ
  getWorkById: async (id) => {
    try {
      const res = await axios.get(`${API_URL}/${id}`);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching work detail:", error.response?.data || error.message);
      throw error;
    }
  },

  // 5. Tạo mới hồ sơ (Có upload ảnh)
  createWork: async (formData) => {
    try {
      console.log("📤 Creating work profile...");
      const res = await axios.post(`${API_URL}/create`, formData);
      return res.data;
    } catch (error) {
      console.error("❌ Error creating work:", error.response?.data || error.message);
      throw error;
    }
  },

  // 6. Cập nhật hồ sơ
  updateWork: async (id, formData) => {
    try {
      console.log("📤 Updating work profile:", id);
      const res = await axios.put(`${API_URL}/${id}`, formData);
      return res.data;
    } catch (error) {
      console.error("❌ Error updating work:", error.response?.data || error.message);
      throw error;
    }
  },

  // 7. Xóa hồ sơ
  deleteWork: async (id) => {
    try {
      const res = await axios.delete(`${API_URL}/${id}`);
      return res.data;
    } catch (error) {
      console.error("❌ Error deleting work:", error.response?.data || error.message);
      throw error;
    }
  }
};

export default worksProfileApi;