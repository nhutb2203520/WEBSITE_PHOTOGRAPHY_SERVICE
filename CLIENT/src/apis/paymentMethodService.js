import { axiosInstance } from "./adminAuthService";
import axiosUser from "./axiosUser"; 

const API_PATH = "/payment-methods";

/**
 * Lấy tất cả phương thức thanh toán
 */
const getAllPaymentMethods = async (isActive = null) => {
  try {
    const params = {};
    if (isActive !== null) params.isActive = isActive;
    
    // Sử dụng axiosUser cho Client, axiosInstance cho Admin tùy context
    // Nếu đang ở trang Admin, nên dùng axiosInstance để có quyền đầy đủ
    // Nhưng để tránh lỗi Token NULL nếu auth chưa load kịp, axiosUser là fallback an toàn cho việc GET
    const response = await axiosUser.get(API_PATH, { params });
    
    // ✅ FIX LỖI: Kiểm tra nếu response đã là data (do interceptor)
    if (Array.isArray(response)) return response;
    if (response && response.data) return response.data;
    return response; // Fallback
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    throw error.response?.data || error;
  }
};

const getPaymentMethodById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_PATH}/${id}`);
    return response.data || response;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ✅ Gửi JSON thuần túy
const createPaymentMethod = async (data) => {
  try {
    const response = await axiosInstance.post(API_PATH, data);
    return response.data || response;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ✅ Gửi JSON thuần túy
const updatePaymentMethod = async (id, data) => {
  try {
    const response = await axiosInstance.put(`${API_PATH}/${id}`, data);
    return response.data || response;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const deletePaymentMethod = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_PATH}/${id}`);
    return response.data || response;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const toggleActiveStatus = async (id) => {
  try {
    const response = await axiosInstance.patch(`${API_PATH}/${id}/toggle-active`);
    return response.data || response;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  toggleActiveStatus,
};