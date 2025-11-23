import { axiosInstance } from "./adminAuthService"; 

const adminOrderService = {
  // Lấy tất cả đơn hàng
  getAllOrders: () => {
    // Sử dụng axiosInstance để gọi API
    return axiosInstance.get("/admin/orders");
  },

  // Xác nhận thanh toán (Full flow)
  confirmPayment: (orderId) => {
    return axiosInstance.put(`/admin/orders/${orderId}/confirm-payment`, {
        method: 'cash', 
        amount: 0, 
        transaction_code: 'ADMIN_CONFIRM' 
    });
  },
  
  // Xác nhận nhanh (Update status)
  approveOrderManually: (orderId) => {
      return axiosInstance.put(`/admin/orders/${orderId}`, {
          status: 'confirmed',
          note: 'Admin đã xác nhận thanh toán thủ công'
      });
  }
};

export default adminOrderService;