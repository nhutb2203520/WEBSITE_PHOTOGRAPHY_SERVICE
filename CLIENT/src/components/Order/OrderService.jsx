import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Package,
  FileText,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Camera,
  ArrowLeft,
  Map
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import './OrderService.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';
import servicePackageApi from '../../apis/ServicePackageService';

export default function OrderService() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);

  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: user?.HoTen || '',
    customerPhone: user?.SoDienThoai || '',
    customerEmail: user?.Email || '',
    packageId: '',
    bookingDate: '',
    startTime: '',
    estimatedDuration: '',
    completionDate: '',
    location: '',
    address: '',
    city: '',
    district: '',
    notes: '',
    specialRequests: '',
    mapLink: '' // ✅ Thêm link Google Maps
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để đặt dịch vụ');
      navigate('/signin', { state: { from: '/order-service' } });
      return;
    }

    fetchPackages();

    if (location.state?.packageId) {
      setFormData(prev => ({ ...prev, packageId: location.state.packageId }));
      // Tự động load package nếu có
      loadSelectedPackage(location.state.packageId);
    }
  }, [user, navigate, location]);

  const loadSelectedPackage = async (packageId) => {
    try {
      const response = await servicePackageApi.getAllPackages();
      const packageList = Array.isArray(response) 
        ? response 
        : (response?.data || response?.packages || []);
      
      const selected = packageList.find(pkg => pkg._id === packageId);
      if (selected) {
        setSelectedPackage(selected);
        if (selected?.ThoiGianThucHien) {
          setFormData(prev => ({ ...prev, estimatedDuration: selected.ThoiGianThucHien }));
        }
      }
    } catch (error) {
      console.error('❌ Error loading selected package:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await servicePackageApi.getAllPackages();
      
      console.log('📦 API Response:', response);
      
      let packageList = [];
      
      if (Array.isArray(response)) {
        packageList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        packageList = response.data;
      } else if (response?.packages && Array.isArray(response.packages)) {
        packageList = response.packages;
      }
      
      setPackages(packageList);
      
      if (packageList.length === 0) {
        toast.info('Chưa có gói dịch vụ nào');
      }
    } catch (error) {
      console.error('❌ Error fetching packages:', error);
      toast.error('Không thể tải danh sách gói dịch vụ');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'bookingDate' || name === 'estimatedDuration') {
      calculateCompletionDate(
        name === 'bookingDate' ? value : formData.bookingDate,
        name === 'estimatedDuration' ? value : formData.estimatedDuration
      );
    }
  };

  const handlePackageSelect = (e) => {
    const packageId = e.target.value;
    setFormData(prev => ({ ...prev, packageId }));
    
    const selected = packages.find(pkg => pkg._id === packageId);
    setSelectedPackage(selected);

    if (selected?.ThoiGianThucHien) {
      setFormData(prev => ({ ...prev, estimatedDuration: selected.ThoiGianThucHien }));
    }

    if (formErrors.packageId) {
      setFormErrors(prev => ({ ...prev, packageId: '' }));
    }
  };

  const calculateCompletionDate = (bookingDate, duration) => {
    if (bookingDate && duration) {
      const date = new Date(bookingDate);
      const daysToAdd = parseInt(duration) || 0;
      date.setDate(date.getDate() + daysToAdd);
      
      const completionDate = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, completionDate }));
    }
  };

  // ✅ Hàm lấy vị trí hiện tại
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.info('Đang lấy vị trí của bạn...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          setFormData(prev => ({ 
            ...prev, 
            mapLink,
            location: `${latitude}, ${longitude}`
          }));
          toast.success('Đã lấy vị trí thành công!');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Không thể lấy vị trí. Vui lòng bật GPS và cho phép truy cập vị trí.');
        }
      );
    } else {
      toast.error('Trình duyệt không hỗ trợ định vị.');
    }
  };

  // ✅ Hàm mở Google Maps để chọn địa điểm
  const handleOpenGoogleMaps = () => {
    const query = formData.address || formData.location || 'Việt Nam';
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    window.open(url, '_blank');
    toast.info('Vui lòng copy link địa chỉ từ Google Maps và dán vào ô bên dưới');
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customerName.trim()) {
      errors.customerName = 'Vui lòng nhập họ tên';
    }

    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formData.customerPhone.replace(/\s/g, ''))) {
      errors.customerPhone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.customerEmail.trim()) {
      errors.customerEmail = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = 'Email không hợp lệ';
    }

    if (!formData.packageId) {
      errors.packageId = 'Vui lòng chọn gói dịch vụ';
    }

    if (!formData.bookingDate) {
      errors.bookingDate = 'Vui lòng chọn ngày đặt';
    }

    if (!formData.startTime) {
      errors.startTime = 'Vui lòng chọn giờ bắt đầu';
    }

    if (!formData.location.trim()) {
      errors.location = 'Vui lòng nhập địa điểm';
    }

    if (!formData.address.trim()) {
      errors.address = 'Vui lòng nhập địa chỉ chi tiết';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      setSubmitting(true);

      const orderData = {
        ...formData,
        userId: user._id,
        packageName: selectedPackage?.TenGoi,
        packagePrice: selectedPackage?.DichVu?.[0]?.Gia || 0,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('📝 Submitting order:', orderData);

      // TODO: Thay thế bằng API call thực tế
      // await orderApi.createOrder(orderData);

      toast.success('Đặt dịch vụ thành công! Chúng tôi sẽ liên hệ với bạn sớm.');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('❌ Error creating order:', error);
      toast.error('Đặt dịch vụ thất bại. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://via.placeholder.com/100x100?text=No+Image";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `http://localhost:5000/${imageUrl.replace(/^\/+/, "")}`;
  };

  const formatPrice = (price) => {
    return Number(price).toLocaleString("vi-VN");
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

  return (
    <>
      <Header />
      <Sidebar />

      <div className="order-service-page">
        <div className="container">
          
          <div className="order-header">
            <button onClick={() => navigate(-1)} className="btn-back">
              <ArrowLeft size={20} />
              Quay lại
            </button>
            <h1>Đặt Dịch Vụ Chụp Ảnh</h1>
            <p className="order-subtitle">
              Điền thông tin bên dưới để đặt dịch vụ chụp ảnh của bạn
            </p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải...</p>
            </div>
          ) : (
            <div className="order-content">
              
              <div className="order-form-section">
                <form onSubmit={handleSubmit} className="order-form">
                  
                  {/* Thông tin khách hàng */}
                  <div className="form-section">
                    <div className="section-header">
                      <User size={24} />
                      <h2>Thông tin khách hàng</h2>
                    </div>

                    <div className="form-group">
                      <label>Họ và tên *</label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        placeholder="Nhập họ tên đầy đủ"
                        className={formErrors.customerName ? 'error' : ''}
                      />
                      {formErrors.customerName && (
                        <span className="error-message">{formErrors.customerName}</span>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Số điện thoại *</label>
                        <input
                          type="tel"
                          name="customerPhone"
                          value={formData.customerPhone}
                          onChange={handleInputChange}
                          placeholder="0123456789"
                          className={formErrors.customerPhone ? 'error' : ''}
                        />
                        {formErrors.customerPhone && (
                          <span className="error-message">{formErrors.customerPhone}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          name="customerEmail"
                          value={formData.customerEmail}
                          onChange={handleInputChange}
                          placeholder="email@example.com"
                          className={formErrors.customerEmail ? 'error' : ''}
                        />
                        {formErrors.customerEmail && (
                          <span className="error-message">{formErrors.customerEmail}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Thông tin dịch vụ */}
                  <div className="form-section">
                    <div className="section-header">
                      <Package size={24} />
                      <h2>Thông tin dịch vụ</h2>
                    </div>

                    <div className="form-group">
                      <label>Chọn gói dịch vụ *</label>
                      <select
                        name="packageId"
                        value={formData.packageId}
                        onChange={handlePackageSelect}
                        className={formErrors.packageId ? 'error' : ''}
                      >
                        <option value="">-- Chọn gói dịch vụ --</option>
                        {packages && packages.length > 0 ? (
                          packages.map(pkg => (
                            <option key={pkg._id} value={pkg._id}>
                              {pkg.TenGoi} - {formatPrice(getPriceRange(pkg.DichVu).min)} VNĐ
                            </option>
                          ))
                        ) : (
                          <option disabled>Không có gói dịch vụ</option>
                        )}
                      </select>
                      {formErrors.packageId && (
                        <span className="error-message">{formErrors.packageId}</span>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Ngày đặt dịch vụ *</label>
                        <input
                          type="date"
                          name="bookingDate"
                          value={formData.bookingDate}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className={formErrors.bookingDate ? 'error' : ''}
                        />
                        {formErrors.bookingDate && (
                          <span className="error-message">{formErrors.bookingDate}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Giờ bắt đầu *</label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className={formErrors.startTime ? 'error' : ''}
                        />
                        {formErrors.startTime && (
                          <span className="error-message">{formErrors.startTime}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Thời gian thực hiện (ngày)</label>
                        <input
                          type="number"
                          name="estimatedDuration"
                          value={formData.estimatedDuration}
                          onChange={handleInputChange}
                          placeholder="Ví dụ: 3"
                          min="1"
                        />
                        <span className="field-hint">Thời gian dự kiến hoàn thành dịch vụ</span>
                      </div>

                      <div className="form-group">
                        <label>Ngày hoàn thành dự kiến</label>
                        <input
                          type="date"
                          name="completionDate"
                          value={formData.completionDate}
                          readOnly
                          disabled
                          className="readonly-field"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Địa điểm */}
                  <div className="form-section">
                    <div className="section-header">
                      <MapPin size={24} />
                      <h2>Địa điểm chụp</h2>
                    </div>

                    <div className="form-group">
                      <label>Tên địa điểm *</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Ví dụ: Công viên Tao Đàn, Studio ABC..."
                        className={formErrors.location ? 'error' : ''}
                      />
                      {formErrors.location && (
                        <span className="error-message">{formErrors.location}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Địa chỉ chi tiết *</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Số nhà, tên đường..."
                        className={formErrors.address ? 'error' : ''}
                      />
                      {formErrors.address && (
                        <span className="error-message">{formErrors.address}</span>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Quận/Huyện</label>
                        <input
                          type="text"
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          placeholder="Quận/Huyện"
                        />
                      </div>

                      <div className="form-group">
                        <label>Thành phố</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Thành phố"
                        />
                      </div>
                    </div>

                    {/* ✅ Google Maps Integration */}
                    <div className="form-group">
                      <label>Link Google Maps</label>
                      <div className="map-input-group">
                        <input
                          type="url"
                          name="mapLink"
                          value={formData.mapLink}
                          onChange={handleInputChange}
                          placeholder="https://maps.google.com/..."
                        />
                        <button 
                          type="button" 
                          className="btn-map-action"
                          onClick={handleOpenGoogleMaps}
                          title="Mở Google Maps"
                        >
                          <Map size={18} />
                          Chọn trên Maps
                        </button>
                        <button 
                          type="button" 
                          className="btn-map-action secondary"
                          onClick={handleGetCurrentLocation}
                          title="Lấy vị trí hiện tại"
                        >
                          <MapPin size={18} />
                          Vị trí hiện tại
                        </button>
                      </div>
                      <span className="field-hint">
                        Bạn có thể chọn địa điểm trên Google Maps hoặc lấy vị trí hiện tại
                      </span>
                    </div>
                  </div>

                  {/* Ghi chú */}
                  <div className="form-section">
                    <div className="section-header">
                      <FileText size={24} />
                      <h2>Ghi chú & Yêu cầu đặc biệt</h2>
                    </div>

                    <div className="form-group">
                      <label>Ghi chú</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Thêm ghi chú về buổi chụp..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Yêu cầu đặc biệt</label>
                      <textarea
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Yêu cầu về trang phục, phụ kiện, phong cách chụp..."
                      />
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => navigate(-1)}
                      disabled={submitting}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className="btn-spinner"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Xác nhận đặt dịch vụ
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side - Summary */}
              <div className="order-summary-section">
                <div className="summary-sticky">
                  
                  {selectedPackage ? (
                    <div className="selected-package-card">
                      <h3>Gói dịch vụ đã chọn</h3>
                      
                      <div className="package-preview">
                        <img 
                          src={getImageUrl(selectedPackage.AnhBia)}
                          alt={selectedPackage.TenGoi}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                          }}
                        />
                        <div className="package-details">
                          <span className="package-badge">{selectedPackage.LoaiGoi}</span>
                          <h4>{selectedPackage.TenGoi}</h4>
                          <p className="package-desc">{selectedPackage.MoTa}</p>
                          
                          <div className="package-price-info">
                            <DollarSign size={18} />
                            <span className="price">
                              {formatPrice(getPriceRange(selectedPackage.DichVu).min)} - {formatPrice(getPriceRange(selectedPackage.DichVu).max)} VNĐ
                            </span>
                          </div>

                          {selectedPackage.DichVu && (
                            <div className="services-included">
                              <strong>Bao gồm:</strong>
                              <ul>
                                {selectedPackage.DichVu.slice(0, 3).map((service, idx) => (
                                  <li key={idx}>{service.name}</li>
                                ))}
                                {selectedPackage.DichVu.length > 3 && (
                                  <li>+{selectedPackage.DichVu.length - 3} dịch vụ khác</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-package-selected">
                      <Package size={48} />
                      <p>Chưa chọn gói dịch vụ</p>
                      <span>Vui lòng chọn gói dịch vụ bên trái</span>
                    </div>
                  )}

                  <div className="important-notes">
                    <div className="note-header">
                      <AlertCircle size={20} />
                      <h4>Lưu ý quan trọng</h4>
                    </div>
                    <ul>
                      <li>Vui lòng đặt trước ít nhất 3 ngày</li>
                      <li>Photographer sẽ liên hệ xác nhận trong 24h</li>
                      <li>Thanh toán 50% trước, 50% sau khi hoàn thành</li>
                      <li>Miễn phí hủy trước 48h</li>
                      <li>Ảnh sẽ được giao trong 7-14 ngày</li>
                    </ul>
                  </div>

                  <div className="contact-support">
                    <h4>Cần hỗ trợ?</h4>
                    <p>Liên hệ với chúng tôi</p>
                    <div className="support-contacts">
                      <a href="tel:0123456789" className="support-link">
                        <Phone size={18} />
                        0123 456 789
                      </a>
                      <a href="mailto:support@photo.com" className="support-link">
                        <Mail size={18} />
                        support@photo.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}