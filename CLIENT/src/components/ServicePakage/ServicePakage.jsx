// Package.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import './ServicePagke.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';

export default function Package() {
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState('');
  const [priceOrder, setPriceOrder] = useState('');
  const [servicesOrder, setServicesOrder] = useState('');

  const packages = [
    { id: 1, name: 'Gói Chụp Cưới', cover: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop', rating: 4.9, reviews: 45, price: 300, services: 5 },
    { id: 2, name: 'Gói Chụp Ngoại Cảnh', cover: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=400&fit=crop', rating: 4.8, reviews: 67, price: 250, services: 3 },
    { id: 3, name: 'Gói Chụp Gia Đình', cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop', rating: 5.0, reviews: 89, price: 200, services: 4 },
    { id: 4, name: 'Gói Chụp Sự Kiện', cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=400&fit=crop', rating: 4.9, reviews: 78, price: 400, services: 6 },
    { id: 5, name: 'Gói Chụp Thời Trang', cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop', rating: 4.8, reviews: 92, price: 350, services: 5 },
    { id: 6, name: 'Gói Chụp Concept', cover: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop', rating: 4.9, reviews: 64, price: 280, services: 4 },
    { id: 7, name: 'Gói Chụp Sản Phẩm', cover: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop', rating: 4.7, reviews: 33, price: 150, services: 3 },
    { id: 8, name: 'Gói Chụp Hồ Sơ', cover: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop', rating: 4.8, reviews: 52, price: 180, services: 2 },
    { id: 9, name: 'Gói Chụp Phim Ngắn', cover: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=400&fit=crop', rating: 5.0, reviews: 41, price: 500, services: 7 },
    { id: 10, name: 'Gói Chụp Lifestyle', cover: 'https://images.unsplash.com/photo-1504198458649-3128b932f49f?w=600&h=400&fit=crop', rating: 4.9, reviews: 55, price: 220, services: 4 },
  ];

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Filtered & Sorted
  let filtered = packages.filter(pk => pk.name.toLowerCase().includes(search.toLowerCase()));

  if(priceOrder) {
    filtered = filtered.sort((a,b)=> priceOrder==='asc' ? a.price - b.price : b.price - a.price);
  }

  if(servicesOrder) {
    filtered = filtered.sort((a,b)=> servicesOrder==='asc' ? a.services - b.services : b.services - a.services);
  }

  return (
    <>
      <Header />
      <Sidebar />
      <div className="packages-page">
        <section className="packages">
          <div className="container">
            <div className="section-header">
              <h2>Danh sách Gói Chụp</h2>
              <p>Chọn gói chụp phù hợp với nhu cầu của bạn</p>
            </div>

            {/* Search & Filters */}
            <div className="search-filter">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên..."
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
              />
              <select value={priceOrder} onChange={(e)=>setPriceOrder(e.target.value)}>
                <option value="">Giá</option>
                <option value="asc">Thấp → Cao</option>
                <option value="desc">Cao → Thấp</option>
              </select>
              <select value={servicesOrder} onChange={(e)=>setServicesOrder(e.target.value)}>
                <option value="">Số dịch vụ</option>
                <option value="asc">Thấp → Cao</option>
                <option value="desc">Cao → Thấp</option>
              </select>
            </div>

            {/* Grid */}
            <div className="packages-grid">
              {filtered.map(pk => (
                <div key={pk.id} className="package-card">
                  <div className="package-image">
                    <img src={pk.cover} alt={pk.name} />
                    <button
                      className="favorite-btn"
                      onClick={()=>toggleFavorite(pk.id)}
                    >
                      <Heart
                        className={favorites.includes(pk.id)?'favorited':''}
                        fill={favorites.includes(pk.id)?'#ef4444':'none'}
                        color={favorites.includes(pk.id)?'#ef4444':'#6b7280'}
                      />
                    </button>
                  </div>
                  <div className="package-content">
                    <h3 className="package-name">{pk.name}</h3>
                    <div className="package-rating">
                      <Star className="star-icon" fill="#fbbf24" color="#fbbf24" />
                      <span className="rating-number">{pk.rating}</span>
                      <span className="rating-count">({pk.reviews} đánh giá)</span>
                    </div>
                    <div className="package-info">
                      <span className="package-price">${pk.price}</span>
                      <span className="package-services">{pk.services} dịch vụ</span>
                    </div>
                    <Link to={`/package/${pk.id}`} className="btn-view">Xem chi tiết</Link>
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
