import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
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
  const [loaiGoi, setLoaiGoi] = useState('');
  const [sortBy, setSortBy] = useState('');

  const { user } = useSelector(state => state.user);
  const { packages, loading } = useSelector(state => state.package);
  const isPhotographer = user?.isPhotographer;

  useEffect(() => {
    // Fetch tất cả gói dịch vụ khi component mount
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
    if (min === max) return `${min.toLocaleString("vi-VN")} VNĐ`;
    return `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} VNĐ`;
  };

  // Filter packages
  let filtered = packages.filter(pkg => {
    const matchSearch = pkg.TenGoi?.toLowerCase().includes(search.toLowerCase()) ||
                       pkg.MoTa?.toLowerCase().includes(search.toLowerCase());
    const matchLoaiGoi = !loaiGoi || pkg.LoaiGoi === loaiGoi;
    return matchSearch && matchLoaiGoi;
  });

  // Sort packages
  if (sortBy === 'rating') {
    filtered.sort((a, b) => (b.DanhGia || 0) - (a.DanhGia || 0));
  } else if (sortBy === 'popular') {
    filtered.sort((a, b) => (b.SoLuongDaDat || 0) - (a.SoLuongDaDat || 0));
  } else if (sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const handleFilterChange = () => {
    const filters = {};
    if (loaiGoi) filters.loaiGoi = loaiGoi;
    if (search) filters.search = search;
    if (sortBy) filters.sort = sortBy;
    dispatch(getAllPackages(filters));
  };

  useEffect(() => {
    handleFilterChange();
  }, [loaiGoi, sortBy]);

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

            {/* Search & Filter */}
            <div className="search-filter">
              <input
                type="text"
                placeholder="Tìm kiếm gói dịch vụ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
              />

              <select value={loaiGoi} onChange={(e) => setLoaiGoi(e.target.value)}>
                <option value="">Tất cả loại gói</option>
                <option value="Wedding">Wedding</option>
                <option value="Event">Event</option>
                <option value="Family">Family</option>
                <option value="Portrait">Portrait</option>
                <option value="Product">Product</option>
                <option value="Fashion">Fashion</option>
                <option value="Other">Other</option>
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="">Sắp xếp theo</option>
                <option value="newest">Mới nhất</option>
                <option value="rating">Đánh giá cao</option>
                <option value="popular">Phổ biến nhất</option>
              </select>
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
                <p>Không tìm thấy gói dịch vụ nào.</p>
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
                        color={favorites.includes(pkg._id) ? '#ef4444' : '#6b7280'}
                      />
                    </button>
                    <div className="package-badge">{pkg.LoaiGoi}</div>
                  </div>

                  <div className="package-content">
                    <h3 className="package-name">{pkg.TenGoi}</h3>
                    <p className="package-description">{pkg.MoTa}</p>

                    <div className="package-rating">
                      <Star className="star-icon" fill="#fbbf24" color="#fbbf24" />
                      <span>{(pkg.DanhGia || 0).toFixed(1)}</span>
                      <span className="reviews-count">({pkg.SoLuotDanhGia || 0})</span>
                    </div>

                    <div className="package-info">
                      <span className="package-price">
                        {formatPriceRange(pkg.DichVu)}
                      </span>
                      <span className="package-services">
                        {pkg.DichVu?.length || 0} dịch vụ
                      </span>
                    </div>

                    {pkg.PhotographerId && (
                      <div className="photographer-info">
                        <img 
                          src={getImageUrl(pkg.PhotographerId.Avatar)} 
                          alt={pkg.PhotographerId.HoTen}
                          className="photographer-avatar"
                        />
                        <span>{pkg.PhotographerId.HoTen}</span>
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