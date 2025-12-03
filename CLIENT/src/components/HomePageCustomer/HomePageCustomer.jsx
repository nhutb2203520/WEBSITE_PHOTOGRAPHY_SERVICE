import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, Heart, Users, Camera, Award, TrendingUp, MapPin, ArrowRight } from 'lucide-react';
import './HomePageCustomer.css';

// ✅ Import Layout chuẩn
import MainLayout from '../../layouts/MainLayout/MainLayout';

// API Services
import ServicePackageApi from '../../apis/ServicePackageService'; 
import homeApi from '../../apis/homeApi';
import FavoriteService from '../../apis/FavoriteService';

export default function HomePageCustomer() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]); 
  
  const [packages, setPackages] = useState([]);
  const [photographers, setPhotographers] = useState([]); // Thêm state photographer nếu cần hiển thị
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({ clients: 0, photographers: 0, projects: 0, rating: 0 });
  
  const [categories, setCategories] = useState([
    { id: 'Wedding', icon: '💒', name: 'Tiệc cưới', count: 0 },
    { id: 'Family', icon: '👨‍👩‍👧‍👦', name: 'Gia đình', count: 0 },
    { id: 'Portrait', icon: '👤', name: 'Chân dung', count: 0 },
    { id: 'Event', icon: '🎉', name: 'Sự kiện', count: 0 },
    { id: 'Fashion', icon: '👗', name: 'Thời trang', count: 0 },
    { id: 'Product', icon: '📦', name: 'Sản phẩm', count: 0 },
    { id: 'Other', icon: '✨', name: 'Khác', count: 0 },
  ]);

  // ✅ HÀM TÍNH KHOẢNG GIÁ (MIN - MAX)
  const getPriceDisplay = (dichVuArray) => {
    if (!dichVuArray || dichVuArray.length === 0) return "Liên hệ";
    
    const prices = dichVuArray.map(item => Number(item.Gia)).filter(p => p > 0);
    
    if (prices.length === 0) return "Liên hệ";

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) {
      return `${min.toLocaleString('vi-VN')}đ`;
    }
    
    // Format dạng: 1.000.000 - 5.000.000đ
    return `${min.toLocaleString('vi-VN')} - ${max.toLocaleString('vi-VN')}đ`;
  };

  // Helper lấy ảnh an toàn
  const getImageUrl = (img) => {
    if (!img) return 'https://via.placeholder.com/400x250?text=No+Image';
    if (img.startsWith('http')) return img;
    return `http://localhost:5000/${img.replace(/^\/+/, "")}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');

        // Gọi API song song
        const [packagesRes, statsRes, favRes] = await Promise.all([
            ServicePackageApi.getAllPackages(),
            homeApi.getSystemStats(),
            token ? FavoriteService.getMyFavorites() : Promise.resolve(null)
        ]);

        // 1. Xử lý Favorites
        if (favRes && favRes.success) {
            setFavorites(favRes.data.allIds || []);
        }

        // 2. Xử lý Packages
        const rawData = packagesRes.packages || [];
        
        // Map dữ liệu để hiển thị
        const mappedPackages = rawData.map(pkg => ({
            _id: pkg._id,
            TenGoi: pkg.TenGoi,
            AnhBia: pkg.AnhBia,
            LoaiGoi: pkg.LoaiGoi,
            // Thông tin Photographer
            photographerName: pkg.PhotographerId?.HoTen || 'Nhiếp ảnh gia',
            photographerAvatar: pkg.PhotographerId?.Avatar,
            // Đánh giá
            rating: pkg.DanhGia ? pkg.DanhGia.toFixed(1) : '5.0',
            reviews: pkg.SoLuotDanhGia || 0,
            sold: pkg.SoLuongDaDat || 0,
            // Hiển thị giá theo khoảng
            priceDisplay: getPriceDisplay(pkg.DichVu),
            // Địa điểm
            location: pkg.baseLocation?.city || 'Toàn quốc',
            // Check mới
            isNew: (new Date() - new Date(pkg.createdAt)) < (7 * 24 * 60 * 60 * 1000)
        }));

        setPackages(mappedPackages);

        // 3. Cập nhật số lượng Category
        const newCategories = categories.map(cat => ({
          ...cat,
          count: mappedPackages.filter(p => p.LoaiGoi === cat.id).length
        }));
        setCategories(newCategories);

        // 4. Xử lý Stats
        if (statsRes && statsRes.success) {
            setStatsData({
                clients: statsRes.data.totalClients || 0,
                photographers: statsRes.data.totalPhotographers || 0,
                projects: statsRes.data.totalOrders || 0,
                rating: statsRes.data.averageRating || 0
            });
        }

      } catch (error) {
        console.error("Lỗi tải trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleFavorite = async (e, packageId) => {
    e.preventDefault(); // Chặn click vào thẻ Link
    const token = sessionStorage.getItem('token');
    if (!token) {
        alert("Vui lòng đăng nhập để lưu yêu thích!");
        return;
    }

    const isLiked = favorites.includes(packageId);
    setFavorites(prev => isLiked ? prev.filter(id => id !== packageId) : [...prev, packageId]);

    try {
        await FavoriteService.toggleFavorite('package', packageId);
    } catch (error) {
        // Revert nếu lỗi
        setFavorites(prev => isLiked ? [...prev, packageId] : prev.filter(id => id !== packageId));
    }
  };

  const statsDisplay = [
    { icon: Users, number: statsData.clients > 1000 ? '1k+' : statsData.clients, label: 'Khách hàng' },
    { icon: Camera, number: statsData.photographers > 100 ? '100+' : statsData.photographers, label: 'Photographers' },
    { icon: Award, number: statsData.projects > 1000 ? '1k+' : statsData.projects, label: 'Đơn hàng' },
    { icon: TrendingUp, number: '4.9', label: 'Hài lòng' },
  ];

  return (
    <MainLayout>
      <div className="homepage-customer">
        
        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-overlay"></div>
          <div className="container hero-content">
            <h1 className="hero-title">Lưu Giữ Khoảnh Khắc <br/> <span className="highlight">Đáng Nhớ Của Bạn</span></h1>
            <p className="hero-subtitle">Kết nối với hơn {statsData.photographers}+ nhiếp ảnh gia chuyên nghiệp trên toàn quốc.</p>
            
            <form className="hero-search" onSubmit={(e) => { e.preventDefault(); navigate(`/service-package?search=${searchQuery}`) }}>
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="Bạn muốn chụp gì? (Cưới, Kỷ yếu, Profile...)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">Tìm kiếm</button>
            </form>
            
            <div className="hero-tags">
                <span>Gợi ý:</span>
                {['Wedding', 'Portrait', 'Event'].map(tag => (
                    <span key={tag} onClick={() => navigate(`/service-package?type=${tag}`)} className="tag">{tag}</span>
                ))}
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="stats-section">
            <div className="container stats-grid">
                {statsDisplay.map((stat, idx) => (
                    <div key={idx} className="stat-card">
                        <div className="stat-icon"><stat.icon size={28} strokeWidth={1.5} /></div>
                        <div className="stat-info">
                            <h3>{stat.number}</h3>
                            <p>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* CATEGORIES */}
        <section className="section categories-section">
          <div className="container">
            <div className="section-header">
              <h2>Danh mục phổ biến</h2>
              <Link to="/service-package" className="view-all">Xem tất cả <ArrowRight size={16}/></Link>
            </div>
            <div className="categories-grid">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/service-package?type=${cat.id}`} className="cat-card">
                  <div className="cat-icon">{cat.icon}</div>
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-count">{cat.count} gói</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED PACKAGES */}
        <section className="section featured-section">
          <div className="container">
            <div className="section-header">
              <h2>Gói chụp nổi bật</h2>
              <p>Được khách hàng yêu thích và đánh giá cao</p>
            </div>
            
            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : (
                <div className="packages-grid">
                  {packages.length > 0 ? packages.map((pkg) => (
                    <Link to={`/package/${pkg._id}`} key={pkg._id} className="pkg-card">
                      <div className="pkg-thumb">
                        <img src={getImageUrl(pkg.AnhBia)} alt={pkg.TenGoi} />
                        <button className="pkg-like" onClick={(e) => toggleFavorite(e, pkg._id)}>
                            <Heart size={18} fill={favorites.includes(pkg._id) ? "#ef4444" : "none"} color={favorites.includes(pkg._id) ? "#ef4444" : "#fff"} />
                        </button>
                        {pkg.isNew && <span className="badge-new">Mới</span>}
                        <div className="pkg-cat-badge">{pkg.LoaiGoi}</div>
                      </div>
                      
                      <div className="pkg-body">
                        <div className="pkg-author">
                            <img src={getImageUrl(pkg.photographerAvatar)} alt="" onError={(e)=>e.target.src='https://i.pravatar.cc/150'} />
                            <span>{pkg.photographerName}</span>
                        </div>
                        <h3 className="pkg-title" title={pkg.TenGoi}>{pkg.TenGoi}</h3>
                        
                        <div className="pkg-meta">
                            <div className="pkg-rating">
                                <Star size={14} fill="#facc15" color="#facc15"/> 
                                <b>{pkg.rating}</b> <span>({pkg.reviews})</span>
                            </div>
                            <div className="pkg-loc">
                                <MapPin size={14} /> {pkg.location}
                            </div>
                        </div>

                        <div className="pkg-divider"></div>

                        <div className="pkg-footer">
                            <div className="pkg-price">
                                {/* ✅ Hiển thị khoảng giá Min - Max */}
                                {pkg.priceDisplay}
                            </div>
                            <span className="pkg-sold">{pkg.sold} đã đặt</span>
                        </div>
                      </div>
                    </Link>
                  )) : <p className="no-data">Chưa có gói dịch vụ nào.</p>}
                </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
            <div className="cta-content">
                <h2>Bạn là Nhiếp ảnh gia?</h2>
                <p>Đăng ký ngay để tiếp cận hàng ngàn khách hàng tiềm năng và tăng thu nhập.</p>
                <Link to="/signup" className="btn-cta">Trở thành Đối tác</Link>
            </div>
        </section>

      </div>
    </MainLayout>
  );
}