import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import authApi from "../../apis/authUser";
import "./ResetPassword.css";

// ✅ Import MainLayout
import MainLayout from "../../layouts/MainLayout/MainLayout";

const ResetPassword = () => {
  // Lấy token từ URL (được định nghĩa trong route /reset-password/:token)
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Kiểm tra nếu không có token thì đẩy về trang chủ
  useEffect(() => {
    if (!token) {
      toast.error("Liên kết không hợp lệ!");
      navigate("/");
    }
  }, [token, navigate]);

  const validateForm = () => {
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Gọi API resetPassword
      const dataPayload = {
        token: token,
        Password: password 
      };

      const res = await authApi.resetPassword(dataPayload);
      
      setIsSuccess(true);
      toast.success("Đặt lại mật khẩu thành công!");
      
      // Tự động chuyển về trang đăng nhập sau 3 giây
      setTimeout(() => {
        navigate("/signin");
      }, 3000);

    } catch (err) {
      console.error("Reset password error:", err);
      const msg = err.response?.data?.message || "Liên kết đã hết hạn hoặc không hợp lệ.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ✅ Bọc trong MainLayout để có Header/Sidebar/Footer
    <MainLayout>
      <div className="reset-password-container">
        <div className="reset-password-card">
          {/* Header */}
          <div className="reset-header">
            <div className={`icon-circle ${isSuccess ? "success" : ""}`}>
              {isSuccess ? <CheckCircle size={32} /> : <Lock size={32} />}
            </div>
            <h2 className="reset-title">
              {isSuccess ? "Thành công!" : "Đặt lại mật khẩu"}
            </h2>
            <p className="reset-subtitle">
              {isSuccess
                ? "Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng đến trang đăng nhập..."
                : "Vui lòng nhập mật khẩu mới cho tài khoản của bạn."}
            </p>
          </div>

          {/* Success View */}
          {isSuccess ? (
            <div className="success-action">
               <button onClick={() => navigate("/signin")} className="btn-submit">
                 Đăng nhập ngay
               </button>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="reset-form">
              {error && (
                <div className="alert-error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Mật khẩu mới */}
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="loading-dots">Đang xử lý...</span>
                ) : (
                  "Xác nhận thay đổi"
                )}
              </button>
              
              <div className="back-link">
                <Link to="/signin">
                  <ArrowLeft size={16} /> Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ResetPassword;