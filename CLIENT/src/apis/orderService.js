import axiosUser from "./axiosUser";

const ORDER_URL = "/orders";

const orderApi = {
  // 📦 Tạo đơn hàng mới
  createOrder: (data) => axiosUser.post(`${ORDER_URL}`, data),
  
  // 📋 Lấy danh sách đơn hàng của tôi (Dành cho KHÁCH HÀNG)
  getMyOrders: () => axiosUser.get(`${ORDER_URL}/my-orders`),

  // 📸 [MỚI] Lấy danh sách đơn hàng (Dành riêng cho PHOTOGRAPHER)
  getPhotographerOrders: () => axiosUser.get(`${ORDER_URL}/photographer/list`),
  
  // 🔍 Lấy chi tiết đơn hàng
  getOrderDetail: (orderId) => axiosUser.get(`${ORDER_URL}/${orderId}`),
  
  // 🔄 Cập nhật trạng thái
  updateOrderStatus: (orderId, status, note = "") =>
    axiosUser.put(`${ORDER_URL}/${orderId}/status`, { status, note }),

  // 🚚 Tính phí di chuyển
  calculateTravelFee: (packageId, lat, lng) =>
    axiosUser.post(`${ORDER_URL}/calculate-travel-fee`, { packageId, lat, lng }),

  // ✅ XÁC NHẬN THANH TOÁN
  confirmPayment: (orderId, formData) => {
    return axiosUser.post(`${ORDER_URL}/${orderId}/confirm-payment`, formData, {
      headers: { 
        "Content-Type": undefined 
      }
    });
  },

  // 📷 Upload ảnh bằng chứng
  uploadPaymentProof: (orderId, formData) => 
    axiosUser.post(`${ORDER_URL}/${orderId}/upload-proof`, formData, {
      headers: { 
        "Content-Type": undefined 
      }
    }), // <--- Dấu phẩy quan trọng ở đây

  // ❌ [OLD] Gửi khiếu nại cũ (Giữ lại để tránh lỗi legacy code)
  submitComplaint: (orderId, reason) => 
    axiosUser.post(`${ORDER_URL}/${orderId}/complaint`, { reason }),

  // ✅ [NEW] TẠO KHIẾU NẠI MỚI (Hỗ trợ FormData & Nhiều ảnh)
  createComplaint: (formData) => {
    return axiosUser.post('/complaints', formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ✅ [REVIEW] Tạo đánh giá mới
  createReview: (formData) => {
    return axiosUser.post('/reviews', formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ✅ [REVIEW] Sửa đánh giá
  updateReview: (reviewId, formData) => {
    return axiosUser.put(`/reviews/${reviewId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
  }
};

export default orderApi;