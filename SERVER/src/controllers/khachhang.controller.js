import ApiError from "../ApiError.js";
import KhachHangService from "../services/khachhang.service.js";

// [GET] /api/khachhang/me
export const getMyAccount = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log("📥 getMyAccount userId:", userId);
    const result = await KhachHangService.getMyAccount(userId);
    return res.status(200).json(result.customer);
  } catch (err) {
    console.error("❌ Error in getMyAccount:", err);
    return next(new ApiError(500, "Lỗi khi lấy thông tin tài khoản người dùng."));
  }
};

// [PATCH] /api/khachhang/update
export const updateAccount = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const data = req.body;
    console.log("📤 updateAccount request:", { userId, data });

    const result = await KhachHangService.updateAccount(userId, data);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error in updateAccount:", err);
    return next(new ApiError(500, "Lỗi khi cập nhật tài khoản người dùng."));
  }
};

// [POST] /api/khachhang/login
export const login = async (req, res, next) => {
  try {
    const result = await KhachHangService.login(req.body);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error in login:", err);
    return next(new ApiError(500, "Lỗi khi đăng nhập."));
  }
};

// [POST] /api/khachhang/register
export const register = async (req, res, next) => {
  try {
    const result = await KhachHangService.register(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error("❌ Error in register:", err);
    return next(new ApiError(500, "Lỗi khi đăng ký tài khoản."));
  }
};

// [PATCH] /api/khachhang/change-password
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { currentPassword, newPassword } = req.body;
    const result = await KhachHangService.changePassword(userId, currentPassword, newPassword);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error in changePassword:", err);
    return next(new ApiError(500, "Lỗi khi đổi mật khẩu."));
  }
};

export default {
  getMyAccount,
  register,
  login,
  updateAccount,
  changePassword
};
