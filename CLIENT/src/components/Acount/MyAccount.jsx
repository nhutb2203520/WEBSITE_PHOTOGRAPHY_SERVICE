import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Edit2,
  Save,
  Lock
} from 'lucide-react';
import {
  getInfoUser,
  updateProfile,
  changePassword,
  uploadAvatar,
  uploadCover
} from '../../redux/Slices/userSlice';
import './MyAccount.css';

export default function CustomerProfile() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [formData, setFormData] = useState({
    HoTen: '',
    Email: '',
    SoDienThoai: '',
    NgaySinh: '',
    GioiTinh: '',
    DiaChi: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    dispatch(getInfoUser());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        HoTen: user.HoTen || '',
        Email: user.Email || '',
        SoDienThoai: user.SoDienThoai || '',
        NgaySinh: user.NgaySinh
          ? new Date(user.NgaySinh).toISOString().split('T')[0]
          : '',
        GioiTinh: user.GioiTinh || '',
        DiaChi: user.DiaChi || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePasswordChange = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleEditToggle = () => {
    // Chuyển đổi giữa chế độ chỉnh sửa và lưu
    if (isEditing) {
      dispatch(updateProfile(formData));
    }
    setIsEditing(!isEditing);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    dispatch(
      changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
    );
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowChangePassword(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Upload ảnh đại diện và ảnh bìa
  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    if (type === 'avatar') {
      await dispatch(uploadAvatar(formData));
    } else if (type === 'cover') {
      await dispatch(uploadCover(formData));
    }

    setTimeout(() => {
      dispatch(getInfoUser());
    }, 300);
  };

  if (loading) {
    return (
      <div className="myaccount-container">
        <div className="loading-card">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-center">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="myaccount-container">
      <div className="myaccount-card">
        {/* ẢNH BÌA */}
        <div className="cover-container">
          <img
            src={user?.CoverImage || '/default-cover.jpg'}
            alt="Ảnh bìa"
            className="cover-photo"
          />
          <label htmlFor="coverUpload" className="cover-upload-btn">
            <Camera size={22} /> Đổi ảnh bìa
          </label>
          <input
            type="file"
            id="coverUpload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleUpload(e, 'cover')}
          />
        </div>

        {/* Header */}
        <div className="myaccount-header">
          <div className="profile-top">
            <div className="avatar-wrapper">
              <img
                src={user?.Avatar || '/default-avatar.png'}
                alt="Avatar"
                className="avatar-circle-img"
              />
              <label htmlFor="avatarUpload" className="avatar-camera">
                <Camera size={20} />
              </label>
              <input
                type="file"
                id="avatarUpload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleUpload(e, 'avatar')}
              />
            </div>

            <div className="profile-info">
              <h1>{formData.HoTen || 'Chưa cập nhật'}</h1>
              <p>@{user?.TenDangNhap || 'username'}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="myaccount-content two-columns">
          <div className="form-grid">
            {[
              { label: 'Họ và tên', name: 'HoTen', type: 'text' },
              { label: 'Email', name: 'Email', type: 'email' },
              { label: 'Số điện thoại', name: 'SoDienThoai', type: 'tel' },
              { label: 'Ngày sinh', name: 'NgaySinh', type: 'date' }
            ].map(({ label, name, type }) => (
              <div className="form-group" key={name}>
                <label>{label}</label>
                {isEditing ? (
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>
                    {name === 'NgaySinh'
                      ? formatDate(user?.NgaySinh)
                      : user?.[name] || 'Chưa cập nhật'}
                  </p>
                )}
              </div>
            ))}

            <div className="form-group">
              <label>Giới tính</label>
              {isEditing ? (
                <select
                  name="GioiTinh"
                  value={formData.GioiTinh}
                  onChange={handleInputChange}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              ) : (
                <p>
                  {user?.GioiTinh === 'male'
                    ? 'Nam'
                    : user?.GioiTinh === 'female'
                    ? 'Nữ'
                    : 'Khác'}
                </p>
              )}
            </div>

            <div className="form-group full">
              <label>Địa chỉ</label>
              {isEditing ? (
                <textarea
                  name="DiaChi"
                  value={formData.DiaChi}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{user?.DiaChi || 'Chưa cập nhật'}</p>
              )}
            </div>
          </div>

          {/* Nút hành động */}
          <div className="form-buttons">
            <button className="submit-btn" onClick={handleEditToggle}>
              {isEditing ? (
                <>
                  <Save size={20} /> Lưu thông tin
                </>
              ) : (
                <>
                  <Edit2 size={20} /> Cập nhật thông tin
                </>
              )}
            </button>

            <button
              className="submit-btn-alt"
              onClick={() => setShowChangePassword(!showChangePassword)}
            >
              <Lock size={20} /> Đổi mật khẩu
            </button>
          </div>

          {/* Form đổi mật khẩu */}
          {showChangePassword && (
            <div className="password-group">
              <input
                type="password"
                name="currentPassword"
                placeholder="Mật khẩu hiện tại"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
              />
              <input
                type="password"
                name="newPassword"
                placeholder="Mật khẩu mới"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Xác nhận mật khẩu mới"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
              />
              <div className="password-buttons">
                <button className="submit-btn" onClick={handleChangePassword}>
                  Xác nhận
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setShowChangePassword(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
