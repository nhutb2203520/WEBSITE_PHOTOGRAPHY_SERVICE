import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/Slices/authSlice';
import './SignIn.css';

// Import MainLayout
import MainLayout from '../../layouts/MainLayout/MainLayout';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    identifier: '', // username/email/phone
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Xóa lỗi khi người dùng bắt đầu gõ lại
    if (errors[name] || errors.general) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
        general: '' // Xóa luôn lỗi chung nếu có
      }));
    }
  };

  // Validate form trước khi submit
  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Vui lòng nhập username, email hoặc số điện thoại';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Gọi Redux action đăng nhập
      // unwrap() giúp bắt lỗi trực tiếp từ rejectWithValue của Slice
      const result = await dispatch(login(formData)).unwrap();

      // Nếu thành công
      toast.success('Đăng nhập thành công!');
      console.log('Login success:', result);

      // Điều hướng về trang chủ
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);

      // 🔥 QUAN TRỌNG: Hiển thị đúng thông báo lỗi từ Backend trả về
      // Nếu Backend trả về: "Tài khoản của bạn đã bị KHÓA..." -> Toast sẽ hiện đúng dòng đó
      const errorMessage = error?.message || error || "Tên đăng nhập hoặc mật khẩu không đúng!";
      
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-circle">
                <User size={32} />
              </div>
            </div>
            <h1 className="login-title">Đăng nhập</h1>
            <p className="login-subtitle">Chào mừng bạn quay trở lại!</p>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Hiển thị lỗi chung (Ví dụ: Tài khoản bị khóa) */}
            {errors.general && (
              <div className="alert-error">
                <AlertCircle size={20} />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="form-group">
              <label className="form-label">
                Username / Email / Số điện thoại <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <User size={20} className="input-icon" />
                <input
                  type="text"
                  name="identifier"
                  placeholder="Nhập username, email hoặc số điện thoại"
                  value={formData.identifier}
                  onChange={handleChange}
                  className={`form-input ${errors.identifier ? 'input-error' : ''}`}
                  autoComplete="username"
                />
              </div>
              {errors.identifier && <span className="error-text">{errors.identifier}</span>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">
                Mật khẩu <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  tabIndex="-1" // Tránh focus khi nhấn Tab
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* Options: Remember Me & Forgot Password */}
            <div className="form-options">
              <label className="checkbox-container">
                {/* Bạn có thể thêm checkbox Remember Me tại đây nếu cần */}
              </label>
              
              <Link to="/forgot-password" className="forgot-link">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`submit-btn ${isLoading ? 'disabled' : ''}`}
            >
              {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>

            {/* Footer Link */}
            <div className="form-footer">
              Chưa có tài khoản?{' '}
              <Link to="/signup" className="footer-link">
                Đăng ký ngay
              </Link>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}