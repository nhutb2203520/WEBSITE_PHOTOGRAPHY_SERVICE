import { axiosInstance } from "./adminAuthService";

const API_PATH = "/complaints";

/**
 * Lấy tất cả danh sách khiếu nại (Dành cho Admin)
 * Method: GET
 * Endpoint: /api/complaints/all
 */
const getAllComplaints = async () => {
  try {
    // ⚠️ SỬA: Đường dẫn khớp với route backend: router.get("/all", ...)
    const response = await axiosInstance.get(`${API_PATH}/all`);
    
    if (response && response.data) return response.data;
    return response; 
  } catch (error) {
    console.error("Error fetching complaints:", error);
    throw error.response?.data || error;
  }
};

/**
 * Xử lý khiếu nại cơ bản (Duyệt hoặc Từ chối - Không chia tiền)
 * Method: PUT
 * Endpoint: /api/complaints/:id
 * @param {string} id - ID của Complaint
 * @param {string} status - 'resolved' hoặc 'rejected'
 * @param {string} admin_response - Phản hồi của admin
 */
const processComplaint = async (id, status, admin_response) => {
  try {
    // ⚠️ SỬA: Đường dẫn khớp với route backend: router.put("/:id", ...)
    const response = await axiosInstance.put(`${API_PATH}/${id}`, {
      status,
      admin_response
    });
    
    return response.data || response;
  } catch (error) {
    console.error("Error processing complaint:", error);
    throw error.response?.data || error;
  }
};

/**
 * [NEW] Giải quyết khiếu nại thủ công & Upload biên lai
 * Method: POST
 * Endpoint: /api/complaints/resolve-manual
 * @param {FormData} formData - Chứa complaintId, refundPercent, photographerPercent, file ảnh
 */
const resolveComplaintManual = async (formData) => {
    try {
        // Gọi API POST /api/complaints/resolve-manual
        // Lưu ý: Khi gửi FormData, axios thường tự set Content-Type, 
        // nhưng để chắc chắn ta có thể set header multipart/form-data
        const response = await axiosInstance.post(`${API_PATH}/resolve-manual`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data || response;
    } catch (error) {
        console.error("Error resolving complaint manually:", error);
        throw error.response?.data || error;
    }
};

export default {
  getAllComplaints,
  processComplaint,
  resolveComplaintManual // ✅ Export hàm mới
};