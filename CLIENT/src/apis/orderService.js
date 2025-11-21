import axiosUser from "./axiosUser";

const ORDER_URL = "/orders";

const orderApi = {
  // 📦 Tạo đơn hàng mới
  createOrder: (data) => axiosUser.post(`${ORDER_URL}`, data),
  
  // 📋 Lấy danh sách đơn hàng của tôi
  getMyOrders: () => axiosUser.get(`${ORDER_URL}/my-orders`),
  
  // 🔍 Lấy chi tiết đơn hàng
  getOrderDetail: (orderId) => axiosUser.get(`${ORDER_URL}/${orderId}`),
  
  // 🔄 Cập nhật trạng thái (Dành cho luồng xử lý khác nếu cần)
  updateOrderStatus: (orderId, status, note = "") =>
    axiosUser.put(`${ORDER_URL}/${orderId}/status`, { status, note }),

  // 🚚 Tính phí di chuyển
  calculateTravelFee: (packageId, lat, lng) =>
    axiosUser.post(`${ORDER_URL}/calculate-travel-fee`, { packageId, lat, lng }),

  // ✅ XÁC NHẬN THANH TOÁN (ĐÃ SỬA LỖI 400)
  confirmPayment: (orderId, formData) => {
    return axiosUser.post(`${ORDER_URL}/${orderId}/confirm-payment`, formData, {
      headers: { 
        // QUAN TRỌNG: Đặt là undefined để trình duyệt tự động thêm boundary
        "Content-Type": undefined 
      }
    });
  },

  // 📷 Upload ảnh bằng chứng (nếu dùng riêng)
  uploadPaymentProof: (orderId, formData) => 
    axiosUser.post(`${ORDER_URL}/${orderId}/upload-proof`, formData, {
      headers: { 
        "Content-Type": undefined 
      }
    }),
};

export default orderApi;