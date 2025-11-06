import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Camera, Save, X, Lock, Edit2, Images } from 'lucide-react';
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
  
  // ✅ Kiểm tra loại file
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    alert('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)!');
    return;
  }
  
  // ✅ Kiểm tra kích thước (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Kích thước file không được vượt quá 5MB!');
    return;
  }
  
  const fd = new FormData();
  // ✅ Dùng đúng tên field
  fd.append(type === 'avatar' ? 'avatar' : 'cover', file);
  
  try {
    if (type === 'avatar') {
      await dispatch(uploadAvatar(fd)).unwrap();
      alert('Upload avatar thành công!');
    } else {
      await dispatch(uploadCover(fd)).unwrap();
      alert('Upload ảnh bìa thành công!');
    }
    
    // ✅ Reload thông tin user để hiển thị ảnh mới
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

  return (
    <>
      <Header />
      <div className={`myaccount-container ${isPhotographer ? 'grid-layout' : ''}`}>
        {/* Cột trái: Thông tin cá nhân */}
        <div className="myaccount-card">

          {/* Ảnh bìa */}
          <div className="cover-container">
            <img src={user?.CoverImage || '/default-cover.jpg'} alt="cover" className="cover-photo" />
            <label htmlFor="coverUpload" className="cover-upload-btn">
              <Camera size={22} /> Đổi ảnh bìa
            </label>
            <input type="file" id="coverUpload" hidden onChange={(e) => handleUpload(e, 'cover')} />
          </div>

          {/* Thông tin người dùng */}
          <div className="myaccount-header">
            <div className="profile-top">
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
          </div>

          {/* Form thông tin */}
          <div className="myaccount-content">
            <div className="form-grid">
              {['HoTen','Email','SoDienThoai','NgaySinh'].map(name => (
                <div className="form-group" key={name}>
                  <label>{name}</label>
                  {isEditing ? (
                    <input type={name==='NgaySinh'?'date':'text'} name={name} value={formData[name]} onChange={handleInputChange}/>
                  ) : (
                    <p>{name==='NgaySinh'?formatDate(user?.NgaySinh):user?.[name] || 'Chưa cập nhật'}</p>
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
                  <p>{user?.GioiTinh==='male'?'Nam':user?.GioiTinh==='female'?'Nữ':'Chưa cập nhật'}</p>
                )}
              </div>

              <div className="form-group full">
                <label>Địa chỉ</label>
                {isEditing ? (
                  <textarea name="DiaChi" value={formData.DiaChi} onChange={handleInputChange}/>
                ) : (
                  <p>{user?.DiaChi || 'Chưa cập nhật'}</p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="form-buttons">
              {isEditing ? (
                <>
                  <button className="submit-btn" onClick={handleSaveProfile}><Save size={18}/> Lưu</button>
                  <button className="cancel-btn" onClick={handleCancelEdit}><X size={18}/> Hủy</button>
                </>
              ) : (
                <button className="submit-btn" onClick={() => setIsEditing(true)}><Edit2 size={18}/> Cập nhật thông tin</button>
              )}
              <button className="submit-btn-alt" onClick={() => setShowChangePassword(!showChangePassword)}><Lock size={18}/> Đổi mật khẩu</button>
            </div>

            {showChangePassword && (
              <div className="password-group">
                <input type="password" name="currentPassword" placeholder="Mật khẩu hiện tại" value={passwordData.currentPassword} onChange={handlePasswordChange}/>
                <input type="password" name="newPassword" placeholder="Mật khẩu mới" value={passwordData.newPassword} onChange={handlePasswordChange}/>
                <input type="password" name="confirmPassword" placeholder="Xác nhận mật khẩu mới" value={passwordData.confirmPassword} onChange={handlePasswordChange}/>
                <div className="password-buttons">
                  <button className="submit-btn" onClick={handleChangePassword}>Xác nhận</button>
                  <button className="cancel-btn" onClick={() => setShowChangePassword(false)}>Hủy</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Hồ sơ tác phẩm (chỉ hiện với photographer) */}
        {isPhotographer && (
          <div className="portfolio-card">
            <div className="portfolio-header">
              <Images size={24}/> <h2>Hồ sơ tác phẩm của bạn</h2>
            </div>
            <div className="portfolio-gallery">
              {/* Giả lập hiển thị album ảnh */}
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="portfolio-item">
                  <img src={`/sample-albums/album${i}.jpg`} alt={`album ${i}`} />
                  <p>Album {i}</p>
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
