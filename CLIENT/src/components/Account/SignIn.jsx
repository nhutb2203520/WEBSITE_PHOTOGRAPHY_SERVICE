import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/Slices/authSlice';
import './SignIn.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
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
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // ✅ Gọi API hoặc Redux action đăng nhập
      const result = await dispatch(login(formData)).unwrap();

      // Nếu login thành công
      toast.success('Đăng nhập thành công!');
      console.log('Login success:', result);

      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);

      // Hiển thị thông báo lỗi
      if (error?.message) {
        toast.error(error.message);
        setErrors({ general: error.message });
      } else {
        toast.error('Tên đăng nhập hoặc mật khẩu không đúng!');
        setErrors({ general: 'Tên đăng nhập hoặc mật khẩu không đúng!' });
      }
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
     <>
    <Header />
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
          {errors.general && (
            <div className="alert-error">
              <AlertCircle size={20} />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Username */}
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

          {/* Password */}
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
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {/* Remember Me */}
          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox"
              />
              <span className="checkbox-label">Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={`submit-btn ${isLoading ? 'disabled' : ''}`}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          {/* Register Link */}
          <div className="form-footer">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="footer-link">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
     <Footer />
    </>
  );
 
}
