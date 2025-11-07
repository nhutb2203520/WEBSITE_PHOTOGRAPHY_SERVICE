import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Heart, Users, Camera, Award, TrendingUp } from 'lucide-react';
import './HomePageCustomer.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';
export default function HomePageCustomer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);

  const stats = [
    { icon: Users, number: '10,000+', label: 'Khách hàng tin dùng' },
    { icon: Camera, number: '500+', label: 'Photographer chuyên nghiệp' },
    { icon: Award, number: '50,000+', label: 'Dự án hoàn thành' },
    { icon: TrendingUp, number: '4.9/5', label: 'Đánh giá trung bình' },
  ];

  const categories = [
    { id: 1, icon: '💒', name: 'Cưới', count: 450 },
    { id: 2, icon: '👨‍👩‍👧‍👦', name: 'Gia đình', count: 320 },
    { id: 3, icon: '👤', name: 'Profile', count: 280 },
    { id: 4, icon: '🎉', name: 'Sự kiện', count: 190 },
    { id: 5, icon: '👶', name: 'Trẻ em', count: 150 },
    { id: 6, icon: '✈️', name: 'Du lịch', count: 120 },
    { id: 7, icon: '👗', name: 'Thời trang', count: 110 },
  ];

  const packages = [
    {
      id: 1,
      photographer: 'Nguyễn Văn A',
      avatar: 'https://i.pravatar.cc/150?img=12',
      title: 'Gói chụp ảnh cưới ngoài trời',
      price: '2.500.000đ',
      originalPrice: '3.000.000đ',
      rating: 4.9,
      reviews: 45,
      images: 30,
      hours: 4,
      sold: 120,
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop',
      badge: 'Hot',
      badgeColor: 'badge-hot'
    },
    {
      id: 2,
      photographer: 'Trần Thị B',
      avatar: 'https://i.pravatar.cc/150?img=25',
      title: 'Gói chụp ảnh profile chuyên nghiệp',
      price: '800.000đ',
      originalPrice: '1.000.000đ',
      rating: 4.8,
      reviews: 67,
      images: 15,
      hours: 2,
      sold: 95,
      image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=400&fit=crop',
      badge: 'Sale',
      badgeColor: 'badge-sale'
    },
    {
      id: 3,
      photographer: 'Lê Minh C',
      avatar: 'https://i.pravatar.cc/150?img=33',
      title: 'Gói chụp sự kiện doanh nghiệp',
      price: '1.500.000đ',
      originalPrice: null,
      rating: 5.0,
      reviews: 89,
      images: 50,
      hours: 3,
      sold: 78,
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop',
      badge: 'New',
      badgeColor: 'badge-new'
    },
    {
      id: 4,
      photographer: 'Phạm Thu D',
      avatar: 'https://i.pravatar.cc/150?img=47',
      title: 'Gói chụp ảnh gia đình ấm áp',
      price: '1.200.000đ',
      originalPrice: '1.500.000đ',
      rating: 4.9,
      reviews: 78,
      images: 20,
      hours: 2,
      sold: 102,
      image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop',
      badge: 'Hot',
      badgeColor: 'badge-hot'
    },
    {
      id: 5,
      photographer: 'Hoàng Minh E',
      avatar: 'https://i.pravatar.cc/150?img=56',
      title: 'Gói chụp ảnh trẻ em vui nhộn',
      price: '900.000đ',
      originalPrice: null,
      rating: 4.8,
      reviews: 92,
      images: 25,
      hours: 2,
      sold: 65,
      image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop',
      badge: 'Hot',
      badgeColor: 'badge-hot'
    },
    {
      id: 6,
      photographer: 'Vũ Thu F',
      avatar: 'https://i.pravatar.cc/150?img=38',
      title: 'Gói chụp ảnh du lịch nghỉ dưỡng',
      price: '1.800.000đ',
      originalPrice: '2.200.000đ',
      rating: 4.9,
      reviews: 64,
      images: 40,
      hours: 5,
      sold: 48,
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop',
      badge: 'Sale',
      badgeColor: 'badge-sale'
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Tìm kiếm & Chọn lựa',
      description: 'Duyệt qua hàng trăm photographer và gói chụp phù hợp với nhu cầu của bạn'
    },
    {
      number: 2,
      title: 'Đặt lịch & Thanh toán',
      description: 'Chọn thời gian phù hợp và thanh toán an toàn qua nền tảng'
    },
    {
      number: 3,
      title: 'Nhận ảnh đẹp',
      description: 'Photographer sẽ chụp và giao ảnh đã chỉnh sửa trong thời gian cam kết'
    }
  ];

  const quickFilters = ['Chụp cưới', 'Profile', 'Gia đình', 'Sự kiện'];

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const toggleFavorite = (packageId) => {
    setFavorites(prev => {
      if (prev.includes(packageId)) {
        return prev.filter(id => id !== packageId);
      }
      return [...prev, packageId];
    });
  };

  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice) return null;
    const current = parseInt(price.replace(/\D/g, ''));
    const original = parseInt(originalPrice.replace(/\D/g, ''));
    return Math.round((1 - current / original) * 100);
  };

  return (
    <>
      <Header />
      <Sidebar />
      <div className="homepage-customer">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-background"></div>
          <div className="container">
            <div className="hero-content">
              <h1>
                Tìm Photographer Hoàn Hảo<br />
                Cho Mọi Khoảnh Khắc
              </h1>
              <p>Hơn 500 photographer chuyên nghiệp sẵn sàng biến giấc mơ của bạn thành hiện thực</p>

              <div className="search-box">
                <form onSubmit={handleSearch} className="search-form">
                  <div className="search-input-wrapper">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Tìm kiếm gói chụp, photographer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-search">
                    Tìm kiếm
                  </button>
                </form>

                <div className="quick-filters">
                  <span>Phổ biến:</span>
                  {quickFilters.map((filter, index) => (
                    <button key={index} className="filter-tag">
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats">
          <div className="container">
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-icon">
                    <stat.icon />
                  </div>
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="categories">
          <div className="container">
            <div className="section-header">
              <h2>Danh mục dịch vụ</h2>
              <p>Tìm photographer phù hợp với nhu cầu của bạn</p>
            </div>
            <div className="categories-grid">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.name.toLowerCase()}`}
                  className="category-card"
                >
                  <div className="category-icon">{category.icon}</div>
                  <div className="category-name">{category.name}</div>
                  <div className="category-count">{category.count} gói</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Packages Section */}
        <section className="packages">
          <div className="container">
            <div className="section-header">
              <h2>Gói chụp nổi bật</h2>
              <p>Được yêu thích và đặt nhiều nhất</p>
            </div>
            <div className="packages-grid">
              {packages.map((pkg) => (
                <div key={pkg.id} className="package-card">
                  <div className="package-image">
                    <img src={pkg.image} alt={pkg.title} />
                    {pkg.badge && (
                      <span className={`badge ${pkg.badgeColor}`}>{pkg.badge}</span>
                    )}
                    {pkg.originalPrice && (
                      <span className="discount-badge">
                        -{calculateDiscount(pkg.price, pkg.originalPrice)}%
                      </span>
                    )}
                    <button
                      className="favorite-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(pkg.id);
                      }}
                    >
                      <Heart
                        className={favorites.includes(pkg.id) ? 'favorited' : ''}
                        fill={favorites.includes(pkg.id) ? '#ef4444' : 'none'}
                        color={favorites.includes(pkg.id) ? '#ef4444' : '#6b7280'}
                      />
                    </button>
                  </div>

                  <div className="package-content">
                    <div className="package-photographer">
                      <img src={pkg.avatar} alt={pkg.photographer} className="photographer-avatar" />
                      <span className="photographer-name">{pkg.photographer}</span>
                    </div>

                    <h3 className="package-title">{pkg.title}</h3>

                    <div className="package-rating">
                      <Star className="star-icon" fill="#fbbf24" color="#fbbf24" />
                      <span className="rating-number">{pkg.rating}</span>
                      <span className="rating-count">({pkg.reviews})</span>
                      <span className="rating-count">• {pkg.sold} đã bán</span>
                    </div>

                    <div className="package-details">
                      <span>📸 {pkg.images} ảnh</span>
                      <span>⏱️ {pkg.hours}h</span>
                    </div>

                    <div className="package-footer">
                      <div className="package-price">
                        {pkg.originalPrice && (
                          <span className="original-price">{pkg.originalPrice}</span>
                        )}
                        <span className="current-price">{pkg.price}</span>
                      </div>
                      <Link to={`/packages/${pkg.id}`} className="btn-book">
                        Đặt ngay
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="how-it-works">
          <div className="container">
            <div className="section-header">
              <h2>Cách thức hoạt động</h2>
              <p>Chỉ với 3 bước đơn giản</p>
            </div>
            <div className="steps-grid">
              {steps.map((step) => (
                <div key={step.number} className="step-item">
                  <div className="step-number">{step.number}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta">
          <div className="container">
            <h2>Bạn là Photographer?</h2>
            <p>
              Tham gia cộng đồng photographer chuyên nghiệp và tiếp cận hàng nghìn khách hàng tiềm năng
            </p>
            <div className="cta-buttons">
              <Link to="/become-photographer" className="btn-primary">
                Đăng ký ngay
              </Link>
              <Link to="/photographer-info" className="btn-secondary">
                Tìm hiểu thêm
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}