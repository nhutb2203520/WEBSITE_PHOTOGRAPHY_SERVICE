import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyTokenUser = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    
    console.log("🔐 Auth Header:", authHeader);
    
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ 
        success: false,
        message: "Access denied. No token provided." 
      });
    }

    console.log("🔐 Token:", token.substring(0, 50) + "...");

    jwt.verify(
      token, 
      process.env.JWT_SECRET || "Luan Van Tot Nghiep-B2203520", 
      (err, decoded) => {
        if (err) {
          console.log("❌ Lỗi xác thực token:", err.message);
          console.log("❌ Error name:", err.name);
          return res.status(403).json({ 
            success: false,
            message: "Invalid token.",
            error: err.message 
          });
        }
        
        console.log("✅ Token decoded successfully:", decoded);
        
        // ✅ Gắn cả decoded object và id riêng
        req.user = decoded;
        req.userId = decoded.id || decoded._id || decoded.userId;
        
        console.log("✅ User ID extracted:", req.userId);
        
        next();
      }
    );
  } catch (error) {
    console.error("❌ Unexpected error in verifyTokenUser:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};
/*
export const verifyTokenStaff = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "Access denied. No token provided." 
    });
  }

  jwt.verify(
    token, 
    process.env.JWT_SECRET || "Luan Van Tot Nghiep-B2203520", 
    (err, staff) => {
      if (err || !staff.ChucVu) {
        return res.status(403).json({ 
          success: false,
          message: "Invalid token." 
        });
      }
      req.staff = staff;
      next();
    }
  );
}; */