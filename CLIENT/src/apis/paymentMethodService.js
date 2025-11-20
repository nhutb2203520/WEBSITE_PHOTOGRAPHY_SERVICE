import axios from 'axios';

const API_URL = 'http://localhost:5000/api/payment-methods';

// Lấy tất cả phương thức thanh toán
const getAllPaymentMethods = async (isActive = null) => {
  try {
    const params = {};
    if (isActive !== null) {
      params.isActive = isActive;
    }

    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching payment methods:', error);
    throw error.response?.data || error;
  }
};

// Lấy phương thức thanh toán theo ID
const getPaymentMethodById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching payment method:', error);
    throw error.response?.data || error;
  }
};

// Tạo phương thức thanh toán mới
const createPaymentMethod = async (data, token) => {
  try {
    const response = await axios.post(API_URL, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error creating payment method:', error);
    throw error.response?.data || error;
  }
};

// Cập nhật phương thức thanh toán
const updatePaymentMethod = async (id, data, token) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error updating payment method:', error);
    throw error.response?.data || error;
  }
};

// Xóa phương thức thanh toán
const deletePaymentMethod = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting payment method:', error);
    throw error.response?.data || error;
  }
};

// Upload QR code
const uploadQRCode = async (id, file, token) => {
  try {
    const formData = new FormData();
    formData.append('qrCode', file);

    const response = await axios.post(`${API_URL}/${id}/upload-qr`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error uploading QR code:', error);
    throw error.response?.data || error;
  }
};

// Toggle trạng thái active
const toggleActiveStatus = async (id, token) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/toggle-active`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error toggling active status:', error);
    throw error.response?.data || error;
  }
};

// Upload QR code dạng base64
const uploadQRCodeBase64 = async (id, base64Data, token) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, 
      { qrCode: base64Data },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Error uploading QR code base64:', error);
    throw error.response?.data || error;
  }
};

const paymentMethodService = {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  uploadQRCode,
  toggleActiveStatus,
  uploadQRCodeBase64
};

export default paymentMethodService;