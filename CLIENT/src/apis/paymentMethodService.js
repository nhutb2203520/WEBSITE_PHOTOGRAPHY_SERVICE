import { axiosInstance } from "./adminAuthService";

const API_PATH = "/payment-methods";

/**
 * Lấy tất cả phương thức thanh toán
 */
const getAllPaymentMethods = async (isActive = null) => {
  try {
    const params = {};
    if (isActive !== null) params.isActive = isActive;

    const response = await axiosInstance.get(API_PATH, { params });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching payment methods:", error);
    throw error.response?.data || error;
  }
};

/**
 * Lấy phương thức thanh toán theo ID
 */
const getPaymentMethodById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_PATH}/${id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching payment method:", error);
    throw error.response?.data || error;
  }
};

/**
 * Tạo phương thức thanh toán mới
 */
const createPaymentMethod = async (data) => {
  try {
    const response = await axiosInstance.post(API_PATH, data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating payment method:", error);
    throw error.response?.data || error;
  }
};

/**
 * Cập nhật phương thức thanh toán
 */
const updatePaymentMethod = async (id, data) => {
  try {
    const response = await axiosInstance.put(`${API_PATH}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating payment method:", error);
    throw error.response?.data || error;
  }
};

/**
 * Xóa phương thức thanh toán
 */
const deletePaymentMethod = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_PATH}/${id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting payment method:", error);
    throw error.response?.data || error;
  }
};

/**
 * Toggle trạng thái active
 */
const toggleActiveStatus = async (id) => {
  try {
    const response = await axiosInstance.patch(`${API_PATH}/${id}/toggle-active`);
    return response.data;
  } catch (error) {
    console.error("❌ Error toggling active status:", error);
    throw error.response?.data || error;
  }
};

/**
 * Upload QR code (file)
 */
const uploadQRCode = async (id, file) => {
  try {
    const formData = new FormData();
    formData.append("qrCode", file);

    const response = await axiosInstance.post(`${API_PATH}/${id}/upload-qr`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error uploading QR code:", error);
    throw error.response?.data || error;
  }
};

/**
 * Upload QR code base64
 */
const uploadQRCodeBase64 = async (id, base64Data) => {
  try {
    const response = await axiosInstance.put(
      `${API_PATH}/${id}`,
      { qrCode: base64Data }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error uploading QR code base64:", error);
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
  uploadQRCode,
  uploadQRCodeBase64,
};