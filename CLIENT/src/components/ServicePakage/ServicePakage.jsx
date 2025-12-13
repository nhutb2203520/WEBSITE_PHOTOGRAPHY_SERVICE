import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Star, Heart, Camera, AlertTriangle, MapPin, Filter, Search, PlusCircle, Settings } from 'lucide-react';
import './ServicePackage.css';

// ✅ Import Layout & Redux
import MainLayout from '../../layouts/MainLayout/MainLayout';
import { useSelector, useDispatch } from 'react-redux';
import { getAllPackages } from '../../redux/Slices/servicepackageSlice';
// ❌ ĐÃ XÓA IMPORT Package (Component quản lý không nên đặt ở trang Public)
import FavoriteService from '../../apis/FavoriteService'; 

// ✅ Component hiển thị ảnh an toàn
const SafeImage = ({ src, alt, className, style, fallbackIcon = Camera, fallbackSize = 48 }) => {
  const [error, setError] = useState(false);
  const FallbackIcon = fallbackIcon;
  
  const getSafeSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:5000/${url.replace(/^\/+/, "")}`;
  };

  if (!src || error) {
    return (
      <div 
        className={className}
        style={{ 
          width: '100%', 
          height: '100%', 
          background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6366f1',
          ...style
        }}
      >
        <FallbackIcon size={fallbackSize} opacity={0.5} />
      </div>
    );
  }

  return (
    <img 
      src={getSafeSrc(src)} 
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
};

export default function ServicePackage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State
  const [favorites, setFavorites] = useState([]); 
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(''); 
  const [loaiGoi, setLoaiGoi] = useState(searchParams.get('type') || '');
  const [sortBy, setSortBy] = useState('');

  const { user } = useSelector(state => state.user);
  const { packages, loading } = useSelector(state => state.package);
  const isPhotographer = user?.isPhotographer || user?.role === 'photographer';

  // 1. Fetch Packages & Favorites
  useEffect(() => {
    dispatch(getAllPackages());

    const fetchFavorites = async () => {
        const token = sessionStorage.getItem('token');
        if (token) {
            try {
                const res = await FavoriteService.getMyFavorites();
                if (res.success) setFavorites(res.data.allIds || []);
            } catch (error) {
                console.error("Lỗi tải danh sách yêu thích:", error);
            }
        }
    };
    fetchFavorites();
  }, [dispatch]);

  // 2. Handle Like
  const toggleFavorite = async (e, id) => {
    e.preventDefault(); 
    e.stopPropagation();

    const token = sessionStorage.getItem('token');
    if (!token) {
        alert("Vui lòng đăng nhập để lưu yêu thích!");
        return;
    }

    const isLiked = favorites.includes(id);
    setFavorites(prev => isLiked ? prev.filter(f => f !== id) : [...prev, id]);

    try {
        await FavoriteService.toggleFavorite('package', id);
    } catch (error) {
        setFavorites(prev => isLiked ? [...prev, id] : prev.filter(f => f !== id));
        alert("Lỗi kết nối, thử lại sau.");
    }
  };

  // 3. Helpers
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

  // 4. Filter & Sort Logic
  let filtered = packages.filter(pkg => {
    const matchSearch = pkg.TenGoi?.toLowerCase().includes(search.toLowerCase()) ||
                        pkg.MoTa?.toLowerCase().includes(search.toLowerCase());
    const matchLoaiGoi = !loaiGoi || pkg.LoaiGoi === loaiGoi;
    // Kiểm tra an toàn cho baseLocation
    const pkgLocation = [pkg.baseLocation?.city, pkg.baseLocation?.district].filter(Boolean).join(' ').toLowerCase();
    const matchLocation = !location || pkgLocation.includes(location.toLowerCase());
    return matchSearch && matchLoaiGoi && matchLocation;
  });

  if (sortBy === 'rating') filtered.sort((a, b) => (b.DanhGia || 0) - (a.DanhGia || 0));
  else if (sortBy === 'popular') filtered.sort((a, b) => (b.SoLuongDaDat || 0) - (a.SoLuongDaDat || 0));
  else if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sortBy === 'priceAsc') filtered.sort((a, b) => (a.DichVu?.[0]?.Gia || 0) - (b.DichVu?.[0]?.Gia || 0));

  // --- RENDER ---
  return (
    <MainLayout>
      <div className="service-package-page">
        <div className="container">
          
          {/* Header & Filter */}
          <div className="sp-header">
            <div className="sp-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div className="sp-title">
                    <h1>Kho Gói Chụp Ảnh</h1>
                    <p>Khám phá hơn {packages.length} gói dịch vụ chất lượng</p>
                </div>
                
                {/* ✅ SỬA LỖI: Chỉ hiển thị nút điều hướng, KHÔNG hiển thị component quản lý tại đây */}
                {isPhotographer && (
                    <button 
                        className="btn-manage-packages"
                        onClick={() => navigate('/photographer/service-packages')} // Chuyển hướng sang trang quản lý riêng
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '8px',
                            backgroundColor: '#4f46e5', color: 'white',
                            border: 'none', cursor: 'pointer', fontWeight: '600'
                        }}
                    >
                        <Settings size={18} /> Quản lý gói của tôi
                    </button>
                )}
            </div>

            <div className="sp-filters">
              <div className="filter-group search-group">
              
                <input type="text" placeholder="Tìm tên gói..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="filter-group location-group">
        
                <input type="text" placeholder="Tỉnh/Thành phố..." value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div className="filter-group select-group">
             
                <select value={loaiGoi} onChange={e => setLoaiGoi(e.target.value)}>
                  <option value="">Tất cả thể loại</option>
                  <option value="Wedding">Tiệc Cưới</option>
                  <option value="Event">Sự kiện</option>
                  <option value="Portrait">Chân dung</option>
                  <option value="Product">Sản phẩm</option>
                  <option value="Fashion">Thời trang</option>
                  <option value="Other">Khác</option>
                </select>
              </div>
              <div className="filter-group select-group">
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{paddingLeft: '15px'}}>
                  <option value="">Sắp xếp</option>
                  <option value="newest">Mới nhất</option>
                  <option value="rating">Đánh giá cao</option>
                  <option value="popular">Phổ biến</option>
                  <option value="priceAsc">Giá thấp - cao</option>
                </select>
              </div>
            </div>
          </div>

          {/* Package Grid */}
          {loading ? (
             <div className="sp-loading"><div className="spinner"></div><p>Đang tải dữ liệu...</p></div>
          ) : (
             <div className="sp-grid">
                {filtered.length > 0 ? filtered.map(pkg => {
                   const isLiked = favorites.includes(pkg._id);
                   return (
                    <Link to={`/package/${pkg._id}`} key={pkg._id} className="sp-card">
                       <div className="sp-thumb">
                          <SafeImage src={pkg.AnhBia} alt={pkg.TenGoi} className="sp-img"/>
                          
                          <button className="sp-like-btn" onClick={(e) => toggleFavorite(e, pkg._id)}>
                             <Heart 
                                size={20} 
                                fill={isLiked ? "#ef4444" : "none"}      
                                color={isLiked ? "#ef4444" : "#4b5563"} 
                                strokeWidth={2.5} 
                             />
                          </button>

                          <span className="sp-cat-badge">{pkg.LoaiGoi}</span>
                          {(new Date() - new Date(pkg.createdAt) < 7*86400000) && <span className="sp-new-badge">Mới</span>}
                       </div>

                       <div className="sp-content">
                          <div className="sp-author">
                             <SafeImage 
                                src={pkg.PhotographerId?.Avatar} 
                                className="sp-avatar" 
                                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                             />
                             <span>{pkg.PhotographerId?.HoTen || 'Nhiếp ảnh gia'}</span>
                          </div>

                          <h3 className="sp-name" title={pkg.TenGoi}>{pkg.TenGoi}</h3>

                          <div className="sp-meta">
                             <div className="sp-rating">
                                <Star size={14} fill="#fbbf24" color="#fbbf24"/> 
                                <b>{(pkg.DanhGia || 0).toFixed(1)}</b> <span>({pkg.SoLuotDanhGia || 0})</span>
                             </div>
                             <div className="sp-loc">
                                <MapPin size={14} /> {pkg.baseLocation?.city || 'Toàn quốc'}
                             </div>
                          </div>
                          
                          <div className="sp-divider"></div>

                          <div className="sp-footer">
                             <div className="sp-price">{formatPrice(pkg.DichVu)}</div>
                             <span className="sp-sold">{pkg.SoLuongDaDat > 0 ? `${pkg.SoLuongDaDat} đã đặt` : 'Chưa có lượt đặt'}</span>
                          </div>

                          {pkg.SoLuongKhieuNai > 0 && (
                             <div className="sp-warning"><AlertTriangle size={12} /> {pkg.SoLuongKhieuNai} khiếu nại</div>
                          )}
                          <span className="btn-view">Xem chi tiết</span>
                       </div>
                    </Link>
                   );
                }) : (
                   <div className="sp-empty"><Camera size={48} color="#9ca3af"/><p>Không tìm thấy gói dịch vụ nào.</p></div>
                )}
             </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
}