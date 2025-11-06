import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Camera, Save, X, Lock, Edit2 } from 'lucide-react';
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

  // Hàm helper để chuẩn hóa date về định dạng YYYY-MM-DD
  const normalizeDateString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  // Hàm helper để so sánh giá trị
  const isValueChanged = (newVal, oldVal, fieldName) => {
    // Xử lý trường hợp null/undefined
    if (newVal === null || newVal === undefined || newVal === '') {
      return false; // Không gửi giá trị rỗng
    }
    
    // So sánh đặc biệt cho NgaySinh
    if (fieldName === 'NgaySinh') {
      const normalizedNew = normalizeDateString(newVal);
      const normalizedOld = normalizeDateString(oldVal);
      return normalizedNew !== normalizedOld && normalizedNew !== '';
    }
    
    // So sánh thông thường, trim string
    const newValue = typeof newVal === 'string' ? newVal.trim() : newVal;
    const oldValue = typeof oldVal === 'string' ? oldVal.trim() : oldVal;
    
    return newValue !== oldValue;
  };

  // Load thông tin user
  useEffect(() => {
    dispatch(getInfoUser());
  }, [dispatch]);


  // Sync formData với user
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

  // Lưu thông tin profile
  const handleSaveProfile = async () => {
    if (!isEditing) return setIsEditing(true);
    if (!user?._id) return alert('Thông tin người dùng chưa load xong!');

    try {
      // Lọc ra những field thay đổi
      const updateData = {};
      const fieldsToCheck = ['HoTen', 'Email', 'SoDienThoai', 'NgaySinh', 'GioiTinh', 'DiaChi'];
      
      fieldsToCheck.forEach(key => {
        if (isValueChanged(formData[key], user[key], key)) {
          updateData[key] = formData[key];
        }
      });

      console.log('📤 Update data being sent:', updateData);
      console.log('👤 Current user data:', {
        HoTen: user.HoTen,
        Email: user.Email,
        SoDienThoai: user.SoDienThoai,
        NgaySinh: user.NgaySinh,
        GioiTinh: user.GioiTinh,
        DiaChi: user.DiaChi
      });

      if (Object.keys(updateData).length === 0) {
        alert('Bạn chưa thay đổi thông tin nào.');
        return;
      }

      await dispatch(updateProfile({ id: user._id, ...updateData })).unwrap();
      setIsEditing(false);
      dispatch(getInfoUser());
    } catch (err) {
      console.error('❌ handleSaveProfile error:', err);
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

  // Đổi mật khẩu
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    try {
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })).unwrap();
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
    } catch (err) {
      console.error('❌ handleChangePassword error:', err);
      alert(err?.message || 'Đổi mật khẩu thất bại!');
    }
  };

  // Upload avatar / cover
  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);

    try {
      if (type === 'avatar') await dispatch(uploadAvatar(fd)).unwrap();
      else await dispatch(uploadCover(fd)).unwrap();
      setTimeout(() => dispatch(getInfoUser()), 500);
    } catch (err) {
      console.error('❌ handleUpload error:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) return <div className="myaccount-container"><p>Đang tải thông tin...</p></div>;

  return (
    <>
      <Header />
      <div className="myaccount-container">
        <div className="myaccount-card">

          {/* Ảnh bìa */}
          <div className="cover-container">
            <img src={user?.CoverImage || '/default-cover.jpg'} alt="Ảnh bìa" className="cover-photo" />
            <label htmlFor="coverUpload" className="cover-upload-btn">
              <Camera size={22} /> Đổi ảnh bìa
            </label>
            <input type="file" id="coverUpload" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'cover')} />
          </div>

          {/* Thông tin người dùng */}
          <div className="myaccount-header">
            <div className="profile-top">
              <div className="avatar-wrapper">
                <img src={user?.Avatar || '/default-avatar.png'} alt="Avatar" className="avatar-circle-img" />
                <label htmlFor="avatarUpload" className="avatar-camera"><Camera size={20} /></label>
                <input type="file" id="avatarUpload" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'avatar')} />
              </div>
              <div className="profile-info">
                <h1>{user?.HoTen || 'Chưa cập nhật'}</h1>
                <p>@{user?.TenDangNhap || 'username'}</p>
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
                    <input type={name==='NgaySinh'?'date':'text'} name={name} value={formData[name]} onChange={handleInputChange} />
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
                  <button className="submit-btn" onClick={handleSaveProfile}><Save size={18}/> Lưu cập nhật</button>
                  <button className="cancel-btn" onClick={handleCancelEdit}><X size={18}/> Hủy</button>
                </>
              ) : (
                <button className="submit-btn" onClick={() => setIsEditing(true)}><Edit2 size={18}/> Cập nhật thông tin</button>
              )}
              <button className="submit-btn-alt" onClick={() => setShowChangePassword(!showChangePassword)}><Lock size={18}/> Đổi mật khẩu</button>
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
      </div>
      <Footer />
    </>
  );
}