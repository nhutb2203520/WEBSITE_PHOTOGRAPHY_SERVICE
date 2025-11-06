import AuthService from "../services/auth.service.js";
import ApiError from "../ApiError.js";
// --- Đăng ký ---
export const register = async (req, res) => {
  try {
    const result = await AuthService.register(req.body);
    return res.status(201).json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (err) {
    console.error("❌ Lỗi đăng ký:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message || "Lỗi khi đăng ký người dùng.",
    });
  }
};

// --- Đăng nhập ---
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const result = await AuthService.login(identifier, password);
    return res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message || "Lỗi khi đăng nhập.",
    });
  }
};
// --- Quên mật khẩu ---
export const forgotPassword = async (req, res, next) => {
  try {
    const result = await AuthService.requestResetPassword(req.body.identifier);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi quên mật khẩu:", err.message);

    if (err.message.includes("Không tìm thấy"))
      return next(new ApiError(404, "Không tìm thấy người dùng."));
    return next(new ApiError(500, err.message || "Lỗi khi yêu cầu đặt lại mật khẩu."));
  }
};

// --- Đặt lại mật khẩu ---
export const resetPassword = async (req, res, next) => {
  try {
    const result = await AuthService.resetPassword(req.params.token, req.body.Password);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi đặt lại mật khẩu:", err.message);

    if (err.message.includes("Token không hợp lệ"))
      return next(new ApiError(400, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."));

    return next(new ApiError(500, "Lỗi khi đặt lại mật khẩu."));
  }
};

// --- Làm mới token ---
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshAccessToken(refreshToken);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi refresh token:", err.message);

    if (err.message.includes("Refresh token không hợp lệ"))
      return next(new ApiError(401, "Refresh token không hợp lệ hoặc đã hết hạn."));

    return next(new ApiError(500, "Lỗi khi làm mới token."));
  }
};

export default {
  register,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
};
