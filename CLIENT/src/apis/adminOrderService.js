import { axiosInstance } from "./adminAuthService";

const adminOrderService = {
  // Lấy tất cả đơn hàng
  getAllOrders: () => {
    return axiosInstance.get("/admin/orders");
  },

  // ✅ CẬP NHẬT MỚI: Hàm cập nhật trạng thái linh hoạt
  updateOrderStatus: (orderId, status, note = "") => {
    return axiosInstance.put(`/admin/orders/${orderId}`, { 
      status, 
      note 
    });
  },

  // Giữ lại hàm cũ để tương thích ngược (nếu cần)
  approveOrderManually: (orderId) => {
      return axiosInstance.put(`/admin/orders/${orderId}`, {
          status: 'confirmed',
          note: 'Admin đã xác nhận thanh toán thủ công'
      });
  },

  // Quyết toán cho thợ
  settleForPhotographer: (orderId) => {
    return axiosInstance.put(`/admin/orders/${orderId}/settle`);
  }
};

export default adminOrderService;