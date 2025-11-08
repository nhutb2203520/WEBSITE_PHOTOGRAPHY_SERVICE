import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import './Photographer.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';

export default function Photographer() {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState('');
  const [ratingOrder, setRatingOrder] = useState(''); // "asc" hoặc "desc"
  const [packagesOrder, setPackagesOrder] = useState(''); // "asc" hoặc "desc"

  // Lấy danh sách photographers từ API công khai
  useEffect(() => {
    const fetchPhotographers = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/khachhang/photographers'); // server cổng đúng
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        // Map dữ liệu để có rating, reviews, packages (nếu DB chưa có, tạm random)
        const mapped = data.map(ph => ({
          id: ph._id,
          name: ph.HoTen || 'Chưa cập nhật',
          avatar: ph.Avatar || '/default-avatar.png',
          cover: ph.CoverImage || '/default-cover.jpg',
          rating: ph.rating || (Math.random() * 1 + 4).toFixed(1),
          reviews: ph.reviews || Math.floor(Math.random() * 100) + 1,
          packages: ph.packages || Math.floor(Math.random() * 7) + 1,
        }));

        setPhotographers(mapped);
      } catch (err) {
        console.error('Lỗi khi tải danh sách photographer:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotographers();
  }, []);

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Filtered & Sorted
  let filtered = photographers.filter(ph => ph.name.toLowerCase().includes(search.toLowerCase()));

  if (ratingOrder) {
    filtered = filtered.sort((a, b) => ratingOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating);
  }
  if (packagesOrder) {
    filtered = filtered.sort((a, b) => packagesOrder === 'asc' ? a.packages - b.packages : b.packages - a.packages);
  }

  if (loading) {
    return (
      <>
        <Header />
        <Sidebar />
        <div className="photographers-page">
          <div className="container">
            <div className="loading-state">Đang tải danh sách photographer...</div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Sidebar />
      <div className="photographers-page">
        <section className="photographers">
          <div className="container">
            <div className="section-header">
              <h2>Danh sách Photographer</h2>
              <p>Chọn photographer phù hợp với nhu cầu của bạn</p>
            </div>

            {/* Search & Filters */}
            <div className="search-filter">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select value={ratingOrder} onChange={(e) => setRatingOrder(e.target.value)}>
                <option value="">Số sao</option>
                <option value="asc">Thấp → Cao</option>
                <option value="desc">Cao → Thấp</option>
              </select>
              <select value={packagesOrder} onChange={(e) => setPackagesOrder(e.target.value)}>
                <option value="">Số gói</option>
                <option value="asc">Thấp → Cao</option>
                <option value="desc">Cao → Thấp</option>
              </select>
            </div>

            {/* Grid */}
            <div className="photographers-grid">
              {filtered.map((ph) => (
                <div key={ph.id} className="photographer-card">
                  <div className="photographer-image">
                    <img src={ph.cover} alt={ph.name} />
                    <button className="favorite-btn" onClick={() => toggleFavorite(ph.id)}>
                      <Heart
                        className={favorites.includes(ph.id) ? 'favorited' : ''}
                        fill={favorites.includes(ph.id) ? '#ef4444' : 'none'}
                        color={favorites.includes(ph.id) ? '#ef4444' : '#6b7280'}
                      />
                    </button>
                  </div>

                  <div className="photographer-content">
                    <div className="photographer-info">
                      <img src={ph.avatar} alt={ph.name} className="photographer-avatar" />
                      <span className="photographer-name">{ph.name}</span>
                    </div>

                    <div className="photographer-rating">
                      <Star className="star-icon" fill="#fbbf24" color="#fbbf24" />
                      <span className="rating-number">{ph.rating}</span>
                      <span className="rating-count">({ph.reviews} đánh giá)</span>
                      <span className="rating-count">• {ph.packages} gói</span>
                    </div>

                    <Link to={`/photographer/${ph.id}`} className="btn-view">
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
