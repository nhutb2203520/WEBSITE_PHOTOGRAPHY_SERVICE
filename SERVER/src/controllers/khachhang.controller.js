import ApiError from "../ApiError.js";
import KhachHangService from "../services/khachhang.service.js";

// [GET] /customers/me hoặc /api/my-profile
export const getMyAccount = async (req, res, next) => {
  try {
    // ✅ Lấy id từ req.user
    const userId = req.user.id || req.user._id;
    
    const result = await KhachHangService.getMyAccount(userId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error in getMyAccount:", err);
    return next(new ApiError(500, "Lỗi khi lấy thông tin tài khoản người dùng."));
  }
};

// Các hàm khác giữ nguyên...
export const register = async (req, res, next) => {
  try {
    const data = req.body;
    const khachHangService = new KhachHangService();
    const result = await khachHangService.register(data);
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return next(new ApiError(500, "Lỗi khi người dùng đăng ký tài khoản."));
  }
};

export const login = async (req, res, next) => {
  try {
    const data = req.body;
    const khachHangService = new KhachHangService();
    const result = await khachHangService.login(data);
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return next(new ApiError(500, "Lỗi khi người dùng đăng nhập."));
  }
};

export const updateAccount = async (req, res, next) => {
  try {
    const customer = req.user;
    const data = req.body;
    const khachHangService = new KhachHangService();
    const result = await khachHangService.updateAccount(customer._id, data);
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return next(new ApiError(500, "Lỗi khi cập nhật tài khoản người dùng."));
  }
};

export const deleteMyAccount = async (req, res, next) => {
  try {
    const customer = req.user;
    const khachHangService = new KhachHangService();
    const result = await khachHangService.deleteAccount(customer._id);
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return next(new ApiError(500, "Lỗi khi xóa tài khoản người dùng."));
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const customer = req.user;
    const { currentPassword, newPassword } = req.body;
    const khachHangService = new KhachHangService();
    const result = await khachHangService.changePassword(
      customer._id,
      currentPassword,
      newPassword
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return next(new ApiError(500, "Lỗi khi đổi mật khẩu."));
  }
};

export default {
  getMyAccount,
  register,
  login,
  updateAccount,
  deleteMyAccount,
  changePassword,
};