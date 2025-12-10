import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, Heart, MapPin, Check, Phone, Camera, ArrowLeft, Share2, 
  MessageCircle, ChevronLeft, ChevronRight, Truck, CalendarDays, ChevronDown, X
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios'; 
import './ServicePackageDetail.css';

// Import Layout
import MainLayout from '../../layouts/MainLayout/MainLayout';

// Import APIs
import servicePackageApi from '../../apis/ServicePackageService';
import chatApi from '../../apis/chatApi'; 

// Import Component Chat
import ChatMessage from '../ChatMessage/ChatMessage'; 

export default function ServicePackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.user);
  
  // --- STATE DỮ LIỆU ---
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State cho ảnh chính của gói (Banner)
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // STATE ĐÁNH GIÁ (REVIEW)
  const [reviews, setReviews] = useState([]);
  const [visibleReviews, setVisibleReviews] = useState(3);

  // STATE CHO ZOOM ẢNH REVIEW
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewImagesList, setReviewImagesList] = useState([]); 
  const [currentReviewImgIndex, setCurrentReviewImgIndex] = useState(0);

  // STATE CHAT
  const [showChat, setShowChat] = useState(false);
  const [chatConversation, setChatConversation] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    fetchPackageDetail();
  }, [id]);

  const fetchPackageDetail = async () => {
    try {
      setLoading(true);
      // 1. Lấy thông tin gói dịch vụ
      const data = await servicePackageApi.getPackageById(id);
      setPackageData(data);

      // 2. Lấy danh sách đánh giá của Nhiếp ảnh gia
      if (data && data.PhotographerId) {
          const photographerId = typeof data.PhotographerId === 'object' 
            ? data.PhotographerId._id 
            : data.PhotographerId;
          
          fetchReviews(photographerId);
      }
    } catch (error) {
      console.error('❌ Error fetching package detail:', error);
      toast.error('Không thể tải thông tin gói dịch vụ');
      navigate('/service-package');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (photographerId) => {
      try {
          const res = await axios.get(`http://localhost:5000/api/reviews?photographerId=${photographerId}`);
          const fetchedData = res.data?.data || []; 
          const approvedReviews = Array.isArray(fetchedData) ? fetchedData : [];
          setReviews(approvedReviews);
      } catch (error) {
          console.error("❌ Lỗi lấy đánh giá:", error);
          setReviews([]);
      }
  };

  const handleLoadMoreReviews = () => {
      setVisibleReviews(prev => prev + 5);
  };

  // --- CÁC HÀM TIỆN ÍCH ---
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://via.placeholder.com/1200x600?text=No+Image";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `http://localhost:5000/${imageUrl.replace(/^\/+/, "")}`;
  };

  const getAllImages = () => {
    if (!packageData) return [];
    const allImages = [];
    if (packageData.AnhBia) allImages.push(packageData.AnhBia);
    if (packageData.Images && Array.isArray(packageData.Images)) {
      allImages.push(...packageData.Images);
    }
    return allImages;
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

  const formatPrice = (price) => {
    return Number(price).toLocaleString("vi-VN");
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: packageData?.TenGoi,
        text: packageData?.MoTa,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã copy link!');
    }
  };

  const handleBookNow = () => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để đặt hàng');
      navigate('/signin', { state: { from: `/package/${id}` } });
      return;
    }
    navigate('/order-service', { state: { packageId: id } });
  };

  // --- LOGIC CHAT ---
  const handleContactPhotographer = async () => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để liên hệ');
      navigate('/signin', { state: { from: `/package/${id}` } });
      return;
    }
    const photographer = packageData?.PhotographerId;
    if (!photographer) {
        toast.error("Không tìm thấy thông tin nhiếp ảnh gia");
        return;
    }
    const photographerId = photographer._id || photographer;
    const myId = user._id || user.id;

    if (photographerId === myId) {
        toast.info("Bạn không thể nhắn tin cho chính mình!");
        return;
    }
    setIsCreatingChat(true);
    try {
        const res = await chatApi.createConversation(myId, photographerId);
        const conversationData = res.data || res;
        setChatConversation(conversationData);
        setShowChat(true); 
    } catch (error) {
        console.error("Lỗi tạo hội thoại:", error);
        toast.error("Không thể kết nối trò chuyện lúc này.");
    } finally {
        setIsCreatingChat(false);
    }
  };

  // --- LOGIC ẢNH GÓI (BANNER) ---
  const nextImage = () => {
    const images = getAllImages();
    if (images.length > 0) setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = () => {
    const images = getAllImages();
    if (images.length > 0) setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // LOGIC ZOOM ẢNH REVIEW
  const openReviewImageModal = (images, index) => {
    setReviewImagesList(images);
    setCurrentReviewImgIndex(index);
    setShowReviewModal(true);
  };

  const nextReviewImage = (e) => {
    e.stopPropagation();
    if (reviewImagesList.length > 0) {
      setCurrentReviewImgIndex((prev) => (prev + 1) % reviewImagesList.length);
    }
  };

  const prevReviewImage = (e) => {
    e.stopPropagation();
    if (reviewImagesList.length > 0) {
      setCurrentReviewImgIndex((prev) => (prev - 1 + reviewImagesList.length) % reviewImagesList.length);
    }
  };


  if (loading) return <MainLayout><div className="package-detail-loading"><div className="spinner"></div><p>Đang tải...</p></div></MainLayout>;
  if (!packageData) return <MainLayout><div className="package-detail-error"><h2>Không tìm thấy gói</h2><Link to="/service-package" className="btn-back">Quay lại</Link></div></MainLayout>;

  const { min: minPrice, max: maxPrice } = getPriceRange(packageData.DichVu);
  const images = getAllImages();

  return (
    <MainLayout>
      <div className="package-detail-page">
        {/* Container cho nút Back */}
        <div className="container">
          <button onClick={() => navigate(-1)} className="btn-back-nav">
            <ArrowLeft size={20} /> Quay lại
          </button>
        </div>

        {/* Container chính */}
        <div className="container">
          <div className="package-detail-content">
            
            {/* --- CỘT TRÁI (Nội dung chính) --- */}
            <div className="package-images-section">
              
              {/* Ảnh chính & Thumbnail */}
              <div className="package-gallery-wrapper">
                <div className="package-main-image">
                  {images.length > 0 ? (
                    <img src={getImageUrl(images[currentImageIndex])} alt={packageData.TenGoi} onClick={() => setShowImageModal(true)} />
                  ) : (
                    <img src="https://via.placeholder.com/1200x600?text=Chưa+có+ảnh" alt="No images" />
                  )}
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="image-nav-btn prev"><ChevronLeft size={24} /></button>
                      <button onClick={nextImage} className="image-nav-btn next"><ChevronRight size={24} /></button>
                      <div className="image-counter">{currentImageIndex + 1} / {images.length}</div>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="thumbnail-gallery">
                    {images.map((img, index) => (
                      <div key={index} onClick={() => setCurrentImageIndex(index)} className={`thumbnail-item ${currentImageIndex === index ? 'active' : ''}`}>
                        <img src={getImageUrl(img)} alt={`Thumb ${index}`} onError={(e) => { e.target.src = "https://via.placeholder.com/120x80?text=Err"; }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mô tả */}
              <section className="package-section">
                <h2>Mô tả chi tiết</h2>
                <p className="package-description">{packageData.MoTa}</p>
                <div className="flex gap-4 mt-4 items-center flex-wrap">
                    <div className="created-date">
                        <CalendarDays size={16} />
                        <span>Đăng ngày: {new Date(packageData.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
              </section>

              {/* Dịch vụ bao gồm */}
              <section className="package-section">
                <h2>Dịch vụ bao gồm</h2>
                <div className="services-grid">
                  {packageData.DichVu?.map((service, index) => (
                    <div key={index} className={`service-card ${selectedService === index ? 'selected' : ''}`} onClick={() => setSelectedService(index)}>
                      <div className="service-icon"><Check size={18} /></div>
                      <div className="service-info">
                        <h3>{service.name}</h3>
                        <p className="service-price">{formatPrice(service.Gia)} VNĐ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Địa điểm */}
              {packageData.baseLocation && (packageData.baseLocation.address || packageData.baseLocation.city) && (
                <section className="package-section">
                  <h2>Khu vực hoạt động</h2>
                  <div className="info-box-styled">
                    <div className="info-row">
                      <MapPin size={20} className="text-red-500 flex-shrink-0" />
                      <div>
                        <strong>Địa điểm cơ sở: </strong>
                        <span>{[packageData.baseLocation.address, packageData.baseLocation.district, packageData.baseLocation.city].filter(Boolean).join(', ')}</span>
                        {packageData.baseLocation.mapLink && (
                          <a href={packageData.baseLocation.mapLink} target="_blank" rel="noopener noreferrer" className="map-link-text">(Xem bản đồ)</a>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Phí di chuyển */}
              {packageData.travelFeeConfig && packageData.travelFeeConfig.enabled && (
                <section className="package-section">
                  <h2>Chính sách phí di chuyển</h2>
                  <div className="travel-fee-card">
                    <div className="tf-header"><Truck size={24} /><span>Có tính phí di chuyển ngoại thành/xa</span></div>
                    <div className="tf-body">
                      <div className="tf-item"><span className="tf-label">Miễn phí:</span><span className="tf-value">{packageData.travelFeeConfig.freeDistanceKm} km</span></div>
                      <div className="tf-item"><span className="tf-label">Phí:</span><span className="tf-value">{formatPrice(packageData.travelFeeConfig.feePerKm)} đ/km</span></div>
                    </div>
                  </div>
                </section>
              )}

              {/* ĐÁNH GIÁ (REVIEW) */}
              <section className="package-section" id="reviews-section">
                <div className="reviews-header-row">
                   <h2>Đánh giá từ khách hàng ({reviews.length})</h2>
                   <div className="reviews-rating-badge">
                      <span>{(packageData.DanhGia || 0).toFixed(1)}</span> <Star fill="#fbbf24" stroke="#fbbf24" size={20} />
                   </div>
                </div>
                
                {reviews.length > 0 ? (
                  <div className="reviews-list-container">
                    {reviews.slice(0, visibleReviews).map((review, index) => (
                      <div key={index} className="review-item-card">
                        <div className="review-avatar-col">
                          <img 
                            src={getImageUrl(review.CustomerId?.Avatar)} 
                            alt="User" 
                            className="review-user-avatar" 
                            onError={(e) => e.target.src = "https://via.placeholder.com/50?text=U"}
                          />
                        </div>
                        <div className="review-content-col">
                          <div className="review-header">
                            <span className="review-user-name">{review.CustomerId?.HoTen || 'Người dùng ẩn danh'}</span>
                            <div className="review-stars-row">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} fill={i < review.Rating ? "#fbbf24" : "#e5e7eb"} color={i < review.Rating ? "#fbbf24" : "#e5e7eb"}/>
                              ))}
                            </div>
                          </div>
                          <p className="review-text">{review.Comment}</p>
                          
                          {/* Ảnh review */}
                          {review.Images && review.Images.length > 0 && (
                            <div className="review-images-row">
                              {review.Images.map((img, idx) => (
                                <img 
                                  key={idx} 
                                  src={getImageUrl(img)} 
                                  alt="Review" 
                                  className="review-img-thumb" 
                                  onClick={() => openReviewImageModal(review.Images, idx)}
                                />
                              ))}
                            </div>
                          )}
                          <span className="review-date">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    ))}

                    {visibleReviews < reviews.length && (
                      <div className="load-more-reviews-wrapper">
                        <button className="btn-load-more-reviews" onClick={handleLoadMoreReviews}>
                          Xem thêm đánh giá <ChevronDown size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-reviews-state">
                    <p>Chưa có đánh giá nào cho gói/nhiếp ảnh gia này.</p>
                  </div>
                )}
              </section>

              {/* Photographer Info */}
              {packageData.PhotographerId && (
                <section className="package-section photographer-section">
                  <h2>Thông tin Photographer</h2>
                  <div className="photographer-card">
                    <div className="photographer-avatar-wrapper">
                      <img src={getImageUrl(packageData.PhotographerId?.Avatar)} alt={packageData.PhotographerId.HoTen} className="photographer-avatar" onError={(e) => { e.target.src = "https://via.placeholder.com/200?text=Avatar"; }} />
                    </div>
                    <h3 className="photographer-name">{packageData.PhotographerId.HoTen}</h3>
                    <p className="photographer-username">@{packageData.PhotographerId.TenDangNhap}</p>
                    <button className="btn-contact-photographer" onClick={handleContactPhotographer} disabled={isCreatingChat}>
                      <MessageCircle size={18} /> {isCreatingChat ? "Đang kết nối..." : "Nhắn tin"}
                    </button>
                  </div>
                </section>
              )}

            </div>

            {/* --- CỘT PHẢI (Sidebar Sticky) --- */}
            <aside className="package-sidebar">
              <div className="sidebar-sticky">
                
                <div className="package-header-card">
                  <div className="package-badge">{packageData.LoaiGoi}</div>
                  <h1>{packageData.TenGoi}</h1>
                  <div className="package-meta">
                    <div className="rating">
                      <Star fill="#fbbf24" color="#fbbf24" size={18} />
                      <span className="rating-num">{(packageData.DanhGia || 0).toFixed(1)}</span>
                      <a href="#reviews-section" className="reviews-link">({packageData.SoLuotDanhGia || 0} đánh giá)</a>
                    </div>
                    <div className="booking-count"><Camera size={16} /><span>{packageData.SoLuongDaDat || 0} lượt đặt</span></div>
                  </div>
                </div>

                <div className="price-card">
                  <div className="price-header">
                    <h3>Giá gói dịch vụ</h3>
            
                  </div>
                  <div className="price-content">
                    <div className="price-range">
                      {minPrice === maxPrice 
                        ? <span className="price">{formatPrice(minPrice)} VNĐ</span> 
                        : <><span className="price">{formatPrice(minPrice)}</span> <span className="price-separator">-</span> <span className="price">{formatPrice(maxPrice)} VNĐ</span></>
                      }
                    </div>
                  </div>
                  <button className="btn-book-now" onClick={handleBookNow}>Đặt lịch ngay</button>
                </div>
                
                <div className="contact-card">
                  <h4>Cần tư vấn thêm?</h4>
                  <button className="btn-contact-photographer" onClick={handleContactPhotographer} disabled={isCreatingChat}>
                      <MessageCircle size={18} /> {isCreatingChat ? "Đang kết nối..." : "Nhắn tin"}
                    </button>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>

      {/* --- CÁC MODAL --- */}

      {/* Modal Ảnh Gói Dịch Vụ */}
      {showImageModal && (
        <div className="image-modal-overlay" onClick={() => setShowImageModal(false)}>
          <button onClick={() => setShowImageModal(false)} className="modal-close-btn"><X size={32}/></button>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            {images.length > 0 && <img src={getImageUrl(images[currentImageIndex])} alt="Full view" />}
            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="modal-nav-btn prev"><ChevronLeft size={28} /></button>
                <button onClick={nextImage} className="modal-nav-btn next"><ChevronRight size={28} /></button>
                <div className="modal-image-counter">{currentImageIndex + 1} / {images.length}</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Zoom Ảnh Review */}
      {showReviewModal && (
        <div className="image-modal-overlay" style={{zIndex: 9999}} onClick={() => setShowReviewModal(false)}>
          <button onClick={() => setShowReviewModal(false)} className="modal-close-btn"><X size={32}/></button>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            {reviewImagesList.length > 0 && (
                <img 
                    src={getImageUrl(reviewImagesList[currentReviewImgIndex])} 
                    alt="Review Full view" 
                    style={{maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain'}}
                />
            )}
            {reviewImagesList.length > 1 && (
              <>
                <button onClick={prevReviewImage} className="modal-nav-btn prev"><ChevronLeft size={28} /></button>
                <button onClick={nextReviewImage} className="modal-nav-btn next"><ChevronRight size={28} /></button>
                <div className="modal-image-counter">
                    Ảnh {currentReviewImgIndex + 1} / {reviewImagesList.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Chat */}
      {showChat && chatConversation && (
        <ChatMessage conversation={chatConversation} currentUser={user} onClose={() => setShowChat(false)} />
      )}

    </MainLayout>
  );
}