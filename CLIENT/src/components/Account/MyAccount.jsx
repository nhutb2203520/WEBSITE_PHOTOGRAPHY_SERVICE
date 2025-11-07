import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Camera, Save, X, Lock, Edit2, Images, Star } from 'lucide-react';
import {
  getInfoUser, updateProfile, changePassword, uploadAvatar, uploadCover
} from '../../redux/Slices/userSlice';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './MyAccount.css';

export default function MyAccount() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector(state => state.user);

  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [formData, setFormData] = useState({
    HoTen: '', Email: '', SoDienThoai: '', NgaySinh: '', GioiTinh: '', DiaChi: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  useEffect(() => { dispatch(getInfoUser()); }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        HoTen: user.HoTen || '',
        Email: user.Email || '',
        SoDienThoai: user.SoDienThoai || '',
        NgaySinh: user.NgaySinh ? new Date(user.NgaySinh).toISOString().split('T')[0] : '',
        GioiTinh: user.GioiTinh || '',
        DiaChi: user.DiaChi || ''
      });
    }
  }, [user]);

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChange = e => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const normalizeDateString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const isValueChanged = (newVal, oldVal, fieldName) => {
    if (newVal === null || newVal === undefined || newVal === '') return false;
    if (fieldName === 'NgaySinh') {
      const normalizedNew = normalizeDateString(newVal);
      const normalizedOld = normalizeDateString(oldVal);
      return normalizedNew !== normalizedOld && normalizedNew !== '';
    }
    const newValue = typeof newVal === 'string' ? newVal.trim() : newVal;
    const oldValue = typeof oldVal === 'string' ? oldVal.trim() : oldVal;
    return newValue !== oldValue;
  };

  const handleSaveProfile = async () => {
    if (!isEditing) return setIsEditing(true);
    if (!user?._id) return alert('Thông tin người dùng chưa load xong!');
    try {
      const updateData = {};
      const fields = ['HoTen', 'Email', 'SoDienThoai', 'NgaySinh', 'GioiTinh', 'DiaChi'];
      fields.forEach(k => {
        if (isValueChanged(formData[k], user[k], k)) updateData[k] = formData[k];
      });
      if (Object.keys(updateData).length === 0) return alert('Bạn chưa thay đổi thông tin nào.');
      await dispatch(updateProfile({ id: user._id, ...updateData })).unwrap();
      setIsEditing(false);
      dispatch(getInfoUser());
    } catch (err) {
      alert(err?.message || 'Cập nhật hồ sơ thất bại!');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (!user) return;
    setFormData({
      HoTen: user.HoTen || '',
      Email: user.Email || '',
      SoDienThoai: user.SoDienThoai || '',
      NgaySinh: user.NgaySinh ? new Date(user.NgaySinh).toISOString().split('T')[0] : '',
      GioiTinh: user.GioiTinh || '',
      DiaChi: user.DiaChi || ''
    });
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword)
      return alert('Mật khẩu xác nhận không khớp!');
    try {
      await dispatch(changePassword(passwordData)).unwrap();
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
    } catch (err) {
      alert(err?.message || 'Đổi mật khẩu thất bại!');
    }
  };

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) return alert('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)!');
    if (file.size > 5 * 1024 * 1024) return alert('Kích thước file không được vượt quá 5MB!');
    const fd = new FormData();
    fd.append(type === 'avatar' ? 'avatar' : 'cover', file);
    try {
      if (type === 'avatar') {
        await dispatch(uploadAvatar(fd)).unwrap();
        alert('Upload avatar thành công!');
      } else {
        await dispatch(uploadCover(fd)).unwrap();
        alert('Upload ảnh bìa thành công!');
      }
      await dispatch(getInfoUser());
    } catch (err) {
      console.error('❌ Upload error:', err);
      alert(err?.message || 'Upload thất bại!');
    }
  };

  const formatDate = (d) => {
    if (!d) return 'Chưa cập nhật';
    const date = new Date(d);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) return <div className="myaccount-container"><p>Đang tải...</p></div>;

  const isPhotographer = user?.isPhotographer;

  // ✅ Giả lập dữ liệu portfolio dạng card
  const mockPortfolio = [
    { id: 1, title: "Gói Chụp Cưới", rating: 4.9, reviews: 45, price: 300, services: 5, image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800" },
    { id: 2, title: "Chụp Ngoại Cảnh", rating: 4.8, reviews: 38, price: 250, services: 4, image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800" },
    { id: 3, title: "Lookbook Fashion", rating: 5.0, reviews: 52, price: 280, services: 6, image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800" },
    { id: 4, title: "Ảnh Gia Đình", rating: 4.7, reviews: 29, price: 200, services: 3, image: "https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=800" },
    { id: 5, title: "Ảnh Nghệ Thuật Studio", rating: 4.9, reviews: 41, price: 350, services: 5, image: "https://images.unsplash.com/photo-1600525831163-04307d4d2b9b?w=800" },
  ];

  return (
    <>
      <Header />
      <div className={`myaccount-container ${isPhotographer ? 'grid-layout' : ''}`}>
        <div className="myaccount-card">
          {/* Ảnh bìa */}
          <div className="cover-container">
            <img src={user?.CoverImage || '/default-cover.jpg'} alt="cover" className="cover-photo" />
            <label htmlFor="coverUpload" className="cover-upload-btn">
              <Camera size={22} /> Đổi ảnh bìa
            </label>
            <input type="file" id="coverUpload" hidden onChange={(e) => handleUpload(e, 'cover')} />
          </div>

          {/* Thông tin cá nhân */}
          <div className="myaccount-header">
            <div className="avatar-wrapper">
              <img src={user?.Avatar || '/default-avatar.png'} alt="avatar" className="avatar-circle-img" />
              <label htmlFor="avatarUpload" className="avatar-camera"><Camera size={20} /></label>
              <input type="file" id="avatarUpload" hidden onChange={(e) => handleUpload(e, 'avatar')} />
            </div>
            <div className="profile-info">
              <h1>{user?.HoTen || 'Chưa cập nhật'}</h1>
              <p>@{user?.TenDangNhap}</p>
            </div>
          </div>

          {/* Form thông tin */}
          <div className="myaccount-content">
            <div className="form-grid">
              {['HoTen', 'Email', 'SoDienThoai', 'NgaySinh'].map(name => (
                <div className="form-group" key={name}>
                  <label>{name}</label>
                  {isEditing ? (
                    <input type={name === 'NgaySinh' ? 'date' : 'text'} name={name} value={formData[name]} onChange={handleInputChange} />
                  ) : (
                    <p>{name === 'NgaySinh' ? formatDate(user?.NgaySinh) : user?.[name] || 'Chưa cập nhật'}</p>
                  )}
                </div>
              ))}
              <div className="form-group">
                <label>Giới tính</label>
                {isEditing ? (
                  <select name="GioiTinh" value={formData.GioiTinh} onChange={handleInputChange}>
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                ) : (
                  <p>{user?.GioiTinh === 'male' ? 'Nam' : user?.GioiTinh === 'female' ? 'Nữ' : 'Chưa cập nhật'}</p>
                )}
              </div>

              <div className="form-group full">
                <label>Địa chỉ</label>
                {isEditing ? (
                  <textarea name="DiaChi" value={formData.DiaChi} onChange={handleInputChange} />
                ) : (
                  <p>{user?.DiaChi || 'Chưa cập nhật'}</p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="form-buttons">
              {isEditing ? (
                <>
                  <button className="submit-btn" onClick={handleSaveProfile}><Save size={18} /> Lưu</button>
                  <button className="cancel-btn" onClick={handleCancelEdit}><X size={18} /> Hủy</button>
                </>
              ) : (
                <button className="submit-btn" onClick={() => setIsEditing(true)}><Edit2 size={18} /> Cập nhật thông tin</button>
              )}
              <button className="submit-btn-alt" onClick={() => setShowChangePassword(!showChangePassword)}><Lock size={18} /> Đổi mật khẩu</button>
            </div>

            {showChangePassword && (
              <div className="password-group">
                <input type="password" name="currentPassword" placeholder="Mật khẩu hiện tại" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                <input type="password" name="newPassword" placeholder="Mật khẩu mới" value={passwordData.newPassword} onChange={handlePasswordChange} />
                <input type="password" name="confirmPassword" placeholder="Xác nhận mật khẩu mới" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
                <div className="password-buttons">
                  <button className="submit-btn" onClick={handleChangePassword}>Xác nhận</button>
                  <button className="cancel-btn" onClick={() => setShowChangePassword(false)}>Hủy</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hồ sơ tác phẩm */}
        {isPhotographer && (
          <div className="portfolio-card">
            <div className="portfolio-header">
              <Images size={24} /> <h2>Hồ sơ tác phẩm của bạn</h2>
            </div>
            <div className="portfolio-gallery">
              {mockPortfolio.map(item => (
                <div key={item.id} className="portfolio-item">
                  <div className="portfolio-img-wrapper">
                    <img src={item.image} alt={item.title} />
                  </div>
                  <div className="portfolio-body">
                    <h4>{item.title}</h4>
                    <button className="detail-btn">Xem chi tiết</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
