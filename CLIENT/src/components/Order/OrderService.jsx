import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, User, Phone, Mail, Package, FileText,
  CheckCircle, AlertTriangle, Truck, Navigation, Loader, Search, 
  CalendarX, ArrowLeft, Camera, Check 
} from 'lucide-react';
import './OrderService.css';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify'; 

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../../components/Sidebar/Sidebar';
import servicePackageApi from '../../apis/ServicePackageService';
import orderApi from '../../apis/OrderService';

export default function OrderServices() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.user || {});

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false); 
  const [submitting, setSubmitting] = useState(false);
  
  // STATE QUẢN LÝ PHÍ DI CHUYỂN
  const [travelFee, setTravelFee] = useState(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [customerCoords, setCustomerCoords] = useState({ lat: null, lng: null });
  const [isSearchingAddress, setIsSearchingAddress] = useState(false); 

  // STATE QUẢN LÝ MODAL TRÙNG LỊCH
  const [conflictModal, setConflictModal] = useState({
    isOpen: false,
    message: ''
  });

  const todayISODate = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    customerName: user?.HoTen || '',
    customerPhone: user?.SoDienThoai || '',
    customerEmail: user?.Email || '',
    packageId: '',
    selectedServices: [], 
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
    mapLink: '',
    guestTimes: ['']
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để đặt dịch vụ');
      navigate('/signin', { state: { from: '/order-service' } });
      return;
    }

    if (location.state?.packageId) {
      setFormData(prev => ({ ...prev, packageId: location.state.packageId }));
      loadSelectedPackage(location.state.packageId);
    } 
  }, [user, navigate, location]);

  // TỰ ĐỘNG TÍNH PHÍ KHI CÓ TỌA ĐỘ
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.packageId && customerCoords.lat && customerCoords.lng) {
        calculateTravelFee();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.packageId, customerCoords]);

  const calculateTravelFee = async () => {
    try {
      setCalculatingFee(true);
      setTravelFee(null); 
      
      const response = await orderApi.calculateTravelFee(
        formData.packageId,
        customerCoords.lat,
        customerCoords.lng
      );
      
      const result = response.data?.data || response.data;
      
      if (result) {
        setTravelFee(result);
      }
    } catch (error) {
      console.error("❌ Lỗi tính phí:", error);
    } finally {
      setCalculatingFee(false);
    }
  };

  const loadSelectedPackage = async (packageId) => {
    try {
      setLoading(true);
      const response = await servicePackageApi.getPackageById(packageId);
      
      if (response) {
        setSelectedPackage(response);
        let duration = response.ThoiGianThucHien;
        if (typeof duration === 'string') {
           const match = duration.match(/\d+/);
           duration = match ? match[0] : ''; 
        }
        if (duration) {
          setFormData(prev => ({ ...prev, estimatedDuration: String(duration) }));
        }
        setFormData(prev => ({ ...prev, selectedServices: [] }));
      }
    } catch (error) {
      console.error("❌ Lỗi tải package:", error);
      toast.error("Không thể tải thông tin gói dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' })); 
    
    if (name === "bookingDate") {
        calculateCompletionDate(value, formData.estimatedDuration);
    }
  };

  const calculateCompletionDate = (bookingDate, duration) => {
    if (!bookingDate || !duration) return;
    const daysToAdd = parseInt(duration);
    if (isNaN(daysToAdd)) return;
    try {
      const d = new Date(bookingDate);
      if (isNaN(d.getTime())) return;
      d.setDate(d.getDate() + daysToAdd);
      if (!isNaN(d.getTime())) {
        setFormData(prev => ({ ...prev, completionDate: d.toISOString().split("T")[0] }));
      }
    } catch (error) {}
  };

  const handleServiceToggle = (serviceIndex) => {
    setFormData(prev => {
      const isSelected = prev.selectedServices.includes(serviceIndex);
      const newSelected = isSelected
        ? prev.selectedServices.filter(i => i !== serviceIndex)
        : [...prev.selectedServices, serviceIndex];
      return { ...prev, selectedServices: newSelected };
    });
  };

  // --- XỬ LÝ BẢN ĐỒ ---
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error("Trình duyệt không hỗ trợ định vị!");
    toast.info("Đang lấy vị trí hiện tại...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setFormData(prev => ({
          ...prev,
          mapLink: link,
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
        }));
        setCustomerCoords({ lat: latitude, lng: longitude });
        toast.success("Đã lấy tọa độ thành công!");
      },
      () => toast.error("Vui lòng cho phép truy cập vị trí hoặc nhập thủ công."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAutoGetCoordinates = async () => {
    const fullAddress = `${formData.address}, ${formData.district}, ${formData.city}`.replace(/(^,)|(,$)/g, "").trim();
    if (fullAddress.length < 5) return toast.warning("Vui lòng nhập địa chỉ cụ thể");

    try {
      setIsSearchingAddress(true);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCustomerCoords({ lat, lng });
        setFormData(prev => ({
          ...prev,
          mapLink: `https://www.google.com/maps?q=${lat},${lng}`,
          location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }));
        toast.success("Đã tìm thấy tọa độ!");
      } else {
        toast.error("Không tìm thấy tọa độ. Vui lòng kiểm tra lại địa chỉ.");
      }
    } catch (error) {
      toast.error("Lỗi khi tìm kiếm địa chỉ.");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleMapLinkChange = (e) => {
    const link = e.target.value;
    setFormData(prev => ({ ...prev, mapLink: link }));
    const match1 = link.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    const match2 = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    const coords = match1 ? { lat: parseFloat(match1[1]), lng: parseFloat(match1[2]) } : match2 ? { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) } : null;
    if (coords) {
      setCustomerCoords(coords);
      toast.info(`Đã nhận diện tọa độ.`);
    }
  };

  // --- TÍNH GIÁ ---
  const calculateServicePrice = () => {
    if (!selectedPackage?.DichVu || formData.selectedServices.length === 0) return 0;
    return formData.selectedServices.reduce((total, index) => {
      const service = selectedPackage.DichVu[index];
      return total + (Number(service?.Gia) || 0);
    }, 0);
  };

  const calculateTotalPrice = () => {
    return calculateServicePrice() + (travelFee?.fee || 0);
  };

  const formatPrice = (p) => Number(p || 0).toLocaleString("vi-VN");

  // ✅ HÀM VALIDATE: Kiểm tra nghiêm ngặt, bao gồm Dịch vụ
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // 1. Kiểm tra Gói dịch vụ (QUAN TRỌNG)
    if (!formData.packageId || !selectedPackage) {
        errors.packageId = "Vui lòng chọn gói dịch vụ";
        isValid = false;
    }

    // 🛑 2. KIỂM TRA DỊCH VỤ CON (QUAN TRỌNG)
    if (!formData.selectedServices || formData.selectedServices.length === 0) {
        toast.warn("⚠️ Bạn chưa chọn dịch vụ nào trong gói!");
        // Cuộn tới phần chọn dịch vụ để user thấy
        const servicesSection = document.querySelector('.services-selection');
        if (servicesSection) servicesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    if (!formData.customerName.trim()) {
        errors.customerName = "Vui lòng nhập họ tên";
        isValid = false;
    }
    
    if (!formData.customerPhone.trim()) {
        errors.customerPhone = "Vui lòng nhập số điện thoại";
        isValid = false;
    }

    if (!formData.customerEmail.trim()) {
        errors.customerEmail = "Vui lòng nhập email";
        isValid = false;
    }

    if (!formData.bookingDate) {
        errors.bookingDate = "Vui lòng chọn ngày chụp";
        isValid = false;
    }
    if (!formData.startTime) {
        errors.startTime = "Vui lòng chọn giờ bắt đầu";
        isValid = false;
    }
    
    if (!formData.address.trim()) {
        errors.address = "Vui lòng nhập địa chỉ chi tiết";
        isValid = false;
    }
    
    setFormErrors(errors);
    
    if (!isValid) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.warn("Vui lòng điền đầy đủ thông tin bắt buộc!");
    }

    return isValid;
  };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Gọi validate, nếu false thì dừng ngay
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      const servicePrice = calculateServicePrice();
      const travelFeeAmount = travelFee?.fee || 0;
      const totalAmount = servicePrice + travelFeeAmount;

      const orderData = {
        service_package_id: formData.packageId,
        package_name: selectedPackage?.TenGoi,
        photographer_id: selectedPackage?.PhotographerId?._id || null,
        booking_date: formData.bookingDate,
        start_time: formData.startTime,
        selected_services: formData.selectedServices,
        location: {
          name: formData.location,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          map_link: formData.mapLink,
          coordinates: customerCoords 
        },
        service_amount: servicePrice,
        travel_fee: travelFee || { enabled: false, fee: 0, distance_km: 0 }, 
        travel_fee_amount: travelFeeAmount,
        total_amount: totalAmount,
        final_amount: totalAmount,
        notes: formData.notes || "",
        special_requests: formData.specialRequests || "",
        guest_times: formData.guestTimes.filter(t => t),
      };

      const response = await orderApi.createOrder(orderData);
      const responseData = response.data || response; 
      const orderResult = responseData.data || responseData.order || responseData;
      const paymentInfo = responseData.payment_info || {};

      if (!orderResult?._id) throw new Error("Lỗi tạo đơn");
      
      toast.success("Tạo đơn hàng thành công!");
      navigate("/payment", { state: { order: orderResult, transfer_code: paymentInfo.transfer_code, deposit_required: paymentInfo.deposit_required } });

    } catch (error) {
      console.error("Create Order Error:", error);
      if (error.response && error.response.status === 409) {
          setConflictModal({ isOpen: true, message: error.response.data.message || "Khung giờ này đã kín!" });
      } else {
          toast.error(error.response?.data?.message || "Lỗi khi tạo đơn hàng");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (img) => !img ? "/no-image.jpg" : img.startsWith("http") ? img : `http://localhost:5000/${img.replace(/^\/+/, "")}`;

  const renderTravelFeeSection = () => {
    if (calculatingFee) return <div className="info-box"><Loader size={18} className="spin" /><span>Đang tính phí di chuyển...</span></div>;
    if (!travelFee) return null;
    if (travelFee.error) return <div className="info-box error"><AlertTriangle size={18} /><span>{travelFee.error}</span></div>;
    if (!travelFee.enabled) return <div className="info-box success"><CheckCircle size={18} /><span>Miễn phí di chuyển</span></div>;

    return (
      <div className="travel-fee-box">
        <div className="travel-fee-header"><Truck size={20} /> <h4>Phí di chuyển (Lái xe)</h4></div>
        <div className="travel-fee-details">
          <div className="fee-row"><span>Quãng đường:</span><strong>{travelFee.distance_km} km</strong></div>
          <div className="fee-row total"><span>Phí áp dụng:</span><strong>{formatPrice(travelFee.fee)} VNĐ</strong></div>
          {travelFee.breakdown && <p className="fee-breakdown">{travelFee.breakdown}</p>}
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <Sidebar />

      <div className="order-service-page">
        <div className="container">
          <div className="order-header">
            <button onClick={() => navigate(-1)} className="btn-back"><ArrowLeft size={20} /> Quay lại</button>
            <h1>Đặt Dịch Vụ Chụp Ảnh</h1>
            <p className="order-subtitle">Điền thông tin bên dưới để hoàn tất đặt hàng</p>
          </div>

          <div className="order-content">
              <form className="order-form" onSubmit={handleSubmit}>
                
                {/* KHÁCH HÀNG */}
                <div className="form-section">
                  <div className="section-header"><User /> <h2>Thông tin khách hàng</h2></div>
                  <div className="form-group">
                    <label>Họ tên <span className="required">*</span></label>
                    <input name="customerName" value={formData.customerName} onChange={handleInputChange} className={formErrors.customerName ? 'error' : ''} />
                    {formErrors.customerName && <span className="error-msg">{formErrors.customerName}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                        <label>SĐT <span className="required">*</span></label>
                        <input name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} className={formErrors.customerPhone ? 'error' : ''} />
                        {formErrors.customerPhone && <span className="error-msg">{formErrors.customerPhone}</span>}
                    </div>
                    <div className="form-group">
                        <label>Email <span className="required">*</span></label>
                        <input name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} className={formErrors.customerEmail ? 'error' : ''} />
                        {formErrors.customerEmail && <span className="error-msg">{formErrors.customerEmail}</span>}
                    </div>
                  </div>
                </div>

                {/* DỊCH VỤ */}
                <div className="form-section">
                  <div className="section-header"><Package /> <h2>Thông tin dịch vụ</h2></div>
                  
                  <div className="form-group">
                    <label>Gói dịch vụ <span className="required">*</span></label>
                    {/* ✅ INPUT HIỂN THỊ GÓI DỊCH VỤ (VALIDATION UI) */}
                    <input 
                      type="text" 
                      value={selectedPackage?.TenGoi || ""} 
                      readOnly
                      placeholder="Chưa chọn gói dịch vụ"
                      className={formErrors.packageId ? 'error' : ''} // Class đỏ nếu lỗi
                      onClick={() => { if(!selectedPackage) navigate('/service-package'); }} // Click để quay lại chọn
                      style={{ cursor: selectedPackage ? 'default' : 'pointer', backgroundColor: selectedPackage ? '#f3f4f6' : '#fff' }}
                    />
                    {/* ✅ HIỂN THỊ LỖI ĐỎ DƯỚI INPUT */}
                    {formErrors.packageId && <span className="error-msg">{formErrors.packageId}</span>}
                    {!selectedPackage && <small className="text-blue" style={{cursor:'pointer'}} onClick={()=>navigate('/service-package')}>Nhấn vào đây để chọn gói</small>}
                  </div>
                  
                  {selectedPackage?.DichVu?.length > 0 && (
                    <div className="form-group">
                        <label>Chọn dịch vụ thêm <span className="required">*</span></label>
                        
                        {/* Thêm class error-border nếu chưa chọn dịch vụ khi submit */}
                        <div className={`services-selection ${formData.selectedServices.length === 0 && Object.keys(formErrors).length > 0 ? 'error-border' : ''}`}>
                            {selectedPackage.DichVu.map((service, index) => (
                            <div key={index} className={`service-item ${formData.selectedServices.includes(index) ? 'selected' : ''}`} onClick={() => handleServiceToggle(index)}>
                                <div className="service-checkbox">{formData.selectedServices.includes(index) && <Check size={16} />}</div>
                                <div className="service-details"><h4>{service.name}</h4><p className="service-price">{formatPrice(service.Gia)} VNĐ</p></div>
                            </div>
                            ))}
                        </div>
                        {/* Hiển thị thông báo lỗi nhỏ dưới danh sách dịch vụ */}
                        {formData.selectedServices.length === 0 && Object.keys(formErrors).length > 0 && (
                             <small className="error-text" style={{color: '#ef4444', marginTop: '5px', display: 'block'}}>
                                * Vui lòng chọn ít nhất 1 dịch vụ để tiếp tục.
                             </small>
                        )}
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                        <label>Ngày đặt <span className="required">*</span></label>
                        <input type="date" name="bookingDate" value={formData.bookingDate} min={todayISODate} onChange={handleInputChange} className={formErrors.bookingDate ? 'error' : ''} />
                        {formErrors.bookingDate && <span className="error-msg">{formErrors.bookingDate}</span>}
                    </div>
                    <div className="form-group">
                        <label>Giờ bắt đầu <span className="required">*</span></label>
                        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className={formErrors.startTime ? 'error' : ''} />
                        {formErrors.startTime && <span className="error-msg">{formErrors.startTime}</span>}
                    </div>
                  </div>
                </div>

                {/* 3. ĐỊA ĐIỂM & BẢN ĐỒ */}
                <div className="form-section">
                  <div className="section-header"><MapPin /> <h2>Địa điểm chụp</h2></div>
                  
                  <div className="form-group">
                    <label>Địa chỉ chi tiết <span className="required">*</span></label>
                    <input name="address" value={formData.address} onChange={handleInputChange} className={formErrors.address ? 'error' : ''} placeholder="Số nhà, tên đường..." />
                    {formErrors.address && <span className="error-msg">{formErrors.address}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                        <label>Quận/Huyện <span className="required">*</span></label>
                        <input name="district" value={formData.district} onChange={handleInputChange} className={formErrors.district ? 'error' : ''} placeholder="Ví dụ: Ninh Kiều" />
                        {formErrors.district && <span className="error-msg">{formErrors.district}</span>}
                    </div>
                    <div className="form-group">
                        <label>Tỉnh/Thành phố <span className="required">*</span></label>
                        <input name="city" value={formData.city} onChange={handleInputChange} className={formErrors.city ? 'error' : ''} placeholder="Ví dụ: Cần Thơ" />
                        {formErrors.city && <span className="error-msg">{formErrors.city}</span>}
                    </div>
                  </div>

                  <div className="geo-actions">
                    <button type="button" onClick={handleAutoGetCoordinates} className="btn-auto-geo" disabled={isSearchingAddress}>
                      {isSearchingAddress ? <Loader size={16} className="spin"/> : <Search size={16} />} Tìm tọa độ
                    </button>
                    <span className="geo-divider">hoặc</span>
                    <button type="button" onClick={handleGetCurrentLocation} className="btn-location">
                       <Navigation size={16} /> Lấy vị trí hiện tại
                    </button>
                  </div>

                  <div className="form-group" style={{marginTop: 20}}>
                    <label>Link Google Maps (Tùy chọn)</label>
                    <input name="mapLink" value={formData.mapLink} onChange={handleMapLinkChange} placeholder="Dán link Google Maps dài..." />
                  </div>

                  {customerCoords.lat && customerCoords.lng && (
                    <div className="info-box success">
                      <MapPin size={18} /> <span>Đã nhận diện tọa độ.</span>
                    </div>
                  )}

                  {renderTravelFeeSection()}
                </div>

                {/* 4. GHI CHÚ */}
                <div className="form-section">
                  <div className="section-header"><FileText /> <h2>Ghi chú thêm</h2></div>
                  <div className="form-group"><textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" placeholder="Ghi chú cho photographer..." /></div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => navigate(-1)} disabled={submitting}>Hủy</button>
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
                  </button>
                </div>
              </form>

              {/* SUMMARY */}
              <div className="order-summary-section">
                <div className="summary-sticky">
                  {selectedPackage ? (
                    <div className="selected-package-card">
                        <div className="package-badge">{selectedPackage.LoaiGoi}</div>
                        <img src={getImageUrl(selectedPackage.AnhBia)} onError={(e)=>e.target.src='https://via.placeholder.com/400x250'} alt="" />
                        <h3>{selectedPackage.TenGoi}</h3>
                        <div className="price-breakdown">
                            <div className="price-row"><span>Dịch vụ:</span><span>{formatPrice(calculateServicePrice())} VNĐ</span></div>
                            {travelFee?.fee > 0 && <div className="price-row travel"><span>Phí di chuyển:</span><span>{formatPrice(travelFee.fee)} VNĐ</span></div>}
                            <div className="total-price"><span>Tổng cộng:</span><span className="price">{formatPrice(calculateTotalPrice())} VNĐ</span></div>
                            <div className="deposit-info"><span>Cọc 30%:</span><span className="deposit-amount">{formatPrice(Math.round(calculateTotalPrice() * 0.3))} VNĐ</span></div>
                        </div>
                    </div>
                  ) : (
                    <div className="placeholder-box"><Camera size={40} /><p>Vui lòng chọn gói dịch vụ</p></div>
                  )}
                </div>
              </div>
            </div>
        </div>
      </div>

      {conflictModal.isOpen && (
        <div className="modal-overlay-custom" onClick={() => setConflictModal({ ...conflictModal, isOpen: false })}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-area"><CalendarX size={36} color="#ea580c" strokeWidth={2} /></div>
            <h3 className="modal-title">Rất tiếc, lịch đã kín!</h3>
            <p className="modal-desc">{conflictModal.message}</p>
            <div className="modal-footer">
              <button className="modal-btn-action" onClick={() => setConflictModal({ ...conflictModal, isOpen: false })}>Đã hiểu, tôi sẽ chọn ngày khác</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}