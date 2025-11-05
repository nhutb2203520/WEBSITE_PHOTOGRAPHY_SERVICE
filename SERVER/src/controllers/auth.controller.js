import AuthService from "../services/auth.service.js";
import ApiError from "../ApiError.js";

// --- Đăng ký ---
export const register = async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error("❌ Lỗi đăng ký:", err.message);
    next(new ApiError(500, err.message || "Lỗi khi đăng ký người dùng."));
  }
};

// --- Đăng nhập ---
export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const result = await AuthService.login(identifier, password);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err.message);
    next(new ApiError(500, err.message || "Lỗi khi đăng nhập."));
  }
};

// --- Quên mật khẩu ---
export const forgotPassword = async (req, res, next) => {
  try {
    const result = await AuthService.requestResetPassword(req.body.identifier);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi quên mật khẩu:", err.message);
    next(new ApiError(500, err.message));
  }
};

// --- Đặt lại mật khẩu ---
export const resetPassword = async (req, res, next) => {
  try {
    const result = await AuthService.resetPassword(req.params.token, req.body.Password);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi đặt lại mật khẩu:", err.message);
    next(new ApiError(500, err.message));
  }
};

// --- Làm mới token ---
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi refresh token:", err.message);
    next(new ApiError(500, err.message));
  }
};

export default { register, login, forgotPassword, resetPassword, refreshToken };
