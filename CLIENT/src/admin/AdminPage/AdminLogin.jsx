import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, AlertCircle } from 'lucide-react';
import './AdminLogin.css';

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
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
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.message || 'Đăng nhập thất bại' });
        setIsLoading(false);
        return;
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminInfo', JSON.stringify(data.admin));

      setTimeout(() => {
        navigate('/admin-page');
      }, 700);
    } catch (err) {
      setErrors({ general: 'Lỗi kết nối server' });
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

          {/* Username */}
          <div className="admin-form-group">
            <label className="admin-form-label">
              Tên đăng nhập <span className="admin-required">*</span>
            </label>
            <div className="admin-input-wrapper">
              <Shield size={20} className="admin-input-icon" />
              <input
                type="text"
                name="username"
                placeholder="Nhập tên đăng nhập admin"
                value={formData.username}
                onChange={handleChange}
                className={`admin-form-input ${errors.username ? 'admin-input-error' : ''}`}
                autoComplete="username"
              />
            </div>
            {errors.username && <span className="admin-error-text">{errors.username}</span>}
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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="admin-password-toggle"
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
            <p className="admin-security-note">
              🔒 Trang quản trị dành riêng cho admin
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;