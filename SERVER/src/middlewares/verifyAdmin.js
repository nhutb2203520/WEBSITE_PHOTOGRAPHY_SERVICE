import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

export const verifyAdmin = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Kiểm tra Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token
      token = req.headers.authorization.split(' ')[1];

      // Giải mã
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "Luan Van Tot Nghiep-B2203520");

      // Kiểm tra Role Admin
      if (decoded.role !== 'admin' && decoded.isAdmin !== true) {
        return res.status(403).json({
          success: false,
          message: 'Truy cập bị từ chối! Bạn không phải Admin.'
        });
      }

      // Gán user
      req.user = {
        _id: decoded.id || decoded._id,
        role: decoded.role
      };

      // ✅ QUAN TRỌNG: Return next() để thoát khỏi hàm, không chạy xuống dưới
      return next();

    } catch (error) {
      console.error('❌ [VerifyAdmin] Token Failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }
  }

  // 2. Nếu không có token (Và chưa vào block if ở trên)
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy token xác thực Admin'
    });
  }
});