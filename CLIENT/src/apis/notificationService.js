import axiosUser from './axiosUser'; // Sử dụng instance axios đã cấu hình token

const notificationApi = {
  /**
   * 🔹 Lấy danh sách thông báo của user hiện tại
   * @returns {Promise<Object>} { success, data: [], unreadCount }
   */
  getMyNotifications: () => {
    return axiosUser.get('/notifications');
  },

  /**
   * 🔹 Đánh dấu 1 thông báo là đã đọc
   * @param {string} id - ID của thông báo
   */
  markAsRead: (id) => {
    return axiosUser.patch(`/notifications/${id}/read`);
  },

  /**
   * 🔹 Đánh dấu TẤT CẢ là đã đọc
   */
  markAllAsRead: () => {
    return axiosUser.patch('/notifications/read-all');
  }
};

export default notificationApi;