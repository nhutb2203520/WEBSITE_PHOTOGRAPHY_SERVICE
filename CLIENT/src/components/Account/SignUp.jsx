import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Eye, EyeOff, User, Mail, Phone, Calendar,
  Users, Lock, Camera, AlertCircle
} from 'lucide-react';
import { registerUser, clearError } from '../../redux/Slices/authSlice';
import { toast } from 'react-toastify';
import './SignUp.css';

// ✅ Import MainLayout
import MainLayout from '../../layouts/MainLayout/MainLayout';

// ❌ Đã xóa import Header, Footer lẻ tẻ

export default function RegisterCustomer() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, error, isSuccess } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    password: '',
    confirmPassword: '',
    isPhotographer: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Xóa lỗi khi unmount
  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  // ✅ Hiển thị Toast khi đăng ký thành công
  useEffect(() => {
    if (isSuccess) {
      toast.success('🎉 Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', {
        position: 'top-right',
        autoClose: 3000,
        theme: 'colored',
      });
      setTimeout(() => navigate('/signin'), 3500);
    }
  }, [isSuccess, navigate]);

  // ✅ Hiển thị Toast & lỗi cụ thể khi có lỗi từ backend
  useEffect(() => {
    if (error) {
      const message = typeof error === 'string' ? error : error.message || 'Đã xảy ra lỗi.';

      toast.error(message, {
        position: 'top-right',
        autoClose: 3000,
        theme: 'colored',
      });

      // Hiển thị lỗi ngay tại input tương ứng
      if (message.includes('Email')) {
        setErrors((prev) => ({ ...prev, email: message }));
      } else if (message.includes('Tên đăng nhập') || message.includes('username')) {
        setErrors((prev) => ({ ...prev, username: message }));
      } else if (message.includes('Số điện thoại')) {
        setErrors((prev) => ({ ...prev, phone: message }));
      }
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Xóa lỗi khi người dùng nhập lại
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) dispatch(clearError());
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username không được để trống';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username phải có ít nhất 3 ký tự';
    }

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Họ tên không được để trống';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^0\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Ngày sinh không được để trống';
    }

    if (!formData.gender) {
      newErrors.gender = 'Vui lòng chọn giới tính';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { confirmPassword, ...dataToSend } = formData;
    dispatch(registerUser(dataToSend));
  };

  return (
    // ✅ Bọc trong MainLayout
    <MainLayout>
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <h1 className="register-title">Đăng ký tài khoản</h1>
            <p className="register-subtitle">Tạo tài khoản để trải nghiệm dịch vụ của chúng tôi</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            {error && !Object.keys(errors).length && (
              <div className="alert-error">
                <AlertCircle size={20} />
                <span>{typeof error === 'string' ? error : error.message}</span>
              </div>
            )}

            <div className="form-grid">
              {/* Username */}
              <div className="form-group">
                <label className="form-label">Username <span className="required">*</span></label>
                <div className="input-wrapper">
                  <User size={20} className="input-icon" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Nhập username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`form-input ${errors.username ? 'input-error' : ''}`}
                  />
                </div>
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              {/* Họ và tên */}
              <div className="form-group">
                <label className="form-label">Họ và tên <span className="required">*</span></label>
                <div className="input-wrapper">
                  <User size={20} className="input-icon" />
                  <input
                    type="text"
                    name="fullname"
                    placeholder="Nhập họ và tên"
                    value={formData.fullname}
                    onChange={handleChange}
                    className={`form-input ${errors.fullname ? 'input-error' : ''}`}
                  />
                </div>
                {errors.fullname && <span className="error-text">{errors.fullname}</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Mail size={20} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                  />
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              {/* Số điện thoại */}
              <div className="form-group">
                <label className="form-label">Số điện thoại <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Phone size={20} className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="0123456789"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`form-input ${errors.phone ? 'input-error' : ''}`}
                  />
                </div>
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              {/* Ngày sinh */}
              <div className="form-group">
                <label className="form-label">Ngày sinh <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Calendar size={20} className="input-icon" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`form-input ${errors.dateOfBirth ? 'input-error' : ''}`}
                  />
                </div>
                {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
              </div>

              {/* Giới tính */}
              <div className="form-group">
                <label className="form-label">Giới tính <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Users size={20} className="input-icon" />
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`form-select ${errors.gender ? 'input-error' : ''}`}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                {errors.gender && <span className="error-text">{errors.gender}</span>}
              </div>

              {/* Mật khẩu */}
              <div className="form-group">
                <label className="form-label">Mật khẩu <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Lock size={20} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
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

              {/* Xác nhận mật khẩu */}
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Lock size={20} className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              {/* Photographer Option */}
              <div className={`photographer-section ${formData.isPhotographer ? 'active' : ''}`}>
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    id="isPhotographer"
                    name="isPhotographer"
                    checked={formData.isPhotographer}
                    onChange={handleChange}
                    className="photographer-checkbox"
                  />
                  <label htmlFor="isPhotographer" className="checkbox-label">
                    <Camera size={20} color="#9333ea" /> Tôi muốn đăng ký làm Photographer
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className={`submit-btn ${isLoading ? 'disabled' : ''}`}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  <span>Đang đăng ký...</span>
                </>
              ) : (
                'Đăng ký'
              )}
            </button>

            <div className="form-footer">
              Đã có tài khoản?{' '}
              <Link to="/signin" className="footer-link">Đăng nhập ngay</Link>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}