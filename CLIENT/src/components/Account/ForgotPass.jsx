import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import './ForgotPass.css';

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
    // Clear error when user types
    if (errors.email) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Call API gửi liên kết xác nhận
      // const response = await dispatch(sendResetLink(email));
      
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Sending reset link to:', email);
      setIsSuccess(true);
      
    } catch (error) {
      console.error('Reset password error:', error);
      setErrors({ general: 'Không tìm thấy tài khoản với email này!' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Call API gửi lại liên kết
      // const response = await dispatch(sendResetLink(email));
      
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Resending reset link to:', email);
      alert('Đã gửi lại liên kết đến email của bạn!');
      
    } catch (error) {
      console.error('Resend error:', error);
      setErrors({ general: 'Có lỗi xảy ra. Vui lòng thử lại!' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        {/* Header */}
        <div className="forgot-password-header">
          <Link to="/login" className="back-button">
            <ArrowLeft size={20} />
            <span>Quay lại đăng nhập</span>
          </Link>
          
          <div className="forgot-password-logo">
            <div className={`logo-circle ${isSuccess ? 'success' : ''}`}>
              {isSuccess ? <CheckCircle size={32} /> : <Mail size={32} />}
            </div>
          </div>
          
          <h1 className="forgot-password-title">
            {isSuccess ? 'Kiểm tra email của bạn' : 'Quên mật khẩu?'}
          </h1>
          
          <p className="forgot-password-subtitle">
            {isSuccess 
              ? `Chúng tôi đã gửi liên kết xác nhận đến ${email}. Vui lòng kiểm tra hộp thư và nhấn vào liên kết để đặt lại mật khẩu.`
              : 'Nhập địa chỉ email của bạn và chúng tôi sẽ gửi liên kết xác nhận để đặt lại mật khẩu'
            }
          </p>
        </div>

        {/* Form */}
        {!isSuccess ? (
          <form className="forgot-password-form" onSubmit={handleSubmit}>
            {/* General Error */}
            {errors.general && (
              <div className="alert-error">
                <AlertCircle size={20} />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="form-group">
              <label className="form-label">
                Địa chỉ Email <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Nhập địa chỉ email của bạn"
                  value={email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
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
                <>
                  <span className="spinner"></span>
                  <span>Đang gửi liên kết...</span>
                </>
              ) : (
                'Gửi liên kết xác nhận'
              )}
            </button>

            {/* Info Box */}
            <div className="info-box">
              <AlertCircle size={18} />
              <div>
                <p className="info-title">Lưu ý:</p>
                <ul className="info-list">
                  <li>Liên kết xác nhận sẽ được gửi qua email</li>
                  <li>Liên kết có hiệu lực trong vòng 10 phút</li>
                  <li>Kiểm tra cả thư mục spam nếu không thấy email</li>
                </ul>
              </div>
            </div>
          </form>
        ) : (
          <div className="success-content">
            <div className="success-message-box">
              <div className="success-icon">
                <CheckCircle size={48} />
              </div>
              <h3 className="success-message-title">Liên kết đã được gửi!</h3>
              <p className="success-message-text">
                Chúng tôi đã gửi email chứa liên kết đặt lại mật khẩu đến <strong>{email}</strong>
              </p>
              <p className="success-message-note">
                Vui lòng kiểm tra hộp thư đến của bạn và nhấn vào liên kết trong email để tiếp tục.
              </p>
            </div>

            <div className="success-actions">
              <button
                onClick={handleResend}
                disabled={isLoading}
                className={`secondary-btn ${isLoading ? 'disabled' : ''}`}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-small"></span>
                    <span>Đang gửi lại...</span>
                  </>
                ) : (
                  'Gửi lại liên kết'
                )}
              </button>
              
              <button
                onClick={() => navigate('/signin')}
                className="tertiary-btn"
              >
                Quay lại đăng nhập
              </button>
            </div>

            <div className="help-text">
              Không nhận được email? Kiểm tra thư mục spam hoặc thử{' '}
              <button 
                onClick={handleResend}
                disabled={isLoading}
                className="resend-link"
              >
                gửi lại liên kết
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}