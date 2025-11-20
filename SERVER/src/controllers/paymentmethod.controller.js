import PaymentMethod from '../models/paymentmethod.model.js';
import asyncHandler from 'express-async-handler';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Lấy tất cả phương thức thanh toán
// @route   GET /api/payment-methods
// @access  Public (để khách hàng xem khi thanh toán)
export const getAllPaymentMethods = asyncHandler(async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const paymentMethods = await PaymentMethod.find(filter)
      .populate('createdBy', 'HoTen Email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: paymentMethods.length,
      data: paymentMethods
    });
  } catch (error) {
    console.error('❌ Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phương thức thanh toán',
      error: error.message
    });
  }
});

// @desc    Lấy phương thức thanh toán theo ID
// @route   GET /api/payment-methods/:id
// @access  Public
export const getPaymentMethodById = asyncHandler(async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id)
      .populate('createdBy', 'HoTen Email');

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phương thức thanh toán'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error('❌ Error getting payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin phương thức thanh toán',
      error: error.message
    });
  }
});

// @desc    Tạo phương thức thanh toán mới
// @route   POST /api/payment-methods
// @access  Private/Admin
export const createPaymentMethod = asyncHandler(async (req, res) => {
  try {
    const { fullName, accountNumber, bank, branch, qrCode } = req.body;

    // Validate required fields
    if (!fullName || !accountNumber || !bank) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin bắt buộc'
      });
    }

    // Kiểm tra xem số tài khoản đã tồn tại chưa
    const existingMethod = await PaymentMethod.findOne({ 
      accountNumber, 
      bank 
    });

    if (existingMethod) {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán này đã tồn tại'
      });
    }

    const paymentMethod = await PaymentMethod.create({
      fullName,
      accountNumber,
      bank,
      branch: branch || '',
      qrCode: qrCode || null,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Tạo phương thức thanh toán thành công',
      data: paymentMethod
    });
  } catch (error) {
    console.error('❌ Error creating payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo phương thức thanh toán',
      error: error.message
    });
  }
});

// @desc    Cập nhật phương thức thanh toán
// @route   PUT /api/payment-methods/:id
// @access  Private/Admin
export const updatePaymentMethod = asyncHandler(async (req, res) => {
  try {
    const { fullName, accountNumber, bank, branch, qrCode, isActive } = req.body;

    const paymentMethod = await PaymentMethod.findById(req.params.id);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phương thức thanh toán'
      });
    }

    // Cập nhật thông tin
    if (fullName !== undefined) paymentMethod.fullName = fullName;
    if (accountNumber !== undefined) paymentMethod.accountNumber = accountNumber;
    if (bank !== undefined) paymentMethod.bank = bank;
    if (branch !== undefined) paymentMethod.branch = branch;
    if (qrCode !== undefined) paymentMethod.qrCode = qrCode;
    if (isActive !== undefined) paymentMethod.isActive = isActive;

    const updatedMethod = await paymentMethod.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật phương thức thanh toán thành công',
      data: updatedMethod
    });
  } catch (error) {
    console.error('❌ Error updating payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phương thức thanh toán',
      error: error.message
    });
  }
});

// @desc    Xóa phương thức thanh toán
// @route   DELETE /api/payment-methods/:id
// @access  Private/Admin
export const deletePaymentMethod = asyncHandler(async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phương thức thanh toán'
      });
    }

    // Xóa QR code file nếu có
    if (paymentMethod.qrCode && paymentMethod.qrCode.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', '..', paymentMethod.qrCode);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await paymentMethod.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa phương thức thanh toán thành công'
    });
  } catch (error) {
    console.error('❌ Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phương thức thanh toán',
      error: error.message
    });
  }
});

// @desc    Upload QR Code
// @route   POST /api/payment-methods/:id/upload-qr
// @access  Private/Admin
export const uploadQRCode = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file QR code'
      });
    }

    const paymentMethod = await PaymentMethod.findById(req.params.id);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phương thức thanh toán'
      });
    }

    // Xóa QR code cũ nếu có
    if (paymentMethod.qrCode && paymentMethod.qrCode.startsWith('/uploads/')) {
      const oldFilePath = path.join(__dirname, '..', '..', paymentMethod.qrCode);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Cập nhật đường dẫn QR code mới
    paymentMethod.qrCode = `/uploads/qrcodes/${req.file.filename}`;
    await paymentMethod.save();

    res.status(200).json({
      success: true,
      message: 'Upload QR code thành công',
      data: {
        qrCode: paymentMethod.qrCode
      }
    });
  } catch (error) {
    console.error('❌ Error uploading QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload QR code',
      error: error.message
    });
  }
});

// @desc    Toggle active status
// @route   PATCH /api/payment-methods/:id/toggle-active
// @access  Private/Admin
export const toggleActiveStatus = asyncHandler(async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phương thức thanh toán'
      });
    }

    paymentMethod.isActive = !paymentMethod.isActive;
    await paymentMethod.save();

    res.status(200).json({
      success: true,
      message: `${paymentMethod.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} phương thức thanh toán thành công`,
      data: paymentMethod
    });
  } catch (error) {
    console.error('❌ Error toggling active status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi trạng thái',
      error: error.message
    });
  }
});