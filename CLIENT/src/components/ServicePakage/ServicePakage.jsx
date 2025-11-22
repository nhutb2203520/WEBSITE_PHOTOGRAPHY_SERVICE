import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Camera, CheckCircle2, ClipboardList, MapPin, Search } from 'lucide-react';
import './ServicePackage.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';
import { useSelector, useDispatch } from 'react-redux';
import { getAllPackages } from '../../redux/Slices/servicepackageSlice';
import Package from '../PhotographerPage/Package';

export default function PackagePage() {
  const dispatch = useDispatch();
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState(''); // ✅ State lọc vị trí
  const [loaiGoi, setLoaiGoi] = useState('');
  const [sortBy, setSortBy] = useState('');

  const { user } = useSelector(state => state.user);
  const { packages, loading } = useSelector(state => state.package);
  const isPhotographer = user?.isPhotographer;

  useEffect(() => {
    dispatch(getAllPackages());
  }, [dispatch]);

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id) 
        : [...prev, id]
    );
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://via.placeholder.com/600x400?text=No+Image";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `http://localhost:5000/${imageUrl.replace(/^\/+/, "")}`;
  };

  const getPriceRange = (dichVu) => {
    if (!dichVu || dichVu.length === 0) return { min: 0, max: 0 };
    const prices = dichVu.map(s => Number(s.Gia)).filter(p => p > 0);
    if (prices.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  const formatPriceRange = (dichVu) => {
    const { min, max } = getPriceRange(dichVu);
    if (min === 0 && max === 0) return "Liên hệ";
    if (min === max) return `${min.toLocaleString("vi-VN")} đ`;
    return `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} đ`;
  };

  // ✅ Filter logic (Bao gồm cả Location)
  let filtered = packages.filter(pkg => {
    // Lọc theo tên/mô tả
    const matchSearch = pkg.TenGoi?.toLowerCase().includes(search.toLowerCase()) ||
                        pkg.MoTa?.toLowerCase().includes(search.toLowerCase());
    
    // Lọc theo loại gói
    const matchLoaiGoi = !loaiGoi || pkg.LoaiGoi === loaiGoi;

    // ✅ Lọc theo vị trí (City, District, Address)
    const pkgLocation = [
      pkg.baseLocation?.city, 
      pkg.baseLocation?.district, 
      pkg.baseLocation?.address
    ].join(' ').toLowerCase();
    
    const matchLocation = !location || pkgLocation.includes(location.toLowerCase());

    return matchSearch && matchLoaiGoi && matchLocation;
  });

  // Sort logic
  if (sortBy === 'rating') {
    filtered.sort((a, b) => (b.DanhGia || 0) - (a.DanhGia || 0));
  } else if (sortBy === 'popular') {
    filtered.sort((a, b) => (b.SoLuongDaDat || 0) - (a.SoLuongDaDat || 0));
  } else if (sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'priceAsc') {
    filtered.sort((a, b) => getPriceRange(a.DichVu).min - getPriceRange(b.DichVu).min);
  } else if (sortBy === 'priceDesc') {
    filtered.sort((a, b) => getPriceRange(b.DichVu).min - getPriceRange(a.DichVu).min);
  }

  const handleFilterChange = () => {
    const filters = {};
    if (loaiGoi) filters.loaiGoi = loaiGoi;
    if (search) filters.search = search;
    if (location) filters.location = location; // Gửi thêm params location lên server nếu API hỗ trợ
    dispatch(getAllPackages(filters));
  };

  // Tự động fetch lại khi đổi loại gói (Dropdown)
  useEffect(() => {
    handleFilterChange();
  }, [loaiGoi]); 

  return (
    <>
      <Header />
      <Sidebar />

      <div className="packages-page">
        <section className="packages">
          <div className="container">

            <div className="section-header">
              <h2>Gói Dịch Vụ Chụp Ảnh</h2>
              <p>Khám phá các gói dịch vụ chất lượng từ các photographer chuyên nghiệp</p>
            </div>

            {/* ✅ Search & Filter Section */}
            <div className="search-filter">
              {/* Ô tìm kiếm từ khóa */}
              <div className="input-wrapper">
                <Search size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Tìm tên gói, mô tả..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
                />
              </div>

              {/* ✅ Ô tìm kiếm vị trí */}
              <div className="input-wrapper">
                <MapPin size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Tỉnh/Thành phố..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
                />
              </div>

              <select value={loaiGoi} onChange={(e) => setLoaiGoi(e.target.value)}>
                <option value="">Tất cả loại gói</option>
                <option value="Wedding">Wedding (Cưới)</option>
                <option value="Event">Event (Sự kiện)</option>
                <option value="Family">Family (Gia đình)</option>
                <option value="Portrait">Portrait (Chân dung)</option>
                <option value="Product">Product (Sản phẩm)</option>
                <option value="Fashion">Fashion (Thời trang)</option>
                <option value="Other">Khác</option>
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="">Sắp xếp theo</option>
                <option value="newest">Mới nhất</option>
                <option value="rating">Đánh giá cao</option>
                <option value="popular">Phổ biến nhất</option>
                <option value="priceAsc">Giá: Thấp đến Cao</option>
                <option value="priceDesc">Giá: Cao đến Thấp</option>
              </select>

              {/* Nút Đơn hàng của tôi */}
              {user && (
                <Link to="/my-orders" className="btn-my-orders">
                  <ClipboardList size={20} />
                  Đơn hàng của tôi
                </Link>
              )}
            </div>

            {/* Photographer Section */}
            {isPhotographer && (
              <div className="photographer-section-wrapper">
                <div className="section-divider">
                  <h3>Quản lý gói dịch vụ của bạn</h3>
                </div>
                <Package />
              </div>
            )}

            {/* Public Packages Grid */}
            <div className="section-divider">
              <h3>Tất cả gói dịch vụ</h3>
            </div>

            {loading && <div className="loading">Đang tải...</div>}

            {!loading && filtered.length === 0 && (
              <div className="no-packages">
                <Camera size={48} color="#9ca3af" />
                <p>Không tìm thấy gói dịch vụ nào phù hợp.</p>
              </div>
            )}

            <div className="packages-grid">
              {filtered.map(pkg => (
                <div key={pkg._id} className="package-card">
                  <div className="package-image">
                    <img 
                      src={getImageUrl(pkg.AnhBia)} 
                      alt={pkg.TenGoi}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/600x400?text=No+Image";
                      }}
                    />
                    <button
                      className="favorite-btn"
                      onClick={() => toggleFavorite(pkg._id)}
                    >
                      <Heart
                        className={favorites.includes(pkg._id) ? 'favorited' : ''}
                        fill={favorites.includes(pkg._id) ? '#ef4444' : 'none'}
                        color={favorites.includes(pkg._id) ? '#ef4444' : '#ffffff'}
                      />
                    </button>
                    <div className="package-badge">{pkg.LoaiGoi}</div>
                  </div>

                  <div className="package-content">
                    <div className="package-header-row">
                      <h3 className="package-name">{pkg.TenGoi}</h3>
                      <div className="package-rating">
                        <Star className="star-icon" fill="#fbbf24" color="#fbbf24" size={14} />
                        <span>{(pkg.DanhGia || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    
                    {/* ✅ Hiển thị vị trí trên card */}
                    <div className="package-location-row">
                      <MapPin size={14} />
                      <span>{pkg.baseLocation?.city || pkg.baseLocation?.address || 'Toàn quốc'}</span>
                    </div>

                    <p className="package-description">{pkg.MoTa}</p>

                    <div className="package-services-list">
                      {pkg.DichVu?.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="service-tag">
                          <CheckCircle2 size={10} /> {s.name}
                        </span>
                      ))}
                      {pkg.DichVu?.length > 3 && (
                        <span className="service-tag more">+{pkg.DichVu.length - 3} khác</span>
                      )}
                    </div>

                    <div className="package-footer-info">
                      <span className="package-price">
                        {formatPriceRange(pkg.DichVu)}
                      </span>
                      <span className="booking-count-text">
                        {pkg.SoLuongDaDat || 0} lượt đặt
                      </span>
                    </div>

                    <div className="card-divider"></div>

                    {pkg.PhotographerId && (
                      <div className="photographer-info">
                        <div className="photographer-profile">
                          <img 
                            src={getImageUrl(pkg.PhotographerId.Avatar)} 
                            alt={pkg.PhotographerId.HoTen}
                            className="photographer-avatar"
                            onError={(e) => e.target.src="https://via.placeholder.com/30?text=U"}
                          />
                          <span className="photographer-name-text">{pkg.PhotographerId.HoTen}</span>
                        </div>
                      </div>
                    )}

                    <Link to={`/package/${pkg._id}`} className="btn-view">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}