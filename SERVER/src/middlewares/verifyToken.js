import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyTokenUser = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  // 1. Kiểm tra có header Authorization không
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // console.log("❌ [VerifyToken] Thiếu header hoặc sai định dạng");
    // Dùng return để dừng ngay, không chạy tiếp
    return res.status(401).json({ 
      success: false, 
      message: "Bạn chưa đăng nhập (Thiếu Token)!" 
    });
  }

  // 2. Lấy token
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Token rỗng!" 
    });
  }

  // 3. Giải mã Token (Dùng Try-Catch để bắt lỗi an toàn)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "Luan Van Tot Nghiep-B2203520");
    
    // Gán thông tin user vào request để dùng ở controller sau
    req.user = decoded;
    req.userId = decoded.id || decoded._id;

    // ✅ Cho phép đi tiếp
    return next(); 

  } catch (err) {
    console.log("❌ [VerifyToken] Lỗi Token:", err.message);
    
    // Xử lý các loại lỗi cụ thể của JWT
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ success: false, message: "Token đã hết hạn, vui lòng đăng nhập lại." });
    }
    
    return res.status(403).json({ success: false, message: "Token không hợp lệ." });
  }
};