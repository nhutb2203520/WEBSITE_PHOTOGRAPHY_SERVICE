import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import adminService from "../services/admin.service.js";
import KhachHang from "../models/khachhang.model.js";
import TrangThaiKhachHang from "../models/trangthaikhachhang.model.js";

const SECRET_KEY = process.env.JWT_SECRET || "MY_SECRET_KEY_DEFAULT";
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET || "MY_REFRESH_SECRET_KEY";


// @desc    Đăng nhập admin
// @route   POST /api/admin/login
export const loginAdmin = async (req, res) => {
  try {
    const { loginKey, password } = req.body;

    if (!loginKey || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng nhập thông tin đăng nhập" 
      });
    }

    // Tìm admin theo username / email / phone
    const admin = await adminService.getAdminByLoginKey(loginKey);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: "Admin không tồn tại" 
      });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Sai mật khẩu" 
      });
    }

    // Tạo Access Token (15 phút)
    const accessToken = jwt.sign(
      { id: admin._id, role: admin.role },
      SECRET_KEY,
      { expiresIn: "15m" }
    );

    // Tạo Refresh Token (7 ngày)
    const refreshToken = jwt.sign(
      { id: admin._id, role: admin.role },
      REFRESH_SECRET_KEY,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token: accessToken,
      refreshToken: refreshToken,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        phone: admin.phone,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("❌ Error login admin:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/admin/refresh-token
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token không được cung cấp"
      });
    }

    // Verify refresh token
    jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Refresh token không hợp lệ hoặc đã hết hạn"
        });
      }

      // Tạo access token mới
      const newAccessToken = jwt.sign(
        { id: decoded.id, role: decoded.role },
        SECRET_KEY,
        { expiresIn: "15m" }
      );

      return res.status(200).json({
        success: true,
        message: "Làm mới token thành công",
        token: newAccessToken
      });
    });
  } catch (err) {
    console.error("❌ Error refreshing token:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Đăng xuất admin
// @route   POST /api/admin/logout
export const logoutAdmin = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công"
    });
  } catch (err) {
    console.error("❌ Error logout admin:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// 👥 USER MANAGEMENT (Đã sửa lỗi hiển thị & cập nhật)
// ==========================================

// 1. Lấy danh sách Khách hàng
export const getCustomers = async (req, res) => {
  try {
    const customers = await KhachHang.find({ isPhotographer: false })
      .select("-Password -RefreshToken")
      .populate("MaTT") // ✅ ĐÃ THÊM: Để lấy tên trạng thái
      .sort({ createdAt: -1 });
      
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy danh sách khách hàng" });
  }
};

// 2. Lấy danh sách Nhiếp ảnh gia
export const getPhotographers = async (req, res) => {
  try {
    const photographers = await KhachHang.find({ isPhotographer: true })
      .select("-Password -RefreshToken")
      .populate("MaTT") // ✅ ĐÃ THÊM: Sửa lỗi hiển thị "Đã khóa" toàn bộ
      .sort({ createdAt: -1 });

    res.json({ success: true, data: photographers });
  } catch (error) {
    console.error("Lỗi getPhotographers:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách nhiếp ảnh gia" });
  }
};

// 3. Cập nhật trạng thái User (Thông minh hơn với Regex)
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' hoặc 'locked'

    console.log(`🔄 Admin req update: ${id} -> ${status}`);

    // ✅ SỬA LỖI DATABASE: Dùng Regex để tìm kiếm không phân biệt hoa thường và các lỗi ký tự lạ
    // Tìm trạng thái bắt đầu bằng từ khóa gửi lên
    const statusRecord = await TrangThaiKhachHang.findOne({ 
        TenTT: { $regex: new RegExp(`^${status}`, 'i') } 
    });

    if (!statusRecord) {
      console.error(`❌ Không tìm thấy trạng thái khớp với: ${status}`);
      return res.status(400).json({ 
          success: false, 
          message: `Không tìm thấy trạng thái '${status}' trong CSDL.` 
      });
    }

    // Cập nhật và populate lại ngay lập tức
    const updatedUser = await KhachHang.findByIdAndUpdate(
      id,
      { MaTT: statusRecord._id },
      { new: true }
    ).populate("MaTT");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    console.log(`✅ Update thành công: ${updatedUser.HoTen} -> ${updatedUser.MaTT.TenTT}`);

    res.status(200).json({ 
        success: true, 
        message: "Cập nhật trạng thái thành công", 
        data: updatedUser 
    });
  } catch (error) {
    console.error("❌ Error updateUserStatus:", error);
    res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
  }
};

export default {
  loginAdmin,
  refreshAccessToken,
  logoutAdmin,
  getCustomers,
  getPhotographers,
  updateUserStatus
};