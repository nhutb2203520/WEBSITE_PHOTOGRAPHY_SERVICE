import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Heart, Users, Camera, Award, TrendingUp } from 'lucide-react';
import './HomePageCustomer.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';

// ✅ 1. Import API Gói dịch vụ
import ServicePackageApi from '../../apis/ServicePackageService'; // Hoặc servicePackageApi tùy tên file bạn đặt

// ✅ 2. Import API Thống kê (File bạn cần tạo ở bước trước)
import homeApi from '../../apis/homeApi'; 

export default function HomePageCustomer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  
  // ✅ State quản lý Sidebar (Mặc định mở)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // ✅ State dữ liệu Gói chụp
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ State dữ liệu Thống kê (Real Data)
  const [statsData, setStatsData] = useState({
    clients: 0,
    photographers: 0,
    projects: 0,
    rating: 0
  });
  
  // State danh mục (Tự động đếm số lượng sau khi fetch data)
  const [categories, setCategories] = useState([
    { id: 'Wedding', icon: '💒', name: 'Cưới', count: 0 },
    { id: 'Family', icon: '👨‍👩‍👧‍👦', name: 'Gia đình', count: 0 },
    { id: 'Portrait', icon: '👤', name: 'Chân dung', count: 0 },
    { id: 'Event', icon: '🎉', name: 'Sự kiện', count: 0 },
    { id: 'Fashion', icon: '👗', name: 'Thời trang', count: 0 },
    { id: 'Product', icon: '📦', name: 'Sản phẩm', count: 0 },
    { id: 'Other', icon: '✨', name: 'Khác', count: 0 },
  ]);

  // Hàm helper: Tính tổng giá từ mảng dịch vụ
  const calculatePrice = (dichVuArray) => {
    if (!dichVuArray || dichVuArray.length === 0) return 0;
    return dichVuArray.reduce((total, item) => total + (item.Gia || 0), 0);
  };

  // ✅ USE EFFECT: Gọi song song cả 2 API để tối ưu tốc độ
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // --- GỌI API ---
        const [packagesRes, statsRes] = await Promise.all([
            ServicePackageApi.getAllPackages(), // Lấy gói chụp
            homeApi.getSystemStats()            // Lấy thống kê
        ]);

        // 1️⃣ XỬ LÝ DỮ LIỆU GÓI CHỤP
        const rawData = packagesRes.packages || [];
        
        const mappedPackages = rawData.map(pkg => {
          const totalPrice = calculatePrice(pkg.DichVu);
          return {
            id: pkg._id,
            photographer: pkg.PhotographerId?.HoTen || 'Photographer',
            avatar: pkg.PhotographerId?.Avatar || 'https://i.pravatar.cc/150?img=1',
            title: pkg.TenGoi,
            price: totalPrice > 0 ? totalPrice.toLocaleString('vi-VN') + 'đ' : 'Liên hệ',
            originalPrice: null,
            rating: pkg.DanhGia ? pkg.DanhGia.toFixed(1) : '5.0',
            reviews: pkg.SoLuotDanhGia || 0,
            image: pkg.AnhBia || (pkg.Images && pkg.Images.length > 0 ? pkg.Images[0] : 'https://via.placeholder.com/600x400'),
            category: pkg.LoaiGoi,
            hours: pkg.ThoiGianThucHien || 'Thỏa thuận',
            sold: pkg.SoLuongDaDat || 0,
            isNew: (new Date() - new Date(pkg.createdAt)) < (7 * 24 * 60 * 60 * 1000)
          };
        });

        setPackages(mappedPackages);

        // Cập nhật số lượng danh mục
        const newCategories = categories.map(cat => ({
          ...cat,
          count: mappedPackages.filter(p => p.category === cat.id).length
        }));
        setCategories(newCategories);

        // 2️⃣ XỬ LÝ DỮ LIỆU THỐNG KÊ (Nếu API trả về thành công)
        if (statsRes && statsRes.success) {
            setStatsData({
                clients: statsRes.data.totalClients || 0,
                photographers: statsRes.data.totalPhotographers || 0,
                projects: statsRes.data.totalOrders || 0,
                rating: statsRes.data.averageRating || 0
            });
        }

      } catch (error) {
        console.error("Lỗi lấy dữ liệu trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Mảng stats hiển thị (Dùng dữ liệu từ state statsData)
  const statsDisplay = [
    { icon: Users, number: statsData.clients > 1000 ? '1,000+' : statsData.clients, label: 'Khách hàng tin dùng' },
    { icon: Camera, number: statsData.photographers > 100 ? '100+' : statsData.photographers, label: 'Photographer chuyên nghiệp' },
    { icon: Award, number: statsData.projects > 1000 ? '1,000+' : statsData.projects, label: 'Dự án hoàn thành' },
    { icon: TrendingUp, number: `${statsData.rating}/5`, label: 'Đánh giá trung bình' },
  ];

  return (
    <>
      <Header />
      
      {/* Sidebar nhận props điều khiển */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content với class động */}
      <div className={`homepage-customer ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        
        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-background"></div>
          <div className="container">
            <div className="hero-content">
              <h1>Tìm Photographer Hoàn Hảo<br />Cho Mọi Khoảnh Khắc</h1>
              <p>Hơn {statsData.photographers} photographer chuyên nghiệp đang chờ bạn</p>
              <div className="search-box">
                <form className="search-form">
                  <div className="search-input-wrapper">
                    <Search className="search-icon" />
                    <input 
                      type="text" 
                      className="search-input" 
                      placeholder="Tìm gói chụp, photographer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-search">Tìm kiếm</button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* STATS SECTION (DỮ LIỆU THẬT) */}
        <section className="stats">
          <div className="container">
            <div className="stats-grid">
              {statsDisplay.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-icon"><stat.icon /></div>
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section className="categories">
          <div className="container">
            <div className="section-header">
              <h2>Danh mục dịch vụ</h2>
            </div>
            <div className="categories-grid">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/category/${cat.id}`} className="category-card">
                  <div className="category-icon">{cat.icon}</div>
                  <div className="category-name">{cat.name}</div>
                  <div className="category-count">{cat.count} gói</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* PACKAGES SECTION (DỮ LIỆU THẬT) */}
        <section className="packages">
          <div className="container">
            <div className="section-header">
              <h2>Gói chụp nổi bật</h2>
              <p>Dịch vụ chất lượng từ cộng đồng</p>
            </div>
            
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div> 
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : (
              <div className="packages-grid">
                {packages.length > 0 ? packages.map((pkg) => (
                  <div key={pkg.id} className="package-card">
                    <div className="package-image">
                      <img src={pkg.image} alt={pkg.title} loading="lazy" />
                      
                      {pkg.isNew && <span className="badge badge-new">Mới</span>}
                      
                      <button className="favorite-btn" onClick={(e) => {e.preventDefault(); toggleFavorite(pkg.id)}}>
                         <Heart 
                           className={favorites.includes(pkg.id) ? 'favorited' : ''} 
                           fill={favorites.includes(pkg.id) ? '#ef4444' : 'none'} 
                           color={favorites.includes(pkg.id) ? '#ef4444' : '#fff'}
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
                        <span className="rating-count">({pkg.reviews}) • {pkg.sold} đã đặt</span>
                      </div>

                      <div className="package-details">
                         <span>⏱️ {pkg.hours}</span>
                         <span>🏷️ {pkg.category}</span>
                      </div>

                      <div className="package-footer">
                        <div className="package-price">
                          <span className="current-price">{pkg.price}</span>
                        </div>
                        <Link to={`/packages/${pkg.id}`} className="btn-book">Chi tiết</Link>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="no-data">Hiện chưa có gói dịch vụ nào.</div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}