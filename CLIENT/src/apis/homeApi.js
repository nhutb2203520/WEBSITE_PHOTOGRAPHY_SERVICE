import axios from "axios";

// Đổi URL này theo cấu hình server của bạn
const API_URL = "http://localhost:5000/api/public"; 

const homeApi = {
  getSystemStats: async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`);
      return res.data; // Trả về { success: true, data: { ... } }
    } catch (error) {
      console.error("Lỗi gọi API thống kê:", error);
      return null;
    }
  }
};

export default homeApi;