import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Heart,
  MapPin,
  Mail,
  Phone,
  Award,
  Camera,
  Package,
  Image as ImageIcon
} from 'lucide-react';

import './PhotographerDetail.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';

export default function PhotographerDetail() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [photographer, setPhotographer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorited, setIsFavorited] = useState(false);

  // Mock data cho packages
  const packages = [
    {
      id: 1,
      name: 'Gói Chụp Cưới',
      description: 'Gói chụp ảnh cưới cao cấp với đội ngũ chuyên nghiệp',
      price: 300,
      services: ['Chụp ngoại cảnh', 'Chụp studio', 'Dựng video hậu kỳ', 'Album 40 ảnh'],
      image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop',
      rating: 4.9,
      reviews: 45
    },
    {
      id: 2,
      name: 'Gói Chụp Sự Kiện',
      description: 'Chụp ảnh sự kiện chuyên nghiệp, lưu giữ mọi khoảnh khắc đẹp',
      price: 250,
      services: ['Chụp toàn cảnh sự kiện', 'Ảnh hậu trường', 'USB ảnh gốc'],
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop',
      rating: 4.8,
      reviews: 67
    },
    {
      id: 3,
      name: 'Gói Chụp Gia Đình',
      description: 'Lưu giữ khoảnh khắc gia đình ấm áp và hạnh phúc',
      price: 200,
      services: ['Chụp ngoại cảnh', 'Chỉnh sửa 30 ảnh', 'In album'],
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop',
      rating: 5.0,
      reviews: 89
    }
  ];

  // Mock portfolio data
  const portfolio = [
    { id: 1, title: 'Wedding Collection', image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=400&fit=crop', images: 12 },
    { id: 2, title: 'Portrait Series', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=400&fit=crop', images: 8 },
    { id: 3, title: 'Fashion Editorial', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop', images: 15 },
    { id: 4, title: 'Event Coverage', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop', images: 20 },
    { id: 5, title: 'Family Moments', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop', images: 10 },
    { id: 6, title: 'Concept Art', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=400&fit=crop', images: 18 }
  ];

  // Mock reviews data
  const reviews = [
    {
      id: 1,
      user: 'Nguyễn Thị Mai',
      avatar: 'https://i.pravatar.cc/150?img=1',
      rating: 5,
      date: '2 tuần trước',
      comment: 'Photographer rất chuyên nghiệp, ảnh đẹp, tư vấn nhiệt tình. Rất hài lòng với gói chụp cưới!'
    },
    {
      id: 2,
      user: 'Trần Văn Hoàng',
      avatar: 'https://i.pravatar.cc/150?img=2',
      rating: 5,
      date: '1 tháng trước',
      comment: 'Chụp ảnh gia đình rất đẹp, các góc chụp đều ấn tượng. Sẽ giới thiệu cho bạn bè.'
    },
    {
      id: 3,
      user: 'Lê Thu Hà',
      avatar: 'https://i.pravatar.cc/150?img=3',
      rating: 4,
      date: '2 tháng trước',
      comment: 'Dịch vụ tốt, giá cả hợp lý. Ảnh được giao đúng hẹn.'
    }
  ];

  useEffect(() => {
    const fetchPhotographerDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching photographer with username:', username);

        // ✅ FIX: Correct API endpoint
        const res = await fetch(`http://localhost:5000/api/khachhang/photographers/username/${username}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Photographer not found');
          }
          throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();
        console.log('✅ Photographer data received:', data);

        setPhotographer({
          username: data.TenDangNhap || username,
          id: data._id,
          name: data.HoTen || 'Chưa cập nhật',
          avatar: data.Avatar || '/default-avatar.png',
          cover: data.CoverImage || '/default-cover.jpg',
          email: data.Email || 'email@example.com',
          phone: data.SDT || 'Chưa cập nhật',
          address: data.DiaChi || 'Việt Nam',
          bio: data.Bio || 'Photographer chuyên nghiệp với nhiều năm kinh nghiệm',
          experience: data.Experience || '5+ năm',
          specialties: data.Specialties || ['Wedding', 'Portrait', 'Event'],
          rating: data.rating || 4.9,
          reviews: data.reviews || 156,
          packages: data.packages || 8,
          totalWorks: data.totalWorks || 250
        });

      } catch (err) {
        console.error('❌ Error fetching photographer:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchPhotographerDetail();
    }
  }, [username]);

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  if (loading) {
    return (
      <>
        <Header />
        <Sidebar />
        <div className="photographer-detail-page">
          <div className="container">
            <div className="loading-state">Đang tải thông tin photographer...</div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !photographer) {
    return (
      <>
        <Header />
        <Sidebar />
        <div className="photographer-detail-page">
          <div className="container">
            <div className="error-state">
              <h3>❌ Không tìm thấy photographer</h3>
              <p>Username: {username}</p>
              <p>Error: {error}</p>
              <button onClick={() => navigate('/photographers')} className="btn-back">
                Quay lại danh sách
              </button>
            </div>
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

      <div className="photographer-detail-page">

        {/* COVER & PROFILE */}
        <div className="photographer-cover">
          <img src={photographer.cover} alt={photographer.name} className="cover-image" />

          <div className="cover-overlay">
            <div className="container">
              <div className="photographer-profile">
                <img src={photographer.avatar} alt={photographer.name} className="profile-avatar" />

                <div className="profile-info">
                  <h1>{photographer.name}</h1>

                  <div className="profile-meta">
                    <div className="rating-display">
                      <Star fill="#fbbf24" color="#fbbf24" size={20} />
                      <span className="rating-number">{photographer.rating}</span>
                      <span className="rating-count">({photographer.reviews} đánh giá)</span>
                    </div>

                    <div className="meta-item">
                      <MapPin size={16} />
                      <span>{photographer.address}</span>
                    </div>
                  </div>
                </div>

                <button className="btn-favorite" onClick={toggleFavorite}>
                  <Heart
                    fill={isFavorited ? '#ef4444' : 'none'}
                    color={isFavorited ? '#ef4444' : '#fff'}
                    size={24}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="photographer-stats">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <Camera size={24} />
                <div>
                  <div className="stat-number">{photographer.totalWorks}+</div>
                  <div className="stat-label">Tác phẩm</div>
                </div>
              </div>

              <div className="stat-item">
                <Package size={24} />
                <div>
                  <div className="stat-number">{photographer.packages}</div>
                  <div className="stat-label">Gói dịch vụ</div>
                </div>
              </div>

              <div className="stat-item">
                <Award size={24} />
                <div>
                  <div className="stat-number">{photographer.experience}</div>
                  <div className="stat-label">Kinh nghiệm</div>
                </div>
              </div>

              <div className="stat-item">
                <Star size={24} />
                <div>
                  <div className="stat-number">{photographer.rating}/5.0</div>
                  <div className="stat-label">Đánh giá</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="tabs-section">
          <div className="container">
            <div className="tabs-nav">
              <button
                className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => setActiveTab('about')}
              >
                Giới thiệu
              </button>

              <button
                className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
                onClick={() => setActiveTab('packages')}
              >
                Gói dịch vụ
              </button>

              <button
                className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
                onClick={() => setActiveTab('portfolio')}
              >
                Hồ sơ tác phẩm
              </button>

              <button
                className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Đánh giá
              </button>
            </div>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="tab-content">
          <div className="container">

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="about-content">
                <div className="about-grid">
                  <div className="about-main">
                    <h3>Giới thiệu</h3>
                    <p>{photographer.bio}</p>
                    
                    <h3>Chuyên môn</h3>
                    <div className="specialties-tags">
                      {photographer.specialties.map((specialty, index) => (
                        <span key={index} className="specialty-tag">{specialty}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="about-sidebar">
                    <div className="contact-card">
                      <h3>Thông tin liên hệ</h3>
                      <div className="contact-item">
                        <Mail size={18} />
                        <span>{photographer.email}</span>
                      </div>
                      <div className="contact-item">
                        <Phone size={18} />
                        <span>{photographer.phone}</span>
                      </div>
                      <div className="contact-item">
                        <MapPin size={18} />
                        <span>{photographer.address}</span>
                      </div>
                      <button className="btn-contact">Liên hệ ngay</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Packages Tab */}
            {activeTab === 'packages' && (
              <div className="packages-content">
                <div className="packages-grid">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="package-card">
                      <div className="package-image">
                        <img src={pkg.image} alt={pkg.name} />
                      </div>
                      <div className="package-body">
                        <h4>{pkg.name}</h4>
                        <p className="package-description">{pkg.description}</p>
                        
                        <div className="package-rating">
                          <Star fill="#fbbf24" color="#fbbf24" size={16} />
                          <span>{pkg.rating}</span>
                          <span>({pkg.reviews} đánh giá)</span>
                        </div>

                        <ul className="package-services">
                          {pkg.services.map((service, idx) => (
                            <li key={idx}>{service}</li>
                          ))}
                        </ul>

                        <div className="package-footer">
                          <span className="package-price">${pkg.price}</span>
                          <button className="btn-book">Đặt ngay</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div className="portfolio-content">
                <div className="portfolio-grid">
                  {portfolio.map(work => (
                    <div key={work.id} className="portfolio-item">
                      <img src={work.image} alt={work.title} />
                      <div className="portfolio-overlay">
                        <h4>{work.title}</h4>
                        <div className="portfolio-info">
                          <ImageIcon size={16} />
                          <span>{work.images} ảnh</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="reviews-content">
                <div className="reviews-summary">
                  <div className="rating-overview">
                    <div className="rating-big">{photographer.rating}</div>
                    <div>
                      <div className="stars-display">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} fill="#fbbf24" color="#fbbf24" size={20} />
                        ))}
                      </div>
                      <div className="rating-text">{photographer.reviews} đánh giá</div>
                    </div>
                  </div>
                </div>

                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review.id} className="review-item">
                      <img src={review.avatar} alt={review.user} className="review-avatar" />
                      <div className="review-content">
                        <div className="review-header">
                          <div>
                            <h4>{review.user}</h4>
                            <span className="review-date">{review.date}</span>
                          </div>
                          <div className="review-stars">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} fill="#fbbf24" color="#fbbf24" size={16} />
                            ))}
                          </div>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}