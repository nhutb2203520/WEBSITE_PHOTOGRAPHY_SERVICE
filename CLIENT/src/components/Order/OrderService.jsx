import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, User, Phone, Mail, Package, FileText,
  CheckCircle, AlertCircle, DollarSign, Camera, ArrowLeft, Map,
  Check, Truck, Navigation, Loader
} from 'lucide-react';
import './OrderService.css';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';
import servicePackageApi from '../../apis/ServicePackageService';
import orderApi from '../../apis/OrderService';

export default function OrderServices() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.user || {});

  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // ✅ STATE CHO PHÍ DI CHUYỂN
  const [travelFee, setTravelFee] = useState(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [customerCoords, setCustomerCoords] = useState({ lat: null, lng: null });

  // Lấy ngày hôm nay an toàn
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
    fetchPackages();
    if (location.state?.packageId) {
      setFormData(prev => ({ ...prev, packageId: location.state.packageId }));
      loadSelectedPackage(location.state.packageId);
    }
  }, [user, navigate, location]);

  // ✅ TÍNH PHÍ DI CHUYỂN KHI CÓ TỌA ĐỘ VÀ GÓI DỊCH VỤ
  const calculateTravelFee = useCallback(async () => {
    if (!formData.packageId || !customerCoords.lat || !customerCoords.lng) {
      setTravelFee(null);
      return;
    }

    try {
      setCalculatingFee(true);
      const response = await orderApi.calculateTravelFee(
        formData.packageId,
        customerCoords.lat,
        customerCoords.lng
      );
      
      if (response?.data?.data) {
        setTravelFee(response.data.data);
        console.log("📍 Travel fee calculated:", response.data.data);
      }
    } catch (error) {
      console.error("❌ Error calculating travel fee:", error);
      setTravelFee(null);
    } finally {
      setCalculatingFee(false);
    }
  }, [formData.packageId, customerCoords]);

  useEffect(() => {
    calculateTravelFee();
  }, [calculateTravelFee]);

  const loadSelectedPackage = async (packageId) => {
    try {
      const response = await servicePackageApi.getPackageById(packageId);
      if (response) {
        setSelectedPackage(response);
        if (response.ThoiGianThucHien) {
          setFormData(prev => ({ ...prev, estimatedDuration: String(response.ThoiGianThucHien) }));
        }
        setFormData(prev => ({ ...prev, selectedServices: [] }));
      }
    } catch (error) {
      console.error("❌ Lỗi tải package:", error);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await servicePackageApi.getAllPackages();
      const list = Array.isArray(response) ? response : response?.packages || [];
      setPackages(list);
    } catch (error) {
      toast.error("Không thể tải danh sách gói dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  const setField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ✅ HÀM TÍNH NGÀY HOÀN THÀNH
  const calculateCompletionDate = (bookingDate, duration) => {
    if (!bookingDate || !duration) return;

    try {
      const d = new Date(bookingDate);
      if (isNaN(d.getTime())) return;

      d.setDate(d.getDate() + Math.floor(Number(duration)));
      
      if (!isNaN(d.getTime())) {
        setFormData(prev => ({ ...prev, completionDate: d.toISOString().split("T")[0] }));
      }
    } catch (error) {
      console.error("❌ Lỗi tính ngày hoàn thành:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setField(name, value);
    
    if (name === "bookingDate" && value && formData.estimatedDuration) {
      calculateCompletionDate(value, formData.estimatedDuration);
    }
    if (name === "estimatedDuration" && value && formData.bookingDate) {
      calculateCompletionDate(formData.bookingDate, value);
    }
  };

  const handlePackageSelect = async (e) => {
    const id = e.target.value;
    setFormData(prev => ({ ...prev, packageId: id, selectedServices: [] }));
    setTravelFee(null);

    if (!id) {
      setSelectedPackage(null);
      return;
    }

    try {
      const pkg = await servicePackageApi.getPackageById(id);
      setSelectedPackage(pkg);
      if (pkg?.ThoiGianThucHien) {
        setField('estimatedDuration', String(pkg.ThoiGianThucHien));
      }
    } catch (error) {
      toast.error("Không thể tải thông tin gói dịch vụ");
    }
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

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error("Trình duyệt không hỗ trợ định vị!");
    
    toast.info("Đang lấy vị trí...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const link = `https://www.google.com/maps?q=$${latitude},${longitude}`;
        
        setFormData(prev => ({
          ...prev,
          mapLink: link,
          location: `${latitude}, ${longitude}`
        }));
        
        setCustomerCoords({ lat: latitude, lng: longitude });
        toast.success("Đã lấy vị trí thành công!");
      },
      (err) => {
        console.error("Geolocation error:", err);
        toast.error("Không thể lấy vị trí. Vui lòng nhập thủ công hoặc cho phép truy cập vị trí.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const parseGoogleMapsLink = (link) => {
    if (!link) return null;
    const match1 = link.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match1) return { lat: parseFloat(match1[1]), lng: parseFloat(match1[2]) };
    const match2 = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match2) return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) };
    const match3 = link.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match3) return { lat: parseFloat(match3[1]), lng: parseFloat(match3[2]) };
    return null;
  };

  const handleMapLinkChange = (e) => {
    const link = e.target.value;
    setField('mapLink', link);
    const coords = parseGoogleMapsLink(link);
    if (coords) {
      setCustomerCoords(coords);
      toast.info(`Đã nhận diện tọa độ: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
    }
  };

  const handleGuestTimeChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.guestTimes];
      updated[index] = value;
      return { ...prev, guestTimes: updated };
    });
  };

  const addGuestTime = () => {
    setFormData(prev => ({ ...prev, guestTimes: [...prev.guestTimes, ""] }));
  };

  const removeGuestTime = (index) => {
    setFormData(prev => ({
      ...prev,
      guestTimes: prev.guestTimes.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) errors.customerName = "Vui lòng nhập họ tên";
    if (!formData.packageId) errors.packageId = "Vui lòng chọn gói dịch vụ";
    if (formData.selectedServices.length === 0) errors.selectedServices = "Vui lòng chọn ít nhất một dịch vụ";
    if (!formData.bookingDate) errors.bookingDate = "Vui lòng chọn ngày đặt";
    if (!formData.startTime) errors.startTime = "Vui lòng chọn giờ bắt đầu";
    if (!formData.address.trim()) errors.address = "Vui lòng nhập địa chỉ chụp";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateServicePrice = () => {
    if (!selectedPackage?.DichVu || formData.selectedServices.length === 0) return 0;
    return formData.selectedServices.reduce((total, index) => {
      const service = selectedPackage.DichVu[index];
      return total + (Number(service?.Gia) || 0);
    }, 0);
  };

  const calculateTotalPrice = () => {
    const servicePrice = calculateServicePrice();
    const travelFeeAmount = travelFee?.fee || 0;
    return servicePrice + travelFeeAmount;
  };

  const formatPrice = (p) => Number(p || 0).toLocaleString("vi-VN");

  // ✅ ĐÃ SỬA HÀM NÀY: Xử lý phản hồi API an toàn hơn
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return toast.error("Vui lòng kiểm tra lại thông tin");

    try {
      setSubmitting(true);
      const servicePrice = calculateServicePrice();
      const travelFeeAmount = travelFee?.fee || 0;
      const totalAmount = servicePrice + travelFeeAmount;

      const orderData = {
        service_package_id: formData.packageId,
        photographer_id: selectedPackage?.PhotographerId?._id || null,
        booking_date: formData.bookingDate,
        start_time: formData.startTime,
        completion_date: formData.completionDate || null,
        estimated_duration_days: formData.estimatedDuration ? Number(formData.estimatedDuration) : null,
        guest_times: formData.guestTimes.filter(t => t),
        selected_services: formData.selectedServices,
        service_amount: servicePrice,
        // ✅ Gửi thêm phí di chuyển và tổng tiền để Backend lưu
        travel_fee: travelFeeAmount,
        total_amount: totalAmount,
        notes: formData.notes || "",
        special_requests: formData.specialRequests || "",
        location: {
          name: formData.location,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          map_link: formData.mapLink || "",
          coordinates: {
            lat: customerCoords.lat,
            lng: customerCoords.lng
          }
        }
      };

      console.log("📤 Sending order:", orderData);
      const response = await orderApi.createOrder(orderData);
      
      console.log("📥 Response API:", response); // Log để debug nếu lỗi

      // ✅ XỬ LÝ DỮ LIỆU AN TOÀN:
      // Kiểm tra xem data nằm ở response.data hay response.data.data
      const responseData = response.data || response; 
      const orderResult = responseData.data || responseData.order || responseData;
      const paymentInfo = responseData.payment_info || responseData.paymentInfo || {};

      if (!orderResult || !orderResult._id) {
        throw new Error("Không nhận được ID đơn hàng từ Server");
      }
      
      toast.success("Đặt dịch vụ thành công!");
      
      // Chuyển đến trang thanh toán
      navigate("/payment", { 
        state: { 
          order: orderResult,
          transfer_code: paymentInfo.transfer_code,
          deposit_required: paymentInfo.deposit_required
        } 
      });

    } catch (error) {
      console.error("❌ Create order error:", error);
      const msg = error.response?.data?.message || error.message || "Lỗi khi tạo đơn hàng";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (img) =>
    !img ? "/no-image.jpg"
         : img.startsWith("http") ? img
         : `http://localhost:5000/${img.replace(/^\/+/, "")}`;

  return (
    <>
      <Header />
      <Sidebar />

      <div className="order-service-page">
        <div className="container">
          <div className="order-header">
            <button onClick={() => navigate(-1)} className="btn-back">
              <ArrowLeft size={20} /> Quay lại
            </button>
            <h1>Đặt Dịch Vụ Chụp Ảnh</h1>
            <p className="order-subtitle">Điền thông tin để hoàn tất đặt hàng</p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải thông tin...</p>
            </div>
          ) : (
            <div className="order-content">
              <form className="order-form" onSubmit={handleSubmit}>
                
                {/* THÔNG TIN KHÁCH HÀNG */}
                <div className="form-section">
                  <div className="section-header">
                    <User />
                    <h2>Thông tin khách hàng</h2>
                  </div>
                  <div className="form-group">
                    <label>Họ và tên <span className="required">*</span></label>
                    <input 
                      name="customerName" 
                      value={formData.customerName} 
                      onChange={handleInputChange}
                      className={formErrors.customerName ? 'error' : ''}
                    />
                    {formErrors.customerName && <span className="error-message">{formErrors.customerName}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Số điện thoại</label>
                      <input name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                {/* THÔNG TIN DỊCH VỤ */}
                <div className="form-section">
                  <div className="section-header">
                    <Package />
                    <h2>Thông tin dịch vụ</h2>
                  </div>
                  <div className="form-group">
                    <label>Chọn gói dịch vụ <span className="required">*</span></label>
                    <select 
                      name="packageId" 
                      value={formData.packageId} 
                      onChange={handlePackageSelect}
                      className={formErrors.packageId ? 'error' : ''}
                    >
                      <option value="">-- Chọn gói dịch vụ --</option>
                      {packages.map(pkg => (
                        <option key={pkg._id} value={pkg._id}>{pkg.TenGoi}</option>
                      ))}
                    </select>
                    {formErrors.packageId && <span className="error-message">{formErrors.packageId}</span>}
                  </div>

                  {/* DỊCH VỤ CON */}
                  {selectedPackage?.DichVu?.length > 0 && (
                    <div className="form-group">
                      <label>Chọn dịch vụ <span className="required">*</span></label>
                      <div className="services-selection">
                        {selectedPackage.DichVu.map((service, index) => (
                          <div 
                            key={index}
                            className={`service-item ${formData.selectedServices.includes(index) ? 'selected' : ''}`}
                            onClick={() => handleServiceToggle(index)}
                          >
                            <div className="service-checkbox">
                              {formData.selectedServices.includes(index) && <Check size={16} />}
                            </div>
                            <div className="service-details">
                              <h4>{service.name}</h4>
                              <p className="service-price">{formatPrice(service.Gia)} VNĐ</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {formErrors.selectedServices && <span className="error-message">{formErrors.selectedServices}</span>}
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Ngày đặt <span className="required">*</span></label>
                      <input 
                        type="date" 
                        name="bookingDate" 
                        value={formData.bookingDate} 
                        min={todayISODate} 
                        onChange={handleInputChange} 
                        className={formErrors.bookingDate ? 'error' : ''} 
                      />
                      {formErrors.bookingDate && <span className="error-message">{formErrors.bookingDate}</span>}
                    </div>
                    <div className="form-group">
                      <label>Giờ bắt đầu <span className="required">*</span></label>
                      <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className={formErrors.startTime ? 'error' : ''} />
                      {formErrors.startTime && <span className="error-message">{formErrors.startTime}</span>}
                    </div>
                  </div>
                </div>

                {/* ĐỊA ĐIỂM - CẬP NHẬT */}
                <div className="form-section">
                  <div className="section-header">
                    <MapPin />
                    <h2>Địa điểm chụp</h2>
                  </div>
                  
                  <div className="form-group">
                    <label>Địa chỉ <span className="required">*</span></label>
                    <input name="address" value={formData.address} onChange={handleInputChange} className={formErrors.address ? 'error' : ''} placeholder="Nhập địa chỉ chi tiết" />
                    {formErrors.address && <span className="error-message">{formErrors.address}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Thành phố</label>
                      <input name="city" value={formData.city} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Quận/Huyện</label>
                      <input name="district" value={formData.district} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Link Google Maps (để tính phí di chuyển)</label>
                    <div className="map-input-group">
                      <input 
                        name="mapLink" 
                        value={formData.mapLink} 
                        onChange={handleMapLinkChange}
                        placeholder="Dán link Google Maps hoặc bấm nút lấy vị trí"
                      />
                      <button type="button" onClick={handleGetCurrentLocation} className="btn-location">
                        <Navigation size={18} />
                        Lấy vị trí
                      </button>
                    </div>
                    <small style={{ color: '#6b7280', marginTop: 4, display: 'block' }}>
                      Vị trí giúp tính chính xác phí di chuyển
                    </small>
                  </div>

                  {/* ✅ HIỂN THỊ TỌA ĐỘ ĐÃ NHẬN */}
                  {customerCoords.lat && customerCoords.lng && (
                    <div className="info-box" style={{ background: '#ecfdf5', borderColor: '#10b981' }}>
                      <MapPin size={18} style={{ color: '#10b981' }} />
                      <span style={{ color: '#065f46' }}>
                        Tọa độ: <strong>{customerCoords.lat.toFixed(6)}, {customerCoords.lng.toFixed(6)}</strong>
                      </span>
                    </div>
                  )}

                  {/* ✅ HIỂN THỊ PHÍ DI CHUYỂN */}
                  {calculatingFee && (
                    <div className="info-box">
                      <Loader size={18} className="spin" />
                      <span>Đang tính phí di chuyển...</span>
                    </div>
                  )}

                  {travelFee && !calculatingFee && (
                    <div className="travel-fee-box">
                      <div className="travel-fee-header">
                        <Truck size={20} />
                        <h4>Phí di chuyển</h4>
                      </div>
                      
                      <div className="travel-fee-details">
                        <div className="fee-row">
                          <span>Khoảng cách:</span>
                          <strong>{travelFee.distance_km} km</strong>
                        </div>
                        
                        {travelFee.free_distance_km > 0 && (
                          <div className="fee-row">
                            <span>Khoảng cách miễn phí:</span>
                            <strong>{travelFee.free_distance_km} km</strong>
                          </div>
                        )}
                        
                        {travelFee.extra_km > 0 && (
                          <div className="fee-row">
                            <span>Khoảng cách tính phí:</span>
                            <strong>{travelFee.extra_km} km</strong>
                          </div>
                        )}
                        
                        <div className="fee-row total">
                          <span>Phí di chuyển:</span>
                          <strong className={travelFee.fee > 0 ? 'has-fee' : 'no-fee'}>
                            {travelFee.fee > 0 ? `${formatPrice(travelFee.fee)} VNĐ` : 'Miễn phí'}
                          </strong>
                        </div>
                        
                        {travelFee.breakdown && (
                          <p className="fee-breakdown">{travelFee.breakdown}</p>
                        )}
                        
                        {travelFee.note && (
                          <p className="fee-note"><AlertCircle size={14} /> {travelFee.note}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Thông báo nếu gói không bật phí di chuyển */}
                  {selectedPackage && !selectedPackage.travelFeeConfig?.enabled && (
                    <div className="info-box">
                      <CheckCircle size={18} style={{ color: '#10b981' }} />
                      <span>Gói dịch vụ này không tính phí di chuyển</span>
                    </div>
                  )}
                </div>

                {/* GHI CHÚ */}
                <div className="form-section">
                  <div className="section-header">
                    <FileText />
                    <h2>Ghi chú</h2>
                  </div>
                  <div className="form-group">
                    <label>Ghi chú</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" />
                  </div>
                  <div className="form-group">
                    <label>Yêu cầu đặc biệt</label>
                    <textarea name="specialRequests" value={formData.specialRequests} onChange={handleInputChange} rows="3" />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => navigate(-1)} disabled={submitting}>Hủy bỏ</button>
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? (<><div className="btn-spinner"></div>Đang xử lý...</>) : (<><CheckCircle size={20} />Xác nhận đặt dịch vụ</>)}
                  </button>
                </div>
              </form>

              {/* SUMMARY */}
              <div className="order-summary-section">
                <div className="summary-sticky">
                  {selectedPackage ? (
                    <>
                      <div className="selected-package-card">
                        <div className="package-badge">{selectedPackage?.LoaiGoi}</div>
                        <img src={getImageUrl(selectedPackage.AnhBia)} onError={(e) => { e.target.src = "https://via.placeholder.com/400x250?text=No+Image"; }} alt={selectedPackage.TenGoi} />
                        <h3>{selectedPackage.TenGoi}</h3>

                        {formData.selectedServices.length > 0 && (
                          <div className="selected-services-summary">
                            <h4>Dịch vụ đã chọn ({formData.selectedServices.length})</h4>
                            <ul>
                              {formData.selectedServices.map(idx => (
                                <li key={idx}>
                                  <Check size={14} />
                                  <span>{selectedPackage.DichVu[idx].name}</span>
                                  <span className="price">{formatPrice(selectedPackage.DichVu[idx].Gia)} VNĐ</span>
                                </li>
                              ))}
                            </ul>
                            
                            <div className="price-breakdown">
                              <div className="price-row">
                                <span>Dịch vụ:</span>
                                <span>{formatPrice(calculateServicePrice())} VNĐ</span>
                              </div>
                              
                              {travelFee?.fee > 0 && (
                                <div className="price-row travel">
                                  <span><Truck size={14} /> Phí di chuyển ({travelFee.distance_km}km):</span>
                                  <span>{formatPrice(travelFee.fee)} VNĐ</span>
                                </div>
                              )}
                              
                              <div className="total-price">
                                <span>Tổng cộng:</span>
                                <span className="price">{formatPrice(calculateTotalPrice())} VNĐ</span>
                              </div>
                              
                              <div className="deposit-info">
                                <span>Cọc 30%:</span>
                                <span className="deposit-amount">{formatPrice(Math.round(calculateTotalPrice() * 0.3))} VNĐ</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="placeholder-box">
                      <Camera size={40} />
                      <p>Chọn gói dịch vụ để xem chi tiết</p>
                    </div>
                  )}
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