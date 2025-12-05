import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, Heart, MapPin, Mail, Phone,
  Camera, Package, Image as ImageIcon, CheckCircle2,
  AlertTriangle, ChevronDown, MessageCircle // ✅ Import thêm icon MessageCircle
} from 'lucide-react';
import { useSelector } from 'react-redux'; // ✅ Import Redux để lấy user hiện tại
import { toast } from 'react-toastify'; // ✅ Import Toast để thông báo

import './PhotographerDetail.css';

// Import MainLayout
import MainLayout from '../../layouts/MainLayout/MainLayout';

// ✅ Import API Chat và Component Chat
import chatApi from '../../apis/chatApi';
import ChatMessage from '../ChatMessage/ChatMessage'; // Kiểm tra đường dẫn này khớp với dự án của bạn

export default function PhotographerDetail() {
  const { username } = useParams();
  const navigate = useNavigate();
  
  // ✅ Lấy thông tin user đang đăng nhập
  const { user } = useSelector(state => state.user);

  // --- STATE ---
  const [photographer, setPhotographer] = useState(null);
  const [packages, setPackages] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorited, setIsFavorited] = useState(false);

  // Phân trang
  const [visibleWorks, setVisibleWorks] = useState(8);    
  const [visiblePackages, setVisiblePackages] = useState(6); 

  // ✅ STATE QUẢN LÝ CHAT
  const [showChat, setShowChat] = useState(false);
  const [chatConversation, setChatConversation] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // --- HELPER FUNCTIONS ---
  const getImageUrl = (img) => {
    if (!img) return '';
    // 🔥 [FIX] Đã sửa lỗi ở dòng này: return img thay vì return imageUrl
    if (img.startsWith('http')) return img; 
    return `http://localhost:5000${img}`;
  };

  const formatPriceRange = (dichVu) => {
    if (!dichVu || dichVu.length === 0) return "Liên hệ";
    const prices = dichVu.map(s => Number(s.Gia)).filter(p => p > 0);
    if (prices.length === 0) return "Liên hệ";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `${min.toLocaleString("vi-VN")} đ`;
    return `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} đ`;
  };

  const handleLoadMoreWorks = () => setVisibleWorks(prev => prev + 8);
  const handleLoadMorePackages = () => setVisiblePackages(prev => prev + 6);

  // ✅ HÀM XỬ LÝ BẮT ĐẦU CHAT
  const handleStartChat = async () => {
    if (!user) {
        toast.info("Vui lòng đăng nhập để nhắn tin!");
        navigate('/signin', { state: { from: `/photographer/${username}` } });
        return;
    }

    if (!photographer) return;

    // ID của nhiếp ảnh gia (đã lấy từ API fetchAllData)
    const photographerId = photographer._id;
    const myId = user._id || user.id;

    if (photographerId === myId) {
        toast.info("Bạn không thể nhắn tin cho chính mình.");
        return;
    }

    setIsCreatingChat(true);
    try {
        const res = await chatApi.createConversation(myId, photographerId);
        const conversationData = res.data || res;
        setChatConversation(conversationData);
        setShowChat(true);
    } catch (err) {
        console.error("Lỗi tạo hội thoại:", err);
        toast.error("Không thể kết nối trò chuyện.");
    } finally {
        setIsCreatingChat(false);
    }
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const phRes = await fetch(`http://localhost:5000/api/khachhang/photographers/username/${username}`);
        if (!phRes.ok) throw new Error('Không tìm thấy nhiếp ảnh gia.');
        const phData = await phRes.json();
        const photographerId = phData._id;

        const [pkgRes, workRes, revRes] = await Promise.all([
          fetch(`http://localhost:5000/api/service-packages`), 
          fetch(`http://localhost:5000/api/worksprofile/user/${photographerId}`),
          fetch(`http://localhost:5000/api/reviews?photographerId=${photographerId}`) 
        ]);

        const pkgJson = pkgRes.ok ? await pkgRes.json() : [];
        const workJson = workRes.ok ? await workRes.json() : [];
        const revJson = revRes.ok ? await revRes.json() : [];

        let allPackages = Array.isArray(pkgJson) ? pkgJson : (pkgJson.data || pkgJson.packages || []);
        let myWorks = Array.isArray(workJson) ? workJson : (workJson.works || []);
        let myReviews = Array.isArray(revJson) ? revJson : (revJson.reviews || []);

        const myPackages = allPackages.filter(p => {
             const pId = (typeof p.PhotographerId === 'object' && p.PhotographerId !== null) 
                ? p.PhotographerId._id 
                : p.PhotographerId;
             return pId === photographerId;
        });

        setPhotographer({
          ...phData,
          rating: phData.rating || 5.0,
          reviewsCount: myReviews.length || 0,
          packagesCount: myPackages.length,
          bio: phData.Bio || `Xin chào, tôi là ${phData.HoTen}.`,
          specialties: phData.Specialties || ['Wedding', 'Portrait', 'Event']
        });

        setPackages(myPackages);
        setPortfolio(myWorks);
        setReviews(myReviews);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchAllData();
  }, [username]);

  const toggleFavorite = () => setIsFavorited(!isFavorited);

  if (loading) return (
    <MainLayout>
      <div className="photographer-detail-page">
          <div className="container loading-container">
              <div className="spinner"></div>
          </div>
      </div>
    </MainLayout>
  );

  if (error || !photographer) return (
    <MainLayout>
      <div className="photographer-detail-page">
          <div className="container error-container">
              <h3>❌ {error}</h3>
              <button onClick={() => navigate('/photographers')} className="btn-back">Quay lại</button>
          </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="photographer-detail-page">

        {/* PROFILE CARD */}
        <div className="container photographer-profile-card">
          
          <div className="photographer-cover-banner">
            <img 
              src={getImageUrl(photographer.CoverImage) || '/default-cover.jpg'} 
              alt="Cover" 
              className="cover-image" 
              onError={(e) => e.target.src = '/default-cover.jpg'}
            />
          </div>

          <div className="photographer-info-section">
            <div className="photographer-profile-compact">
              
              <img 
                src={getImageUrl(photographer.Avatar) || '/default-avatar.png'} 
                alt="Avatar" 
                className="profile-avatar-compact" 
                onError={(e) => e.target.src = '/default-avatar.png'}
              />

              <button className={`btn-favorite-compact ${isFavorited ? 'active' : ''}`} onClick={toggleFavorite}>
                <Heart size={22} fill={isFavorited ? '#ef4444' : 'none'} color={isFavorited ? '#ef4444' : '#6b7280'} />
              </button>

              <h1>{photographer.HoTen}</h1>

              <div className="profile-meta-compact">
                <div className="rating-display-compact">
                  <Star fill="#fbbf24" color="#fbbf24" size={18} />
                  <span className="rating-number">{Number(photographer.rating).toFixed(1)}</span>
                  <span className="rating-count">({photographer.reviewsCount} đánh giá)</span>
                </div>
                {photographer.DiaChi && (
                  <>
                    <span className="meta-divider">•</span>
                    <div className="meta-item-compact">
                      <MapPin size={16} /> <span>{photographer.DiaChi}</span>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="photographer-stats">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item"><Camera size={24} /><div><div className="stat-number">{portfolio.length}</div><div className="stat-label">Tác phẩm</div></div></div>
              <div className="stat-item"><Package size={24} /><div><div className="stat-number">{packages.length}</div><div className="stat-label">Gói dịch vụ</div></div></div>
              <div className="stat-item"><Star size={24} /><div><div className="stat-number">{Number(photographer.rating).toFixed(1)}/5</div><div className="stat-label">Xếp hạng</div></div></div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs-section">
          <div className="container">
            <div className="tabs-nav">
              {['about', 'packages', 'portfolio', 'reviews'].map(tab => (
                  <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                    {tab === 'about' && 'Giới thiệu'}
                    {tab === 'packages' && 'Gói dịch vụ'}
                    {tab === 'portfolio' && 'Hồ sơ tác phẩm'}
                    {tab === 'reviews' && 'Đánh giá'}
                  </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="tab-content">
          <div className="container">

            {/* ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="about-grid">
                <div className="about-main">
                  <h3>Giới thiệu</h3><p style={{whiteSpace: 'pre-line'}}>{photographer.bio}</p>
                  <h3>Chuyên môn</h3>
                  <div className="specialties-tags">{photographer.specialties?.map((tag, idx) => <span key={idx} className="specialty-tag">{tag}</span>)}</div>
                </div>
                
                {/* SIDEBAR LIÊN HỆ */}
                <div className="about-sidebar">
                  <div className="contact-card">
                    <h3>Thông tin liên hệ</h3>
                    <div className="contact-item"><Mail size={18} /> <span>{photographer.Email}</span></div>
                    <div className="contact-item"><Phone size={18} /> <span>{photographer.SoDienThoai || 'Chưa cập nhật'}</span></div>
                    <div className="contact-item"><MapPin size={18} /> <span>{photographer.DiaChi || 'Việt Nam'}</span></div>
                    
                    {/* ✅ KHU VỰC NÚT LIÊN HỆ & CHAT */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                

                        {/* ✅ Nút Chat Mới */}
                        <button 
                            className="btn-contact" 
                            style={{ 
                                flex: '10 10 10', 
                                padding: '20px 50px', 
                                backgroundColor: '#3b82f6', // Màu xanh khác để phân biệt
                                opacity: isCreatingChat ? 0.7 : 1
                            }}
                            onClick={handleStartChat}
                            disabled={isCreatingChat}
                            title="Nhắn tin"
                        >
                            <MessageCircle size={20} />
                        </button>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* PACKAGES TAB */}
            {activeTab === 'packages' && (
              <div className="packages-section">
                <div className="packages-grid">
                  {packages.length > 0 ? packages.slice(0, visiblePackages).map(pkg => (
                    <div key={pkg._id} className="package-card">
                      <div className="package-image">
                        <img src={getImageUrl(pkg.AnhBia || pkg.Images?.[0])} alt={pkg.TenGoi} onError={(e) => e.target.src = '/default-package.jpg'}/>
                        <div className="package-badge">{pkg.LoaiGoi || 'Other'}</div>
                        <button className="favorite-btn-small"><Heart size={18} color="white" /></button>
                      </div>
                      <div className="package-body">
                        <div className="package-header-row">
                          <h3 className="package-name">{pkg.TenGoi}</h3>
                          <div className="package-rating"><Star className="star-icon" fill="#fbbf24" color="#fbbf24" size={14} /><span>{(pkg.DanhGia || 0).toFixed(1)}</span><span className="review-count">({pkg.SoLuotDanhGia || 0})</span></div>
                        </div>
                        <div className="package-location-row"><MapPin size={14} /><span>{pkg.baseLocation?.city || pkg.baseLocation?.address || 'Toàn quốc'}</span></div>
                        <p className="package-description">{pkg.MoTa?.substring(0, 100)}...</p>
                        <ul className="package-services-list">{pkg.DichVu?.slice(0, 2).map((dv, i) => (<li key={i}><CheckCircle2 size={12} /> {typeof dv === 'string' ? dv : dv.name}</li>))}</ul>
                        <div className="package-footer-info">
                           <span className="package-price">{formatPriceRange(pkg.DichVu)}</span>
                           <div className="package-stats-col">
                              <span className="booking-count-text"><Camera size={14} /> {pkg.SoLuongDaDat || 0} lượt đặt</span>
                              {pkg.SoLuongKhieuNai > 0 ? (<span className="complaint-text danger"><AlertTriangle size={14} /> {pkg.SoLuongKhieuNai} khiếu nại</span>) : (<span className="complaint-text safe"><AlertTriangle size={14} /> 0 khiếu nại</span>)}
                           </div>
                        </div>
                        <div className="card-divider"></div>
                        <div className="photographer-mini-profile"><img src={getImageUrl(photographer.Avatar)} alt="Avatar" onError={(e)=>e.target.src='/default-avatar.png'}/><span>{photographer.HoTen}</span></div>
                        <Link to={`/package/${pkg._id}`} className="btn-view">Xem chi tiết</Link>
                      </div>
                    </div>
                  )) : <div className="empty-state" style={{gridColumn: '1 / -1'}}><Package size={48} style={{margin:'auto', color:'#ccc'}}/><p>Chưa có gói dịch vụ.</p></div>}
                </div>
                {visiblePackages < packages.length && (<div className="load-more-container"><button className="btn-load-more" onClick={handleLoadMorePackages}>Xem thêm gói dịch vụ <ChevronDown size={16} /></button></div>)}
              </div>
            )}

            {/* PORTFOLIO TAB */}
            {activeTab === 'portfolio' && (
              <div className="portfolio-section">
                <div className="portfolio-grid-layout">
                  {portfolio.length > 0 ? portfolio.slice(0, visibleWorks).map(work => (
                    <div key={work._id} className="portfolio-card" onClick={() => navigate(`/workprofile/${work._id}`)}>
                      <div className="portfolio-card-image">
                        <img src={getImageUrl(work.images?.[0])} alt={work.title} onError={(e) => e.target.src = '/default-work.jpg'}/>
                        <div className="portfolio-count-badge"><ImageIcon size={14} /> {work.images?.length}</div>
                      </div>
                      <div className="portfolio-card-body">
                        <h4 className="portfolio-title">{work.title}</h4>
                        <span className="portfolio-date">{new Date(work.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  )) : <div className="empty-state" style={{gridColumn: '1 / -1'}}><ImageIcon size={48} style={{margin: '0 auto 10px', color:'#e5e7eb'}}/><p>Chưa có tác phẩm nào.</p></div>}
                </div>
                {visibleWorks < portfolio.length && (<div className="load-more-container"><button className="btn-load-more" onClick={handleLoadMoreWorks}>Xem thêm tác phẩm <ChevronDown size={16} /></button></div>)}
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="reviews-content">
                <div className="reviews-summary">
                  <div className="rating-overview">
                     <div className="rating-big">{Number(photographer.rating).toFixed(1)}</div>
                     <div>
                        <div className="stars-display">{[1,2,3,4,5].map(s => <Star key={s} size={20} fill={s <= Math.round(photographer.rating) ? "#fbbf24" : "#e5e7eb"} color="#e5e7eb"/>)}</div>
                        <div className="rating-text">Dựa trên {reviews.length} đánh giá</div>
                     </div>
                  </div>
                </div>
                <div className="reviews-list">
                  {reviews.length > 0 ? reviews.map((review, index) => (
                    <div key={index} className="review-item">
                      <img src={getImageUrl(review.CustomerId?.Avatar)} alt="User" className="review-avatar" onError={(e)=>e.target.src='/default-avatar.png'}/>
                      <div className="review-content">
                         <div className="review-header">
                           <h4>{review.CustomerId?.HoTen || 'Ẩn danh'}</h4>
                           <div className="review-stars">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.Rating ? "#fbbf24" : "#e5e7eb"} color="#e5e7eb"/>)}</div>
                         </div>
                         <p className="review-comment">{review.Comment}</p>
                      </div>
                    </div>
                  )) : <div className="empty-state"><p>Chưa có đánh giá nào.</p></div>}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ✅ RENDER MODAL CHAT KHI ĐƯỢC KÍCH HOẠT */}
      {showChat && chatConversation && (
        <ChatMessage 
            conversation={chatConversation}
            currentUser={user}
            onClose={() => setShowChat(false)}
        />
      )}

    </MainLayout>
  );
}