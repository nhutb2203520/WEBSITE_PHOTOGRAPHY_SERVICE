import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Package, MessageSquare, Camera } from 'lucide-react';
import './Photographer.css';

// Import Layout & Services
import MainLayout from '../../layouts/MainLayout/MainLayout';
import FavoriteService from '../../apis/FavoriteService'; // ✅ Import API Service

export default function Photographer() {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]); // ✅ State lưu danh sách ID yêu thích từ Server
  const [search, setSearch] = useState('');
  const [ratingOrder, setRatingOrder] = useState('');
  const [packagesOrder, setPackagesOrder] = useState('');

  // --- 1. Fetch Data (Photographers & Favorites) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');

        // Chạy song song 2 request: Lấy Photographer và Lấy danh sách yêu thích
        const [photoRes, favRes] = await Promise.all([
          fetch('http://localhost:5000/api/khachhang/photographers'), // Thay bằng API thực tế của bạn
          token ? FavoriteService.getMyFavorites() : Promise.resolve(null)
        ]);

        // Xử lý dữ liệu Photographer
        if (!photoRes.ok) throw new Error('Failed to fetch photographers');
        const data = await photoRes.json();
        
        const mapped = data.map(ph => ({
          id: ph._id,
          username: ph.TenDangNhap || ph._id,
          name: ph.HoTen || 'Chưa cập nhật',
          avatar: ph.Avatar || '/default-avatar.png',
          cover: ph.CoverImage || '/default-cover.jpg',
          rating: ph.rating ? parseFloat(ph.rating).toFixed(1) : '0.0',      
          reviews: ph.reviews || 0,    
          packages: ph.packages || 0,  
        }));
        setPhotographers(mapped);

        // Xử lý dữ liệu Favorites
        if (favRes && favRes.success) {
            setFavorites(favRes.data.allIds || []);
        }

      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 2. Handle Toggle Favorite ---
  const toggleFavorite = async (e, id) => {
    e.preventDefault(); // Ngăn chặn sự kiện click lan ra ngoài (nếu có)
    
    const token = sessionStorage.getItem('token');
    if (!token) {
        alert("Vui lòng đăng nhập để lưu yêu thích!");
        return;
    }

    // Optimistic Update: Cập nhật giao diện ngay lập tức
    const isLiked = favorites.includes(id);
    setFavorites(prev => isLiked ? prev.filter(f => f !== id) : [...prev, id]);

    try {
        // Gọi API backend (tham số 'photographer' hoặc 'user' tùy backend quy định)
        await FavoriteService.toggleFavorite('photographer', id); 
    } catch (error) {
        // Nếu lỗi, hoàn tác lại state cũ
        setFavorites(prev => isLiked ? [...prev, id] : prev.filter(f => f !== id));
        console.error("Lỗi khi like:", error);
        alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  // --- Filter & Sort Logic ---
  let filtered = photographers.filter(ph => 
    ph.name.toLowerCase().includes(search.toLowerCase())
  );

  if (ratingOrder) {
    filtered = filtered.sort((a, b) => 
      ratingOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating
    );
  }
  if (packagesOrder) {
    filtered = filtered.sort((a, b) => 
      packagesOrder === 'desc' ? b.packages - a.packages : a.packages - b.packages
    );
  }

  // --- Helper lấy ảnh an toàn ---
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000/${url.replace(/^\/+/, "")}`;
  };

  // --- RENDER ---
  if (loading) return (
    <MainLayout>
      <div className="photographers-page">
        <div className="container">
            <div className="loading-state">
                <div className="spinner"></div>
            </div>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="photographers-page">
        <section className="photographers">
          <div className="container">
            <div className="section-header">
              <h2>Tìm kiếm Nhiếp ảnh gia</h2>
              <p>Khám phá những tài năng hàng đầu cho bộ ảnh của bạn</p>
            </div>

            {/* Filter Bar */}
            <div className="search-filter">
              <input type="text" placeholder="Tìm tên nhiếp ảnh gia..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={ratingOrder} onChange={(e) => setRatingOrder(e.target.value)}>
                <option value="">Sắp xếp theo đánh giá</option>
                <option value="desc">Đánh giá cao nhất</option>
                <option value="asc">Đánh giá thấp nhất</option>
              </select>
              <select value={packagesOrder} onChange={(e) => setPackagesOrder(e.target.value)}>
                <option value="">Sắp xếp theo gói dịch vụ</option>
                <option value="desc">Nhiều gói nhất</option>
                <option value="asc">Ít gói nhất</option>
              </select>
            </div>

            {/* Grid */}
            <div className="photographers-grid">
              {filtered.length === 0 ? (
                <div className="no-results">Không tìm thấy kết quả nào.</div>
              ) : (
                filtered.map((ph) => {
                  const isLiked = favorites.includes(ph.id);
                  return (
                    <div key={ph.id} className="photographer-card">
                      
                      {/* Phần Ảnh Bìa */}
                      <div className="card-header">
                        <img 
                            src={getImageUrl(ph.cover)} 
                            alt="Cover" 
                            className="card-cover" 
                            onError={(e) => e.target.src = 'https://via.placeholder.com/400x200?text=No+Cover'} 
                        />
                        <button className="btn-favorite" onClick={(e) => toggleFavorite(e, ph.id)}>
                          <Heart 
                            size={20} 
                            className={isLiked ? 'active' : ''} 
                            fill={isLiked ? '#ef4444' : 'none'} // Sửa: none để rỗng ruột khi chưa like
                            color={isLiked ? '#ef4444' : '#1f2937'} // Sửa: viền đen/xám khi chưa like cho rõ trên nền trắng
                          />
                        </button>
                      </div>

                      {/* Phần Avatar đè lên */}
                      <div className="card-avatar-wrapper">
                          <img 
                            src={getImageUrl(ph.avatar)} 
                            alt="Avatar" 
                            className="card-avatar" 
                            onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=User'} 
                          />
                      </div>

                      {/* Phần Nội Dung */}
                      <div className="card-body">
                        <h3 className="card-name">{ph.name}</h3>
                        
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
                          <Link to={`/photographer/${ph.username}`} className="btn-view-profile">
                            Xem hồ sơ
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}