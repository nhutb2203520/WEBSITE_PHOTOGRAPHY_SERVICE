import axios from "axios";

// Đảm bảo URL này đúng với server của bạn (mặc định port 5000)
const API_URL = "http://localhost:5000/api/favorites";

// Tự động thêm token vào header cho mọi request
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const FavoriteService = {
  /**
   * Toggle yêu thích (Thích/Bỏ thích)
   * @param {string} type - 'package' hoặc 'photographer'
   * @param {string} itemId - ID của gói hoặc thợ
   */
  toggleFavorite: async (type, itemId) => {
    try {
      const res = await axios.post(`${API_URL}/toggle`, { type, itemId });
      return res.data;
    } catch (error) {
      console.error("Lỗi toggle favorite:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách yêu thích của tôi
   */
  getMyFavorites: async () => {
    try {
      const res = await axios.get(`${API_URL}/my-favorites`);
      return res.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách yêu thích:", error);
      return { success: false, data: { packages: [], photographers: [], allIds: [] } };
    }
  }
};

export default FavoriteService;