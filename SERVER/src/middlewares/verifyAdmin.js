import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

export const verifyAdmin = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kiểm tra role admin
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }

      // Set user vào request
      req.user = {
        _id: decoded.id,
        role: decoded.role
      };

      next();
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy token xác thực'
    });
  }
});