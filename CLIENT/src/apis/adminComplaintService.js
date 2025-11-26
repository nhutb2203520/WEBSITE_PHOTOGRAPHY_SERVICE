import { axiosInstance } from "./adminAuthService"; // ✅ Dùng axiosInstance của Admin để tự động kèm Token

const API_PATH = "/complaints";

/**
 * Lấy tất cả danh sách khiếu nại (Dành cho Admin)
 */
const getAllComplaints = async () => {
  try {
    // Gọi API GET /api/complaints/admin/all
    const response = await axiosInstance.get(`${API_PATH}/admin/all`);
    
    // ✅ Xử lý kết quả trả về giống paymentMethodService
    // Nếu response.data tồn tại thì trả về nó, ngược lại trả về nguyên response
    if (response && response.data) return response.data;
    return response; 
  } catch (error) {
    console.error("Error fetching complaints:", error);
    // Ném lỗi ra để Component (ComplaintManager) bắt được và hiển thị toast
    throw error.response?.data || error;
  }
};

/**
 * Xử lý khiếu nại (Duyệt hoặc Từ chối)
 * @param {string} id - ID của Complaint
 * @param {string} status - 'resolved' hoặc 'rejected'
 * @param {string} admin_response - Phản hồi của admin
 */
const processComplaint = async (id, status, admin_response) => {
  try {
    // Gọi API PUT /api/complaints/:id/process
    const response = await axiosInstance.put(`${API_PATH}/${id}/process`, {
      status,
      admin_response
    });
    
    return response.data || response;
  } catch (error) {
    console.error("Error processing complaint:", error);
    throw error.response?.data || error;
  }
};

export default {
  getAllComplaints,
  processComplaint
};