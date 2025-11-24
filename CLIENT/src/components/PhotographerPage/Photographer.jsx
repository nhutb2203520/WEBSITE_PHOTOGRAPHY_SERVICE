import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Package, MessageSquare } from 'lucide-react'; // Import thêm icon cho đẹp
import './Photographer.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';

export default function Photographer() {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState('');
  const [ratingOrder, setRatingOrder] = useState('');
  const [packagesOrder, setPackagesOrder] = useState('');

  useEffect(() => {
    const fetchPhotographers = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/khachhang/photographers');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        const mapped = data.map(ph => ({
          id: ph._id,
          username: ph.TenDangNhap || ph._id,
          name: ph.HoTen || 'Chưa cập nhật',
          avatar: ph.Avatar || '/default-avatar.png',
          cover: ph.CoverImage || '/default-cover.jpg',
          rating: ph.rating,      
          reviews: ph.reviews,    
          packages: ph.packages,  
        }));
        setPhotographers(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotographers();
  }, []);

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Filter & Sort Logic
  let filtered = photographers.filter(ph => 
    ph.name.toLowerCase().includes(search.toLowerCase())
  );
  if (ratingOrder) {
    filtered = filtered.sort((a, b) => 
      ratingOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating
    );
  }
  if (packagesOrder) {
    filtered = filtered.sort((a, b) => 
      packagesOrder === 'asc' ? a.packages - b.packages : b.packages - a.packages
    );
  }

  if (loading) return (
    <>
      <Header /><Sidebar />
      <div className="photographers-page"><div className="container"><div className="loading-state"><div className="spinner"></div></div></div></div>
      <Footer />
    </>
  );

  return (
    <>
      <Header />
      <Sidebar />

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
                filtered.map((ph) => (
                  <div key={ph.id} className="photographer-card">
                    
                    {/* Phần Ảnh Bìa */}
                    <div className="card-header">
                      <img src={ph.cover} alt="Cover" className="card-cover" onError={(e) => e.target.src = '/default-cover.jpg'} />
                      <button className="btn-favorite" onClick={() => toggleFavorite(ph.id)}>
                        <Heart size={20} className={favorites.includes(ph.id) ? 'active' : ''} fill={favorites.includes(ph.id) ? '#ef4444' : 'rgba(0,0,0,0.5)'} color={favorites.includes(ph.id) ? '#ef4444' : '#fff'} />
                      </button>
                    </div>

                    {/* Phần Avatar đè lên */}
                    <div className="card-avatar-wrapper">
                         <img src={ph.avatar} alt="Avatar" className="card-avatar" onError={(e) => e.target.src = '/default-avatar.png'} />
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
                ))
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}