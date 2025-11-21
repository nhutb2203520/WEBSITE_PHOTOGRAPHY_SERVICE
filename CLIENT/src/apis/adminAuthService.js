import axios from "axios";

const API_URL = "http://localhost:5000/api/admin";

// ✅ Dùng sessionStorage thay vì localStorage
// → Đóng tab/browser = mất token = phải login lại
const storage = {
  setItem: (key, value) => sessionStorage.setItem(key, value),
  getItem: (key) => sessionStorage.getItem(key),
  removeItem: (key) => sessionStorage.removeItem(key),
  clear: () => sessionStorage.clear(),
};

// Tạo axios instance
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Request interceptor - Thêm token vào mỗi request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = storage.getItem("adminToken");
    
    // ✅ Debug log
    console.log("🔐 [Interceptor] Preparing request to:", config.url);
    console.log("🔐 [Interceptor] Token from storage:", token ? token.substring(0, 50) + "..." : "NULL");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ [Interceptor] Authorization header set");
    } else {
      console.warn("⚠️ [Interceptor] No token found in sessionStorage!");
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Tự động refresh token khi hết hạn
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu token hết hạn (401) và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = storage.getItem("adminRefreshToken");
        
        if (!refreshToken) {
          // Không có refresh token → logout
          storage.clear();
          window.location.href = "/admin-login";
          return Promise.reject(error);
        }

        console.log("🔄 Access token expired, refreshing...");

        // Gọi API refresh token
        const response = await axios.post(`${API_URL}/refresh-token`, {
          refreshToken,
        });

        const { token: newAccessToken } = response.data;

        // Lưu token mới
        storage.setItem("adminToken", newAccessToken);
        
        console.log("✅ Token refreshed successfully");

        // Retry request ban đầu với token mới
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh token cũng hết hạn → logout
        console.error("❌ Refresh token failed:", refreshError);
        storage.clear();
        window.location.href = "/admin-login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ✅ Auto refresh token mỗi 14 phút (trước khi hết hạn 1 phút)
let refreshInterval = null;

const startAutoRefresh = () => {
  // Clear interval cũ nếu có
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Refresh mỗi 14 phút
  refreshInterval = setInterval(async () => {
    try {
      const refreshToken = storage.getItem("adminRefreshToken");
      
      if (!refreshToken) {
        console.warn("⚠️ No refresh token, stopping auto-refresh");
        stopAutoRefresh();
        return;
      }

      console.log("🔄 Auto-refreshing token...");

      const response = await axios.post(`${API_URL}/refresh-token`, {
        refreshToken,
      });

      const { token: newAccessToken } = response.data;
      storage.setItem("adminToken", newAccessToken);
      
      console.log("✅ Token auto-refreshed at", new Date().toLocaleTimeString());
    } catch (error) {
      console.error("❌ Auto-refresh failed:", error);
      stopAutoRefresh();
      storage.clear();
      window.location.href = "/admin-login";
    }
  }, 14 * 60 * 1000); // 14 phút

  console.log("✅ Auto-refresh started (every 14 minutes)");
};

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log("🛑 Auto-refresh stopped");
  }
};

// Service methods
const adminAuthService = {
  // Đăng nhập
  login: async (loginKey, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        loginKey,
        password,
      });

      const { token, refreshToken, admin } = response.data;

      // ✅ Lưu vào sessionStorage (đóng tab = mất hết)
      storage.setItem("adminToken", token);
      storage.setItem("adminRefreshToken", refreshToken);
      storage.setItem("adminInfo", JSON.stringify(admin));

      // ✅ Bắt đầu auto-refresh
      startAutoRefresh();

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Đăng xuất
  logout: async () => {
    try {
      await axiosInstance.post("/admin/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // ✅ Dừng auto-refresh
      stopAutoRefresh();
      
      // Xóa tất cả thông tin
      storage.clear();
      window.location.href = "/admin-login";
    }
  },

  // Kiểm tra xem user đã đăng nhập chưa
  isAuthenticated: () => {
    const token = storage.getItem("adminToken");
    const refreshToken = storage.getItem("adminRefreshToken");
    return !!(token && refreshToken);
  },

  // Lấy thông tin admin hiện tại
  getCurrentAdmin: () => {
    const adminInfo = storage.getItem("adminInfo");
    return adminInfo ? JSON.parse(adminInfo) : null;
  },

  // Khởi động auto-refresh khi app load (nếu đã login)
  initAutoRefresh: () => {
    if (adminAuthService.isAuthenticated()) {
      startAutoRefresh();
    }
  },
};

export { axiosInstance };
export default adminAuthService;