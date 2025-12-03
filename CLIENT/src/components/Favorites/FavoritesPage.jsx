import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, Package, User, ArrowRight, MessageSquare, MapPin } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout/MainLayout';
import FavoriteService from '../../apis/FavoriteService';
import './FavoritesPage.css'; // Bạn có thể import thêm './Photographer.css' nếu muốn dùng chung style

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('packages'); 
  const [favoritePackages, setFavoritePackages] = useState([]);
  const [favoritePhotographers, setFavoritePhotographers] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. Fetch Data ---
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
            
            // ✅ XỬ LÝ DỮ LIỆU (MAPPING) GIỐNG PHOTOGRAPHER.JSX
            // Giúp chuẩn hóa dữ liệu đầu vào, tránh lỗi undefined
            const rawPhotographers = res.data.photographers || [];
            
            const mappedPhotographers = rawPhotographers.map(item => {
                // Kiểm tra xem item là object lồng (item.photographer) hay trực tiếp
                const pg = item.photographer || item; 

                return {
                    id: pg._id,
                    // Ưu tiên username, nếu không có thì dùng id
                    username: pg.TenDangNhap || pg._id, 
                    name: pg.HoTen || 'Chưa cập nhật',
                    avatar: pg.Avatar || '/default-avatar.png',
                    cover: pg.CoverImage || '/default-cover.jpg',
                    address: pg.DiaChi || 'Toàn quốc',
                    
                    // --- Logic thống kê giống Photographer.jsx ---
                    rating: pg.rating ? parseFloat(pg.rating).toFixed(1) : '5.0', // Mặc định 5.0 nếu chưa có rating từ backend Favorites
                    reviews: pg.reviews || 0,
                    // Kiểm tra nếu packages là mảng (từ populate) hay số (từ aggregate)
                    packages: Array.isArray(pg.packages) ? pg.packages.length : (pg.packages || 0)
                };
            });

            setFavoritePhotographers(mappedPhotographers);
        }
    } catch (error) {
        console.error("Failed to load favorites", error);
    } finally {
        setLoading(false);
    }
  };

  // --- 2. Handle Unfavorite ---
  const handleUnfavorite = async (type, id) => {
    // Ngăn chặn nổi bọt sự kiện nếu click vào nút tim
    if(!window.confirm("Bạn có chắc muốn xóa khỏi danh sách yêu thích?")) return;
    
    try {
        await FavoriteService.toggleFavorite(type, id);
        
        // Cập nhật state ngay lập tức (Optimistic update)
        if(type === 'package') {
            setFavoritePackages(prev => prev.filter(p => p._id !== id));
        } else {
            setFavoritePhotographers(prev => prev.filter(p => p.id !== id));
        }
    } catch (error) {
        alert("Lỗi khi xóa, vui lòng thử lại.");
    }
  };

  // --- 3. Helpers ---
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000/${url.replace(/^\/+/, "")}`;
  };

  const formatPrice = (dichVu) => {
    if (!dichVu?.length) return "Liên hệ";
    const prices = dichVu.map(s => Number(s.Gia)).filter(p => p > 0);
    if (!prices.length) return "Liên hệ";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max 
      ? `${min.toLocaleString("vi-VN")} đ` 
      : `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} đ`;
  };

  return (
    <MainLayout>
      <div className="favorites-page">
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Danh sách yêu thích</h1>
                <p className="page-subtitle">Lưu giữ những dịch vụ và nhiếp ảnh gia bạn quan tâm</p>
            </div>
            
            {/* TABS SWITCHER */}
            <div className="tabs-container">
                <div className="tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
                        onClick={() => setActiveTab('packages')}
                    >
                        <Package size={18} /> Gói dịch vụ <span className="badge">{favoritePackages.length}</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'photographers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('photographers')}
                    >
                        <User size={18} /> Nhiếp ảnh gia <span className="badge">{favoritePhotographers.length}</span>
                    </button>
                </div>
            </div>

            <div className="favorites-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        {/* --- TAB PACKAGES --- */}
                        {activeTab === 'packages' && (
                            <div className="grid-packages">
                                {favoritePackages.length > 0 ? favoritePackages.map(pkg => (
                                    <div key={pkg._id} className="fav-card pkg-card">
                                        <div className="fav-img">
                                            <img 
                                                src={getImageUrl(pkg.AnhBia)} 
                                                alt={pkg.TenGoi} 
                                                onError={(e) => e.target.src = 'https://via.placeholder.com/300'} 
                                            />
                                            <div className="overlay"></div>
                                            <button className="btn-remove-fav" onClick={() => handleUnfavorite('package', pkg._id)}>
                                                <Heart fill="#ef4444" color="#ef4444" size={20}/>
                                            </button>
                                            <span className="category-tag">{pkg.LoaiGoi}</span>
                                        </div>
                                        <div className="fav-info">
                                            <div className="pkg-header">
                                                <h3>{pkg.TenGoi}</h3>
                                                <div className="rating-badge">
                                                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                                    <span>{pkg.DanhGia ? pkg.DanhGia.toFixed(1) : 5.0}</span>
                                                </div>
                                            </div>
                                            <p className="photographer-name">bởi <strong>{pkg.PhotographerId?.HoTen}</strong></p>
                                            <div className="pkg-footer">
                                                <div className="fav-price">{formatPrice(pkg.DichVu)}</div>
                                                <Link to={`/package/${pkg._id}`} className="btn-icon-view"><ArrowRight size={18}/></Link>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-state">
                                        <div className="empty-icon"><Package size={48} /></div>
                                        <p>Bạn chưa lưu gói dịch vụ nào.</p>
                                        <Link to="/service-package" className="btn-browse">Khám phá ngay</Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- TAB PHOTOGRAPHERS (ĐÃ CHUẨN HÓA GIỐNG PHOTOGRAPHER.JSX) --- */}
                        {activeTab === 'photographers' && (
                            <div className="photographers-grid">
                                {favoritePhotographers.length > 0 ? favoritePhotographers.map(ph => (
                                    <div key={ph.id} className="photographer-card">
                                      
                                      {/* 1. Phần Ảnh Bìa */}
                                      <div className="card-header">
                                        <img 
                                            src={getImageUrl(ph.cover)} 
                                            alt="Cover" 
                                            className="card-cover" 
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/400x200?text=No+Cover'} 
                                        />
                                        <button className="btn-favorite" onClick={() => handleUnfavorite('photographer', ph.id)}>
                                          <Heart 
                                            size={20} 
                                            className="active"
                                            fill="#ef4444"
                                            color="#ef4444"
                                          />
                                        </button>
                                      </div>

                                      {/* 2. Phần Avatar */}
                                      <div className="card-avatar-wrapper">
                                          <img 
                                            src={getImageUrl(ph.avatar)} 
                                            alt="Avatar" 
                                            className="card-avatar" 
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=User'} 
                                          />
                                      </div>

                                      {/* 3. Phần Nội Dung */}
                                      <div className="card-body">
                                        <h3 className="card-name">{ph.name}</h3>
                                        <div style={{fontSize:'0.85rem', color:'#6b7280', marginBottom:'10px', textAlign:'center'}}>
                                            <MapPin size={14} style={{display:'inline', marginRight:4}}/>{ph.address}
                                        </div>
                                        
                                        {/* Thống kê: Sao | Đánh giá | Gói */}
                                        <div className="card-stats">
                                          <div className="stat-pill rating">
                                             <Star size={14} fill="#fbbf24" color="#fbbf24"/>
                                             <span>{ph.rating}</span>
                                          </div>
                                          <div className="stat-pill">
                                             <MessageSquare size={14} />
                                             <span>{ph.reviews}</span>
                                          </div>
                                          <div className="stat-pill">
                                             <Package size={14} />
                                             <span>{ph.packages}</span>
                                          </div>
                                        </div>

                                        <div className="card-footer">
                                          {/* Dùng username hoặc id cho Link */}
                                          <Link to={`/photographer/${ph.username}`} className="btn-view-profile">
                                            Xem hồ sơ
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                )) : (
                                    <div className="empty-state">
                                        <div className="empty-icon"><User size={48} /></div>
                                        <p>Bạn chưa theo dõi nhiếp ảnh gia nào.</p>
                                        <Link to="/service-package" className="btn-browse">Tìm kiếm ngay</Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      </div>
    </MainLayout>
  );
}