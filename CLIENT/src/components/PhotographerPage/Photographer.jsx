// Photographer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import './Photographer.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';

export default function Photographer() {
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState('');
  const [ratingOrder, setRatingOrder] = useState(''); // "asc" hoặc "desc"
  const [packagesOrder, setPackagesOrder] = useState(''); // "asc" hoặc "desc"

  const photographers = [
    { id: 1, name: 'Nguyễn Văn Tùng', avatar: 'https://i.pravatar.cc/150?img=12', cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop', rating: 4.9, reviews: 45, packages: 5 },
    { id: 2, name: 'Nắng', avatar: 'https://i.pravatar.cc/150?img=25', cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=400&fit=crop', rating: 4.8, reviews: 67, packages: 3 },
    { id: 3, name: 'Trung', avatar: 'https://i.pravatar.cc/150?img=33', cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop', rating: 5.0, reviews: 89, packages: 7 },
    { id: 4, name: 'Mưa', avatar: 'https://i.pravatar.cc/150?img=47', cover: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop', rating: 4.9, reviews: 78, packages: 4 },
    { id: 5, name: 'Hoàng Minh', avatar: 'https://i.pravatar.cc/150?img=56', cover: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop', rating: 4.8, reviews: 92, packages: 6 },
    { id: 6, name: 'Vũ Thu Phương', avatar: 'https://i.pravatar.cc/150?img=38', cover: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop', rating: 4.9, reviews: 64, packages: 5 },
    { id: 7, name: 'Nguyễn Giang', avatar: 'https://i.pravatar.cc/150?img=10', cover: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=400&fit=crop', rating: 4.7, reviews: 33, packages: 2 },
    { id: 8, name: 'Minh Nhựt', avatar: 'https://i.pravatar.cc/150?img=15', cover: 'https://images.unsplash.com/photo-1504198458649-3128b932f49f?w=600&h=400&fit=crop', rating: 4.8, reviews: 52, packages: 4 },
    { id: 9, name: 'Lê Huyền', avatar: 'https://i.pravatar.cc/150?img=20', cover: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=400&fit=crop', rating: 5.0, reviews: 41, packages: 3 },
    { id: 10, name: 'J97', avatar: 'https://i.pravatar.cc/150?img=30', cover: 'https://images.unsplash.com/photo-1532009324734-20a7a5813719?w=600&h=400&fit=crop', rating: 4.9, reviews: 55, packages: 6 },
  ];

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Filtered & Sorted
  let filtered = photographers.filter(ph => ph.name.toLowerCase().includes(search.toLowerCase()));

  if(ratingOrder) {
    filtered = filtered.sort((a,b) => ratingOrder==='asc' ? a.rating - b.rating : b.rating - a.rating);
  }

  if(packagesOrder) {
    filtered = filtered.sort((a,b) => packagesOrder==='asc' ? a.packages - b.packages : b.packages - a.packages);
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
                onChange={(e)=>setSearch(e.target.value)}
              />
              <select value={ratingOrder} onChange={(e)=>setRatingOrder(e.target.value)}>
                <option value="">Số sao</option>
                <option value="asc">Thấp → Cao</option>
                <option value="desc">Cao → Thấp</option>
              </select>
              <select value={packagesOrder} onChange={(e)=>setPackagesOrder(e.target.value)}>
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
                    <button
                      className="favorite-btn"
                      onClick={() => toggleFavorite(ph.id)}
                    >
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
