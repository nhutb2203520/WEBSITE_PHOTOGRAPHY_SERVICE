import { axiosInstance } from './adminAuthService'; 
const notificationAdminApi = {
  // Gọi vào route /api/admin/notifications
  getMyNotifications: () => {
    return axiosInstance.get('/admin/notifications');
  },

  markAsRead: (id) => {
    return axiosInstance.patch(`/admin/notifications/${id}/read`);
  },

  markAllAsRead: () => {
    return axiosInstance.patch('/admin/notifications/read-all');
  }
};

export default notificationAdminApi;