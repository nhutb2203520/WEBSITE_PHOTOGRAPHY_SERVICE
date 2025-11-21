import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import adminAuthService from '../../apis/adminAuthService';
import './AdminLogin.css';

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    loginKey: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Kiểm tra nếu đã đăng nhập → redirect
  useEffect(() => {
    if (adminAuthService.isAuthenticated()) {
      console.log('ℹ️ Already authenticated, redirecting to admin page');
      navigate('/admin-page');
    }
  }, [navigate]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.loginKey.trim()) {
      newErrors.loginKey = 'Vui lòng nhập tên đăng nhập, email hoặc số điện thoại';
    }
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      console.log('🔐 Attempting login...');
      
      const result = await adminAuthService.login(formData.loginKey, formData.password);
      
      console.log('✅ Login successful:', result);
      
      toast.success('Đăng nhập thành công!');
      
      // ✅ Redirect về trang admin-page (có trong routes)
      setTimeout(() => {
        navigate('/admin-page');
      }, 500);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMsg = error.message || 'Đăng nhập thất bại';
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        {/* Header */}
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <div className="admin-logo-circle">
              <Shield size={32} />
            </div>
          </div>
          <h1 className="admin-login-title">Đăng nhập Admin</h1>
          <p className="admin-login-subtitle">Hệ thống quản trị website</p>
        </div>

        {/* Form */}
        <form className="admin-login-form" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="admin-alert-error">
              <AlertCircle size={20} />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Username / Email / Phone */}
          <div className="admin-form-group">
            <label className="admin-form-label">
              Tên đăng nhập / Email / SĐT <span className="admin-required">*</span>
            </label>
            <div className="admin-input-wrapper">
              <Shield size={20} className="admin-input-icon" />
              <input
                type="text"
                name="loginKey"
                placeholder="Nhập username, email hoặc số điện thoại"
                value={formData.loginKey}
                onChange={handleChange}
                className={`admin-form-input ${errors.loginKey ? 'admin-input-error' : ''}`}
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            {errors.loginKey && <span className="admin-error-text">{errors.loginKey}</span>}
          </div>

          {/* Password */}
          <div className="admin-form-group">
            <label className="admin-form-label">
              Mật khẩu <span className="admin-required">*</span>
            </label>
            <div className="admin-input-wrapper">
              <Lock size={20} className="admin-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                className={`admin-form-input ${errors.password ? 'admin-input-error' : ''}`}
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="admin-password-toggle"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <span className="admin-error-text">{errors.password}</span>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={`admin-submit-btn ${isLoading ? 'admin-disabled' : ''}`}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>

          {/* Footer */}
          <div className="admin-form-footer">
            <p className="admin-security-note">🔒 Trang quản trị dành riêng cho admin</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;