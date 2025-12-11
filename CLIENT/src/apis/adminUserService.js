import { axiosInstance } from "./adminAuthService"; // ✅ Dùng axiosInstance để tự động kèm Token

const adminUserService = {
  /**
   * Lấy danh sách Khách hàng
   * GET /api/admin/customers
   */
  getCustomers: async () => {
    try {
      const response = await axiosInstance.get("/admin/customers");
      return response.data; // Trả về { success: true, data: [...] }
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy danh sách Nhiếp ảnh gia
   * GET /api/admin/photographers
   */
  getPhotographers: async () => {
    try {
      const response = await axiosInstance.get("/admin/photographers");
      return response.data; // Trả về { success: true, data: [...] }
    } catch (error) {
      console.error("Error fetching photographers:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Cập nhật trạng thái tài khoản (Khóa/Mở khóa)
   * PATCH /api/admin/users/:id/status
   */
  updateUserStatus: async (id, status) => {
    try {
      // ✅ Sử dụng axiosInstance để gửi kèm Token Admin
      // status gửi đi là string: 'active' hoặc 'locked'
      const response = await axiosInstance.patch(`/admin/users/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error.response?.data || error;
    }
  }
}; // 🛑 Đóng ngoặc object ở đây là ĐÚNG

export default adminUserService;