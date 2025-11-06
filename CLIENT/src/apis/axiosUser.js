import axios from 'axios';

// Tạo instance axios
const axiosUser = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 100000 // 100s
});

const getAccessToken = () => sessionStorage.getItem('token');
const getRefreshToken = () => sessionStorage.getItem('refreshToken');

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosUser.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosUser.interceptors.response.use(
  (response) => {
    return response.data; // luôn trả về response.data
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu gặp lỗi 401 (token hết hạn) và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return axiosUser(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // ✅ SỬA: Đổi port từ 3000 → 5000 cho đúng với backend
        const res = await axios.post(
          'http://localhost:5000/api/auth/refresh-token',
          {
            refreshToken
          }
        );

        const newAccessToken = res.data.token;

        sessionStorage.setItem('token', newAccessToken);

        axiosUser.defaults.headers.Authorization = 'Bearer ' + newAccessToken;

        processQueue(null, newAccessToken);

        return axiosUser(originalRequest);
      } catch (err) {
        processQueue(err, null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        const isAdmin = window.location.pathname.startsWith('/admin');
        window.location.href = isAdmin ? '/admin/login' : '/signin';
        
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosUser;