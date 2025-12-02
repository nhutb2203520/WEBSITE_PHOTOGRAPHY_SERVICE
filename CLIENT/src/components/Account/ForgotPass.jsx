import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import authApi from '../../apis/authUser';
import './ForgotPass.css';

// ✅ Import MainLayout
import MainLayout from '../../layouts/MainLayout/MainLayout';

// ❌ Đã xóa import Header, Footer riêng lẻ

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email || errors.general) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- XỬ LÝ GỬI API ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({}); 

    try {
      // Gọi API từ authApi
      const response = await authApi.forgotPassword({ identifier: email });
      
      console.log('API Response:', response);
      toast.success(response.message || "Đã gửi mail xác nhận!");
      setIsSuccess(true);
      
    } catch (error) {
      console.error('Reset password error:', error);
      
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- XỬ LÝ GỬI LẠI (RESEND) ---
  const handleResend = async () => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ identifier: email });
      toast.success('Đã gửi lại liên kết đến email của bạn!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể gửi lại email.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ✅ Bọc trong MainLayout
    <MainLayout>
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          {/* Header */}
          <div className="forgot-password-header">
            {!isSuccess && (
              <Link to="/signin" className="back-button">
                <ArrowLeft size={20} />
                <span>Quay lại đăng nhập</span>
              </Link>
            )}
            
            <div className="forgot-password-logo">
              <div className={`logo-circle ${isSuccess ? 'success' : ''}`}>
                {isSuccess ? <CheckCircle size={32} /> : <Mail size={32} />}
              </div>
            </div>
            
            <h1 className="forgot-password-title">
              {isSuccess ? 'Kiểm tra email của bạn' : 'Quên mật khẩu?'}
            </h1>
            
            <div className="forgot-password-subtitle">
              {isSuccess 
                ? <span>Chúng tôi đã gửi liên kết xác nhận đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư (cả mục Spam) và nhấn vào liên kết để đặt lại mật khẩu.</span>
                : 'Nhập địa chỉ email của bạn và chúng tôi sẽ gửi liên kết xác nhận để đặt lại mật khẩu.'
              }
            </div>
          </div>

          {/* Form */}
          {!isSuccess ? (
            <form className="forgot-password-form" onSubmit={handleSubmit}>
              {/* General Error Alert */}
              {errors.general && (
                <div className="alert-error-box">
                  <AlertCircle size={18} />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="form-group">
                <label className="form-label">
                  Địa chỉ Email <span className="required">*</span>
                </label>
                <div className={`input-wrapper ${errors.email ? 'error-border' : ''}`}>
                  <Mail size={20} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Nhập địa chỉ email của bạn"
                    value={email}
                    onChange={handleChange}
                    className="form-input"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`submit-btn ${isLoading ? 'disabled' : ''}`}
              >
                {isLoading ? (
                  <div className="loading-content">
                    <span className="spinner"></span>
                    <span>Đang gửi...</span>
                  </div>
                ) : (
                  'Gửi liên kết xác nhận'
                )}
              </button>

              {/* Info Box */}
              <div className="info-box">
                <AlertCircle size={18} className="info-icon" />
                <div>
                  <p className="info-title">Lưu ý:</p>
                  <ul className="info-list">
                    <li>Liên kết có hiệu lực trong vòng 15 phút.</li>
                    <li>Nếu không thấy email, hãy kiểm tra mục Spam/Junk.</li>
                  </ul>
                </div>
              </div>
            </form>
          ) : (
            <div className="success-content">
              <div className="success-actions">
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="secondary-btn"
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi lại liên kết'}
                </button>
                
                <button
                  onClick={() => navigate('/signin')}
                  className="tertiary-btn"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}