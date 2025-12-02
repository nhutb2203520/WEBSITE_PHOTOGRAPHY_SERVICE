import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, Package, User } from 'lucide-react';

// ✅ SỬA LỖI IMPORT: Dùng ../ để quay ra thư mục components
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';

// ✅ SỬA LỖI IMPORT API: Dùng ../../ để quay ra src/apis
import FavoriteService from '../../apis/FavoriteService';

import './FavoritesPage.css';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'photographers'
  const [favoritePackages, setFavoritePackages] = useState([]);
  const [favoritePhotographers, setFavoritePhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        navigate('/signin');
        return;
    }
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
        const res = await FavoriteService.getMyFavorites();
        if (res.success) {
            setFavoritePackages(res.data.packages || []);
            setFavoritePhotographers(res.data.photographers || []);
        }
    } catch (error) {
        console.error("Failed to load favorites", error);
    } finally {
        setLoading(false);
    }
  };

  const handleUnfavorite = async (type, id) => {
    if(!window.confirm("Bạn có chắc muốn xóa khỏi danh sách yêu thích?")) return;
    
    try {
        await FavoriteService.toggleFavorite(type, id);
        
        // Cập nhật UI ngay lập tức
        if(type === 'package') {
            setFavoritePackages(prev => prev.filter(p => p._id !== id));
        } else {
            setFavoritePhotographers(prev => prev.filter(p => p._id !== id));
        }
    } catch (error) {
        alert("Lỗi khi xóa, vui lòng thử lại.");
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      <Header />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`favorites-page ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="container">
            <h1 className="page-title">Danh sách yêu thích</h1>
            
            {/* TABS */}
            <div className="tabs">
                <button 
                    className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
                    onClick={() => setActiveTab('packages')}
                >
                    <Package size={20} /> Gói dịch vụ ({favoritePackages.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'photographers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('photographers')}
                >
                    <User size={20} /> Nhiếp ảnh gia ({favoritePhotographers.length})
                </button>
            </div>

            {/* CONTENT */}
            <div className="favorites-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div> Đang tải danh sách...
                    </div>
                ) : (
                    <>
                        {/* GÓI DỊCH VỤ */}
                        {activeTab === 'packages' && (
                            <div className="grid-packages">
                                {favoritePackages.length > 0 ? favoritePackages.map(pkg => (
                                    <div key={pkg._id} className="fav-card">
                                        <div className="fav-img">
                                            <img src={pkg.AnhBia || 'https://via.placeholder.com/300'} alt={pkg.TenGoi} />
                                            <button className="btn-remove-fav" onClick={() => handleUnfavorite('package', pkg._id)} title="Bỏ thích">
                                                <Heart fill="#ef4444" color="#ef4444" />
                                            </button>
                                        </div>
                                        <div className="fav-info">
                                            <h3>{pkg.TenGoi}</h3>
                                            <p className="photographer-name">📸 {pkg.PhotographerId?.HoTen}</p>
                                            <div className="fav-rating">
                                                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                                                <span>{pkg.DanhGia ? pkg.DanhGia.toFixed(1) : 5.0} ({pkg.SoLuotDanhGia})</span>
                                            </div>
                                            <div className="fav-price">
                                                {pkg.DichVu?.reduce((t, s) => t + s.Gia, 0).toLocaleString()}đ
                                            </div>
                                            <Link to={`/package/${pkg._id}`} className="btn-view">Xem chi tiết</Link>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-state">
                                        <Heart size={48} color="#d1d5db" />
                                        <p>Bạn chưa lưu gói dịch vụ nào.</p>
                                        <Link to="/" className="btn-browse">Khám phá ngay</Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* NHIẾP ẢNH GIA */}
                        {activeTab === 'photographers' && (
                            <div className="grid-photographers">
                                {favoritePhotographers.length > 0 ? favoritePhotographers.map(pg => (
                                    <div key={pg._id} className="fav-card pg-card">
                                        <div className="fav-img pg-img">
                                            <img src={pg.CoverImage || 'https://via.placeholder.com/400x200'} alt="Cover" className="pg-cover" />
                                            <img src={pg.Avatar || 'https://via.placeholder.com/150'} alt={pg.HoTen} className="pg-avatar" />
                                            <button className="btn-remove-fav" onClick={() => handleUnfavorite('photographer', pg._id)} title="Bỏ thích">
                                                <Heart fill="#ef4444" color="#ef4444" />
                                            </button>
                                        </div>
                                        <div className="fav-info pg-info">
                                            <h3>{pg.HoTen}</h3>
                                            <p className="pg-address">📍 {pg.DiaChi || 'Chưa cập nhật địa chỉ'}</p>
                                            <Link to={`/photographer/${pg.TenDangNhap}`} className="btn-view">Xem hồ sơ</Link>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-state">
                                        <User size={48} color="#d1d5db" />
                                        <p>Bạn chưa theo dõi nhiếp ảnh gia nào.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      </div>
      <Footer />
    </>
  );
}