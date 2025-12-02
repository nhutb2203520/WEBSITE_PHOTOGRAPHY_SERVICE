import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, Heart, MapPin, Clock, Check, Phone, Mail, Camera, ArrowLeft, Share2, MessageCircle, ChevronLeft, ChevronRight, Truck, Info, CalendarDays, AlertTriangle
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import './ServicePackageDetail.css';

// ✅ Import MainLayout
import MainLayout from '../../layouts/MainLayout/MainLayout';

// ❌ Đã xóa import Header, Footer, Sidebar lẻ tẻ

import servicePackageApi from '../../apis/ServicePackageService';

export default function ServicePackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.user);
  
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    fetchPackageDetail();
  }, [id]);

  const fetchPackageDetail = async () => {
    try {
      setLoading(true);
      const data = await servicePackageApi.getPackageById(id);
      setPackageData(data);
    } catch (error) {
      console.error('❌ Error fetching package detail:', error);
      toast.error('Không thể tải thông tin gói dịch vụ');
      navigate('/service-package');
    } finally {
      setLoading(false);
    }
  };

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

  const handleContactPhotographer = () => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để liên hệ');
      navigate('/signin');
      return;
    }
    toast.info('Tính năng chat đang được phát triển');
  };

  const nextImage = () => {
    const images = getAllImages();
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    const images = getAllImages();
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="package-detail-loading">
          <div className="spinner"></div>
          <p>Đang tải thông tin gói dịch vụ...</p>
        </div>
      </MainLayout>
    );
  }

  if (!packageData) {
    return (
      <MainLayout>
        <div className="package-detail-error">
          <h2>Không tìm thấy gói dịch vụ</h2>
          <Link to="/service-package" className="btn-back">Quay lại danh sách</Link>
        </div>
      </MainLayout>
    );
  }

  const { min: minPrice, max: maxPrice } = getPriceRange(packageData.DichVu);
  const images = getAllImages();

  return (
    // ✅ Bọc toàn bộ nội dung trong MainLayout
    <MainLayout>
      <div className="package-detail-page">
        <div className="container">
          <button onClick={() => navigate(-1)} className="btn-back-nav">
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>

        <div className="container">
          <div className="package-detail-content">
            
            {/* LEFT SIDE - IMAGES & DETAILS */}
            <div className="package-images-section">
              
              {/* Main Image Gallery */}
              <div className="package-main-image">
                {images.length > 0 ? (
                  <img 
                    src={getImageUrl(images[currentImageIndex])}
                    alt={packageData.TenGoi}
                    onClick={() => setShowImageModal(true)}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/1200x600?text=No+Image"; }}
                  />
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

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="thumbnail-gallery">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`thumbnail-item ${currentImageIndex === index ? 'active' : ''}`}
                    >
                      <img 
                        src={getImageUrl(img)}
                        alt={`Thumbnail ${index + 1}`}
                        onError={(e) => { e.target.src = "https://via.placeholder.com/120x80?text=No+Image"; }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Description Section */}
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

              {/* Services Included */}
              <section className="package-section">
                <h2>Dịch vụ bao gồm</h2>
                <div className="services-grid">
                  {packageData.DichVu?.map((service, index) => (
                    <div 
                      key={index} 
                      className={`service-card ${selectedService === index ? 'selected' : ''}`}
                      onClick={() => setSelectedService(index)}
                    >
                      <div className="service-icon"><Check size={20} /></div>
                      <div className="service-info">
                        <h3>{service.name}</h3>
                        <p className="service-price">{formatPrice(service.Gia)} VNĐ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Base Location Section */}
              {packageData.baseLocation && (packageData.baseLocation.address || packageData.baseLocation.city) && (
                <section className="package-section">
                  <h2>Khu vực hoạt động</h2>
                  <div className="info-box-styled">
                    <div className="info-row">
                      <MapPin size={20} className="text-red-500" />
                      <div>
                        <strong>Địa điểm cơ sở: </strong>
                        <span>
                          {[
                            packageData.baseLocation.address, 
                            packageData.baseLocation.district, 
                            packageData.baseLocation.city
                          ].filter(Boolean).join(', ')}
                        </span>
                        {packageData.baseLocation.mapLink && (
                          <a 
                            href={packageData.baseLocation.mapLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="map-link-text"
                          >
                            (Xem bản đồ)
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Travel Fee Policy Section */}
              {packageData.travelFeeConfig && packageData.travelFeeConfig.enabled && (
                <section className="package-section">
                  <h2>Chính sách phí di chuyển</h2>
                  <div className="travel-fee-card">
                    <div className="tf-header">
                      <Truck size={24} />
                      <span>Có tính phí di chuyển ngoại thành/xa</span>
                    </div>
                    <div className="tf-body">
                      <div className="tf-item">
                        <span className="tf-label">Miễn phí trong bán kính:</span>
                        <span className="tf-value">{packageData.travelFeeConfig.freeDistanceKm} km</span>
                      </div>
                      <div className="tf-item">
                        <span className="tf-label">Phí vượt trội:</span>
                        <span className="tf-value">{formatPrice(packageData.travelFeeConfig.feePerKm)} đ/km</span>
                      </div>
                      {packageData.travelFeeConfig.maxFee && (
                        <div className="tf-item">
                          <span className="tf-label">Phí tối đa:</span>
                          <span className="tf-value">{formatPrice(packageData.travelFeeConfig.maxFee)} đ</span>
                        </div>
                      )}
                      {packageData.travelFeeConfig.note && (
                        <div className="tf-note">
                          <Info size={16} />
                          <span>{packageData.travelFeeConfig.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Time Info */}
              {packageData.ThoiGianThucHien && (
                <section className="package-section">
                  <h2>Thời gian thực hiện</h2>
                  <div className="time-info">
                    <Clock size={20} />
                    <span>{packageData.ThoiGianThucHien}</span>
                  </div>
                </section>
              )}

              {/* Photographer Info */}
              {packageData.PhotographerId && (
                <section className="package-section photographer-section">
                  <h2>Thông tin Photographer</h2>
                  <div className="photographer-card">
                    <div className="photographer-avatar-wrapper">
                      <img
                        src={getImageUrl(packageData.PhotographerId?.Avatar)}
                        alt={packageData.PhotographerId.HoTen}
                        className="photographer-avatar"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/200?text=Avatar"; }}
                      />
                    </div>
                    <h3 className="photographer-name">{packageData.PhotographerId.HoTen}</h3>
                    <p className="photographer-username">@{packageData.PhotographerId.TenDangNhap}</p>
                    <div className="photographer-info-column">
                      {packageData.PhotographerId.Email && (
                        <div className="contact-item">
                          <Mail size={16} /> {packageData.PhotographerId.Email}
                        </div>
                      )}
                      {packageData.PhotographerId.DiaChi && (
                        <div className="contact-item">
                          <MapPin size={16} /> {packageData.PhotographerId.DiaChi}
                        </div>
                      )}
                    </div>
                    <button className="btn-contact-photographer" onClick={handleContactPhotographer}>
                      <MessageCircle size={18} /> Nhắn tin
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT SIDE - PACKAGE INFO */}
            <div className="package-sidebar">
              <div className="sidebar-sticky">
                
                {/* Package Header Card */}
                <div className="package-header-card">
                  <div className="package-badge">{packageData.LoaiGoi}</div>
                  <h1>{packageData.TenGoi}</h1>
                  
                  <div className="package-meta">
                    <div className="rating">
                      <Star fill="#fbbf24" color="#fbbf24" size={20} />
                      <span>{(packageData.DanhGia || 0).toFixed(1)}</span>
                      <span className="reviews">({packageData.SoLuotDanhGia || 0} đánh giá)</span>
                    </div>
                    
                    {/* ✅ HIỂN THỊ SỐ LƯỢT ĐẶT VÀ KHIẾU NẠI */}
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center'}}>
                        <div className="booking-count">
                            <Camera size={18} />
                            <span>{packageData.SoLuongDaDat || 0} lượt đặt</span>
                        </div>
                        
                        {/* Hiển thị khiếu nại kể cả bằng 0 */}
                        <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: packageData.SoLuongKhieuNai > 0 ? '#ef4444' : '#6b7280', fontWeight: packageData.SoLuongKhieuNai > 0 ? '600' : '400'}}>
                            <AlertTriangle size={16} />
                            <span>{packageData.SoLuongKhieuNai || 0} khiếu nại</span>
                        </div>
                    </div>

                  </div>
                </div>

                {/* Price Card */}
                <div className="price-card">
                  <div className="price-header">
                    <h3>Giá gói dịch vụ</h3>
                    <div className="price-actions">
                      <button 
                        className={`btn-icon ${isFavorite ? 'active' : ''}`}
                        onClick={handleToggleFavorite}
                        title="Yêu thích"
                      >
                        <Heart size={20} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : 'currentColor'} />
                      </button>
                      <button className="btn-icon" onClick={handleShare} title="Chia sẻ">
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="price-content">
                    <div className="price-range">
                      {minPrice === maxPrice ? (
                        <span className="price">{formatPrice(minPrice)} VNĐ</span>
                      ) : (
                        <>
                          <span className="price">{formatPrice(minPrice)} VNĐ</span>
                          <span className="price-separator">-</span>
                          <span className="price">{formatPrice(maxPrice)} VNĐ</span>
                        </>
                      )}
                    </div>
                    <p className="price-note">* Giá có thể thay đổi tùy dịch vụ</p>
                  </div>

                  <div className="price-features">
                    <h4>Gói này bao gồm:</h4>
                    <ul>
                      {packageData.DichVu?.slice(0, 3).map((service, index) => (
                        <li key={index}>
                          <Check size={16} /> {service.name}
                        </li>
                      ))}
                      {packageData.DichVu?.length > 3 && (
                        <li className="more">
                          <Check size={16} /> Và {packageData.DichVu.length - 3} dịch vụ khác
                        </li>
                      )}
                    </ul>
                  </div>

                  <button className="btn-book-now" onClick={handleBookNow}>
                    Đặt hàng ngay
                  </button>
                </div>

                {/* Contact Card */}
                <div className="contact-card">
                  <h4>Cần tư vấn?</h4>
                  <p>Liên hệ với chúng tôi để được hỗ trợ tốt nhất</p>
                  <a href="tel:0776560735" className="btn-contact">
                    <Phone size={18} /> Gọi ngay
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="image-modal-overlay" onClick={() => setShowImageModal(false)}>
          <button onClick={() => setShowImageModal(false)} className="modal-close-btn">×</button>
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
    </MainLayout>
  );
}