import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Star, Heart, Users, Camera, Award, TrendingUp, 
  ArrowRight, Trophy, Flame, ChevronRight, Zap 
} from 'lucide-react';
import './HomePageCustomer.css';

// Import Layout & Services (Giữ nguyên theo project của bạn)
import MainLayout from '../../layouts/MainLayout/MainLayout';
import ServicePackageApi from '../../apis/ServicePackageService'; 
import homeApi from '../../apis/homeApi';
import FavoriteService from '../../apis/FavoriteService';

// DANH SÁCH ẢNH SLIDESHOW (Ảnh chất lượng cao)
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=1920&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1920&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1920&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1920&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1920&auto=format&fit=crop"
];

export default function HomePageCustomer() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- STATE DỮ LIỆU ---
  const [packages, setPackages] = useState([]); 
  const [statsData, setStatsData] = useState({ clients: 0, photographers: 0, projects: 0, rating: 0 });
  const [topPhotographerTime, setTopPhotographerTime] = useState('month');
  const [topPhotographers, setTopPhotographers] = useState([]);
  const [topPackageTime, setTopPackageTime] = useState('month'); 
  const [rankedPackages, setRankedPackages] = useState([]); 

  const [categories, setCategories] = useState([
    { id: 'Wedding', icon: '💒', name: 'Tiệc cưới', count: 0 },
    { id: 'Family', icon: '👨‍👩‍👧‍👦', name: 'Gia đình', count: 0 },
    { id: 'Portrait', icon: '👤', name: 'Chân dung', count: 0 },
    { id: 'Event', icon: '🎉', name: 'Sự kiện', count: 0 },
    { id: 'Fashion', icon: '👗', name: 'Thời trang', count: 0 },
    { id: 'Product', icon: '📦', name: 'Sản phẩm', count: 0 },
    { id: 'Other', icon: '✨', name: 'Khác', count: 0 },
  ]);

  // --- HELPERS ---
  const getPriceDisplay = (dichVuArray) => {
    if (!dichVuArray || dichVuArray.length === 0) return "Liên hệ";
    const prices = dichVuArray.map(item => Number(item.Gia)).filter(p => p > 0);
    if (prices.length === 0) return "Liên hệ";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max 
      ? `${min.toLocaleString('vi-VN')}đ` 
      : `${min.toLocaleString('vi-VN')} - ${max.toLocaleString('vi-VN')}đ`;
  };

  const getImageUrl = (img) => {
    if (!img) return 'https://via.placeholder.com/400x250?text=No+Image';
    if (img.startsWith('http')) return img;
    return `http://localhost:5000/${img.replace(/^\/+/, "")}`;
  };

  // --- LOGIC: TÍNH TOP PHOTOGRAPHER ---
  const calculateTopPhotographers = (allPackages, timeFrame) => {
    const photographerMap = {};

    allPackages.forEach(pkg => {
        if (!pkg.photographerId) return;
        const pId = pkg.photographerId;
        
        if (!photographerMap[pId]) {
            photographerMap[pId] = {
                id: pId,
                username: pkg.photographerUsername, 
                name: pkg.photographerName,
                avatar: pkg.photographerAvatar,
                bookings: 0,
                totalRating: 0,
                pkgCount: 0,
                categories: new Set()
            };
        }

        photographerMap[pId].bookings += pkg.sold;
        photographerMap[pId].totalRating += parseFloat(pkg.rating);
        photographerMap[pId].pkgCount += 1;
        photographerMap[pId].categories.add(pkg.LoaiGoi);
    });

    let photoArray = Object.values(photographerMap).map(p => ({
        ...p,
        rating: p.pkgCount > 0 ? (p.totalRating / p.pkgCount).toFixed(1) : 0,
        category: Array.from(p.categories)[0] || 'Nhiếp ảnh'
    }));

    if (timeFrame === 'month') {
        photoArray.sort((a, b) => b.bookings - a.bookings);
    } else {
        photoArray.sort((a, b) => {
            const scoreA = (a.bookings * 0.6) + (parseFloat(a.rating) * 2);
            const scoreB = (b.bookings * 0.6) + (parseFloat(b.rating) * 2);
            return scoreB - scoreA;
        });
    }
    return photoArray.slice(0, 4); 
  };

  // --- EFFECTS ---
  // Tự động chuyển slide mỗi 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (packages.length > 0) {
        setTopPhotographers(calculateTopPhotographers(packages, topPhotographerTime));
    }
  }, [topPhotographerTime, packages]);

  useEffect(() => {
    if (packages.length === 0) return;
    let sorted = [...packages];
    if (topPackageTime === 'month') {
        sorted.sort((a, b) => b.sold - a.sold);
    } else {
        sorted.sort((a, b) => {
             const scoreA = (a.sold * 0.7) + (parseFloat(a.rating) * 2) + (a.isNew ? 5 : 0); 
             const scoreB = (b.sold * 0.7) + (parseFloat(b.rating) * 2) + (b.isNew ? 5 : 0);
             return scoreB - scoreA;
        });
    }
    setRankedPackages(sorted.slice(0, 8)); 
  }, [topPackageTime, packages]);

  // Load dữ liệu API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        
        const [packagesRes, statsRes, favRes] = await Promise.all([
            ServicePackageApi.getAllPackages(),
            homeApi.getSystemStats(),
            token ? FavoriteService.getMyFavorites() : Promise.resolve(null)
        ]);

        if (favRes?.success) setFavorites(favRes.data.allIds || []);

        const rawData = packagesRes.packages || [];
        const mappedPackages = rawData.map(pkg => ({
            _id: pkg._id,
            TenGoi: pkg.TenGoi,
            AnhBia: pkg.AnhBia,
            LoaiGoi: pkg.LoaiGoi,
            photographerId: pkg.PhotographerId?._id, 
            photographerUsername: pkg.PhotographerId?.TenDangNhap || pkg.PhotographerId?._id,
            photographerName: pkg.PhotographerId?.HoTen || 'Nhiếp ảnh gia',
            photographerAvatar: pkg.PhotographerId?.Avatar,
            rating: pkg.DanhGia ? pkg.DanhGia.toFixed(1) : '5.0',
            reviews: pkg.SoLuotDanhGia || 0,
            sold: pkg.SoLuongDaDat || 0, 
            priceDisplay: getPriceDisplay(pkg.DichVu),
            location: pkg.baseLocation?.city || 'Toàn quốc',
            isNew: (new Date() - new Date(pkg.createdAt)) < (7 * 24 * 60 * 60 * 1000)
        }));
        setPackages(mappedPackages);

        const newCategories = categories.map(cat => ({
          ...cat,
          count: mappedPackages.filter(p => p.LoaiGoi === cat.id).length
        }));
        setCategories(newCategories);

        if (statsRes?.success) {
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
    e.preventDefault(); 
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
        setFavorites(prev => isLiked ? [...prev, packageId] : prev.filter(id => id !== packageId));
    }
  };

  const statsDisplay = [
    { icon: Users, number: statsData.clients > 1000 ? '1k+' : statsData.clients, label: 'Khách hàng' },
    { icon: Camera, number: statsData.photographers > 100 ? '100+' : statsData.photographers, label: 'Nhiếp ảnh gia' },
    { icon: Award, number: statsData.projects > 1000 ? '1k+' : statsData.projects, label: 'Đơn hàng' },
    { icon: TrendingUp, number: statsData.rating || 5.0, label: 'Đánh giá' },
  ];

  return (
    <MainLayout>
      <div className="homepage-customer">
        
        {/* HERO SECTION */}
        <section className="hero">
          {HERO_IMAGES.map((img, index) => (
            <div 
                key={index}
                className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${img})` }}
            ></div>
          ))}
          <div className="hero-overlay"></div>
          
          <div className="container hero-content">
            <div className="hero-badge">✨ Nền tảng Booking Nhiếp ảnh số 1</div>
            <h1 className="hero-title">
              Bắt trọn từng khoảnh khắc <br/> 
              <span className="highlight">với Nhiếp ảnh gia hàng đầu</span>
            </h1>
            
            <form className="hero-search" onSubmit={(e) => { e.preventDefault(); navigate(`/service-package?search=${searchQuery}`) }}>
              
              <input 
                type="text" 
                placeholder="Tìm kiếm gói chụp (Cưới, Kỷ yếu...)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">Tìm ngay</button>
            </form>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="stats-section">
            <div className="container stats-grid">
                {statsDisplay.map((stat, idx) => (
                    <div key={idx} className="stat-card">
                        <div className="stat-icon-wrapper"><stat.icon size={26} /></div>
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
            <div className="section-header center">
              <h2>Khám phá danh mục</h2>
              <p>Lựa chọn dịch vụ phù hợp với nhu cầu của bạn</p>
            </div>
            <div className="categories-grid">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/service-package?type=${cat.id}`} className="cat-card">
                  <div className="cat-icon-box">{cat.icon}</div>
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-count">{cat.count} gói dịch vụ</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* TOP PACKAGES SECTION */}
        <section className="section featured-section bg-gray">
          <div className="container">
              <div className="top-header">
                  <div className="top-title-group">
                    <div className="icon-flame" style={{background: '#dbeafe'}}><Zap size={28} fill="#3b82f6" color="#3b82f6"/></div>
                    <div>
                        <h2>Gói chụp thịnh hành</h2>
                        <p>Được khách hàng yêu thích và đặt nhiều nhất</p>
                    </div>
                  </div>
                  <div className="time-toggle">
                    <button className={`toggle-btn ${topPackageTime === 'week' ? 'active' : ''}`} onClick={() => setTopPackageTime('week')}>Trong tuần</button>
                    <button className={`toggle-btn ${topPackageTime === 'month' ? 'active' : ''}`} onClick={() => setTopPackageTime('month')}>Trong tháng</button>
                  </div>
              </div>
            
            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : (
                <div className="packages-grid">
                  {rankedPackages.length > 0 ? rankedPackages.map((pkg, index) => (
                    <Link to={`/package/${pkg._id}`} key={pkg._id} className="pkg-card top-pkg-card">
                      <div className={`rank-badge rank-${index + 1}`}>
                          {index < 3 ? <Trophy size={14} fill="white" color="white"/> : `#${index + 1}`}
                      </div>
                      <div className="pkg-thumb">
                        <img src={getImageUrl(pkg.AnhBia)} alt={pkg.TenGoi} />
                        <button className="pkg-like" onClick={(e) => toggleFavorite(e, pkg._id)}>
                            <Heart size={18} fill={favorites.includes(pkg._id) ? "#ef4444" : "none"} color={favorites.includes(pkg._id) ? "#ffffff" : "#ffffff"} />
                        </button>
                        <div className="pkg-cat-badge">{pkg.LoaiGoi}</div>
                      </div>
                      <div className="pkg-body">
                        <div className="pkg-top-meta">
                            <span className="pkg-sold highlight-sold">🔥 {pkg.sold} lượt đặt</span>
                            <span className="pkg-rating"><Star size={12} fill="#fbbf24" color="#fbbf24"/> {pkg.rating}</span>
                        </div>
                        <h3 className="pkg-title" title={pkg.TenGoi}>{pkg.TenGoi}</h3>
                        <div className="pkg-author">
                            <img src={getImageUrl(pkg.photographerAvatar)} alt="" onError={(e)=>e.target.src='https://i.pravatar.cc/150'} />
                            <span>{pkg.photographerName}</span>
                        </div>
                        <div className="pkg-divider"></div>
                        <div className="pkg-footer">
                            <div className="pkg-price" title={pkg.priceDisplay}>{pkg.priceDisplay}</div>
                            <span className="btn-book-now">Xem ngay <ArrowRight size={14}/></span>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <div className="no-data-msg">Chưa có gói dịch vụ nào nổi bật.</div>
                  )}
                </div>
            )}
            
            <div className="center-btn mt-5">
                 <Link to="/service-package" className="view-all-btn">Xem tất cả dịch vụ</Link>
            </div>
          </div>
        </section>

        {/* TOP PHOTOGRAPHERS SECTION */}
        <section className="section top-photographers-section">
              <div className="container">
                  <div className="top-header">
                      <div className="top-title-group">
                        <div className="icon-flame"><Flame size={28} fill="#f97316" color="#f97316"/></div>
                        <div>
                            <h2>Nhiếp ảnh gia nổi bật</h2>
                            <p>Top những gương mặt vàng trong làng nhiếp ảnh</p>
                        </div>
                      </div>
                      <div className="time-toggle">
                        <button className={`toggle-btn ${topPhotographerTime === 'week' ? 'active' : ''}`} onClick={() => setTopPhotographerTime('week')}>Trong tuần</button>
                        <button className={`toggle-btn ${topPhotographerTime === 'month' ? 'active' : ''}`} onClick={() => setTopPhotographerTime('month')}>Trong tháng</button>
                      </div>
                  </div>

                  <div className="top-grid">
                      {topPhotographers.length > 0 ? topPhotographers.map((photo, index) => (
                          <div key={photo.id} className="top-card">
                             <div className={`rank-badge rank-${index + 1}`}>
                                {index < 3 ? <Trophy size={16} fill="white" color="white"/> : `#${index + 1}`}
                             </div>

                             <div className="top-card-content">
                                 <div className="avatar-wrapper">
                                    <img src={getImageUrl(photo.avatar)} alt={photo.name} className="top-avatar" onError={(e)=>e.target.src='https://i.pravatar.cc/150'}/>
                                 </div>
                                 <h3 className="top-name">{photo.name}</h3>
                                 <span className="top-category">{photo.category}</span>
                                 <div className="top-stats">
                                     <div className="stat-item">
                                         <span className="label">Đã đặt</span>
                                         <span className="value highlight">{photo.bookings}</span>
                                     </div>
                                     <div className="vertical-divider"></div>
                                     <div className="stat-item">
                                         <span className="label">Đánh giá</span>
                                         <span className="value"><Star size={12} fill="#fbbf24" color="#fbbf24"/> {photo.rating}</span>
                                     </div>
                                 </div>
                                 
                                 <Link to={`/photographer/${photo.username}`} className="btn-view-profile">
                                     Xem hồ sơ <ChevronRight size={14}/>
                                 </Link>
                             </div>
                          </div>
                      )) : (
                        <div className="no-data-msg">Chưa có dữ liệu nhiếp ảnh gia.</div>
                      )}
                  </div>
              </div>
        </section>

      </div>
    </MainLayout>
  );
}