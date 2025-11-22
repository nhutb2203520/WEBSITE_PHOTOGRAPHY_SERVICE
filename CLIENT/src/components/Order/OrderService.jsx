import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, User, Phone, Mail, Package, FileText,
  CheckCircle, AlertCircle, DollarSign, Camera, ArrowLeft, Map,
  Check, Truck, Navigation, Loader, Search, AlertTriangle
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
  
  // ✅ STATE QUẢN LÝ PHÍ DI CHUYỂN
  const [travelFee, setTravelFee] = useState(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [customerCoords, setCustomerCoords] = useState({ lat: null, lng: null });
  const [isSearchingAddress, setIsSearchingAddress] = useState(false); 

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

  // ✅ TỰ ĐỘNG TÍNH PHÍ KHI CÓ TỌA ĐỘ (Debounce 800ms)
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
        if (result.error) {
            console.warn("Travel Fee Warning:", result.error);
        }
      }
    } catch (error) {
      console.error("❌ Lỗi tính phí:", error);
    } finally {
      setCalculatingFee(false);
    }
  };

  const loadSelectedPackage = async (packageId) => {
    try {
      const response = await servicePackageApi.getPackageById(packageId);
      if (response) {
        setSelectedPackage(response);
        // Lấy số ngày thực hiện, nếu chuỗi không phải số thì không set
        let duration = response.ThoiGianThucHien;
        // Chỉ lấy số đầu tiên trong chuỗi (ví dụ "2 ngày" -> 2)
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    
    if (name === "bookingDate") {
        // Gọi hàm tính toán ngay khi đổi ngày
        calculateCompletionDate(value, formData.estimatedDuration);
    }
  };

  // ✅ FIX LỖI CRASH KHI CHỌN NGÀY
  const calculateCompletionDate = (bookingDate, duration) => {
    // Nếu thiếu ngày hoặc thời gian thực hiện -> Không tính
    if (!bookingDate || !duration) return;

    // Chuyển đổi duration sang số, nếu không phải số thì bỏ qua
    const daysToAdd = parseInt(duration);
    if (isNaN(daysToAdd)) return;

    try {
      const d = new Date(bookingDate);
      // Kiểm tra ngày hợp lệ
      if (isNaN(d.getTime())) return;

      d.setDate(d.getDate() + daysToAdd);
      
      // Kiểm tra lại lần nữa trước khi gọi toISOString
      if (!isNaN(d.getTime())) {
        setFormData(prev => ({ ...prev, completionDate: d.toISOString().split("T")[0] }));
      }
    } catch (error) {
      console.error("❌ Lỗi tính ngày hoàn thành:", error);
    }
  };

  const handlePackageSelect = (e) => {
    const id = e.target.value;
    setFormData(prev => ({ ...prev, packageId: id, selectedServices: [] }));
    setTravelFee(null);
    if (id) loadSelectedPackage(id);
    else setSelectedPackage(null);
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

  // --- XỬ LÝ BẢN ĐỒ & VỊ TRÍ ---

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
      (err) => {
        toast.error("Vui lòng cho phép truy cập vị trí hoặc nhập thủ công.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAutoGetCoordinates = async () => {
    const fullAddress = `${formData.address}, ${formData.district}, ${formData.city}`.replace(/(^,)|(,$)/g, "").trim();
    
    if (fullAddress.length < 5) {
      return toast.warning("Vui lòng nhập địa chỉ cụ thể (Đường, Quận/Huyện, Tỉnh/TP)");
    }

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
        toast.success("Đã tìm thấy tọa độ từ địa chỉ!");
      } else {
        toast.error("Không tìm thấy tọa độ. Vui lòng kiểm tra lại địa chỉ hoặc dùng 'Lấy vị trí'.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Lỗi khi tìm kiếm địa chỉ.");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const parseGoogleMapsLink = (link) => {
    if (!link) return null;
    
    if (link.includes("goo.gl") || link.includes("maps.app")) {
      toast.warning("Link rút gọn không chứa tọa độ. Vui lòng dùng nút 'Tìm từ địa chỉ' hoặc copy link đầy đủ trên thanh trình duyệt.");
      return null;
    }

    const match1 = link.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match1) return { lat: parseFloat(match1[1]), lng: parseFloat(match1[2]) };
    
    const match2 = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match2) return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) };
    
    return null;
  };

  const handleMapLinkChange = (e) => {
    const link = e.target.value;
    setFormData(prev => ({ ...prev, mapLink: link }));
    
    const coords = parseGoogleMapsLink(link);
    if (coords) {
      setCustomerCoords(coords);
      toast.info(`Đã nhận diện: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
    }
  };

  // --- TÍNH TOÁN GIÁ ---
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

  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) errors.customerName = "Vui lòng nhập họ tên";
    if (!formData.packageId) errors.packageId = "Vui lòng chọn gói dịch vụ";
    if (!formData.bookingDate) errors.bookingDate = "Vui lòng chọn ngày";
    if (!formData.startTime) errors.startTime = "Vui lòng chọn giờ";
    if (!formData.address) errors.address = "Vui lòng nhập địa chỉ";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- SUBMIT ---
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

      if (!orderResult?._id) throw new Error("Không nhận được ID đơn hàng");
      
      toast.success("Tạo đơn hàng thành công!");
      
      navigate("/payment", { 
        state: { 
          order: orderResult,
          transfer_code: paymentInfo.transfer_code,
          deposit_required: paymentInfo.deposit_required
        } 
      });

    } catch (error) {
      console.error("Create Order Error:", error);
      const msg = error.response?.data?.message || "Lỗi khi tạo đơn hàng";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (img) =>
    !img ? "/no-image.jpg"
         : img.startsWith("http") ? img
         : `http://localhost:5000/${img.replace(/^\/+/, "")}`;

  // ✅ HÀM RENDER PHẦN HIỂN THỊ PHÍ DI CHUYỂN THÔNG MINH
  const renderTravelFeeSection = () => {
    if (calculatingFee) {
      return (
        <div className="info-box">
          <Loader size={18} className="spin" />
          <span>Đang tính quãng đường lái xe...</span>
        </div>
      );
    }

    if (!travelFee) return null;

    // Trường hợp 1: Có lỗi (Ví dụ chưa set base location)
    if (travelFee.error) {
        return (
            <div className="info-box" style={{ borderColor: '#ef4444', backgroundColor: '#fef2f2', color: '#b91c1c' }}>
                <AlertTriangle size={18} />
                <span>{travelFee.error}</span>
            </div>
        );
    }

    // Trường hợp 2: Gói không tính phí (enabled = false)
    if (!travelFee.enabled) {
        return (
            <div className="info-box">
                <CheckCircle size={18} style={{ color: '#10b981' }} />
                <span>{travelFee.message || "Gói dịch vụ này miễn phí di chuyển"}</span>
            </div>
        );
    }

    // Trường hợp 3: Tính phí thành công
    return (
      <div className="travel-fee-box">
        <div className="travel-fee-header"><Truck size={20} /> <h4>Phí di chuyển (Lái xe)</h4></div>
        <div className="travel-fee-details">
          <div className="fee-row">
              <span>Quãng đường:</span>
              <strong>{travelFee.distance_km} km</strong>
          </div>
          {travelFee.free_distance_km > 0 && (
              <div className="fee-row"><span>Miễn phí:</span><span>{travelFee.free_distance_km} km đầu</span></div>
          )}
          <div className="fee-row total">
              <span>Phí áp dụng:</span>
              <strong className={travelFee.fee > 0 ? 'has-fee' : 'no-fee'}>
                  {travelFee.fee > 0 ? `${formatPrice(travelFee.fee)} VNĐ` : 'Miễn phí'}
              </strong>
          </div>
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
            <button onClick={() => navigate(-1)} className="btn-back">
              <ArrowLeft size={20} /> Quay lại
            </button>
            <h1>Đặt Dịch Vụ Chụp Ảnh</h1>
            <p className="order-subtitle">Điền thông tin bên dưới để hoàn tất đặt hàng</p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải thông tin...</p>
            </div>
          ) : (
            <div className="order-content">
              <form className="order-form" onSubmit={handleSubmit}>
                
                {/* KHÁCH HÀNG */}
                <div className="form-section">
                  <div className="section-header"><User /> <h2>Thông tin khách hàng</h2></div>
                  <div className="form-group">
                    <label>Họ tên <span className="required">*</span></label>
                    <input name="customerName" value={formData.customerName} onChange={handleInputChange} className={formErrors.customerName ? 'error' : ''} />
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>SĐT</label><input name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} /></div>
                    <div className="form-group"><label>Email</label><input name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} /></div>
                  </div>
                </div>

                {/* DỊCH VỤ */}
                <div className="form-section">
                  <div className="section-header"><Package /> <h2>Thông tin dịch vụ</h2></div>
                  <div className="form-group">
                    <label>Chọn gói <span className="required">*</span></label>
                    <select name="packageId" value={formData.packageId} onChange={handlePackageSelect} className={formErrors.packageId ? 'error' : ''}>
                      <option value="">-- Chọn gói dịch vụ --</option>
                      {packages.map(pkg => <option key={pkg._id} value={pkg._id}>{pkg.TenGoi}</option>)}
                    </select>
                  </div>
                  
                  {selectedPackage?.DichVu?.length > 0 && (
                    <div className="form-group">
                        <label>Chọn dịch vụ thêm</label>
                        <div className="services-selection">
                            {selectedPackage.DichVu.map((service, index) => (
                            <div key={index} className={`service-item ${formData.selectedServices.includes(index) ? 'selected' : ''}`} onClick={() => handleServiceToggle(index)}>
                                <div className="service-checkbox">{formData.selectedServices.includes(index) && <Check size={16} />}</div>
                                <div className="service-details"><h4>{service.name}</h4><p className="service-price">{formatPrice(service.Gia)} VNĐ</p></div>
                            </div>
                            ))}
                        </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                        <label>Ngày đặt <span className="required">*</span></label>
                        <input type="date" name="bookingDate" value={formData.bookingDate} min={todayISODate} onChange={handleInputChange} className={formErrors.bookingDate ? 'error' : ''} />
                    </div>
                    <div className="form-group">
                        <label>Giờ bắt đầu <span className="required">*</span></label>
                        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className={formErrors.startTime ? 'error' : ''} />
                    </div>
                  </div>
                </div>

                {/* 3. ĐỊA ĐIỂM & BẢN ĐỒ */}
                <div className="form-section">
                  <div className="section-header"><MapPin /> <h2>Địa điểm chụp</h2></div>
                  
                  <div className="form-group">
                    <label>Địa chỉ chi tiết <span className="required">*</span></label>
                    <input name="address" value={formData.address} onChange={handleInputChange} className={formErrors.address ? 'error' : ''} placeholder="Số nhà, tên đường..." />
                  </div>

                  <div className="form-row">
                    <div className="form-group"><label>Quận/Huyện</label><input name="district" value={formData.district} onChange={handleInputChange} placeholder="Ví dụ: Ninh Kiều" /></div>
                    <div className="form-group"><label>Tỉnh/Thành phố</label><input name="city" value={formData.city} onChange={handleInputChange} placeholder="Ví dụ: Cần Thơ" /></div>
                  </div>

                  {/* NÚT TỰ ĐỘNG TÌM TỌA ĐỘ TỪ ĐỊA CHỈ */}
                  <div className="geo-actions">
                    <button 
                      type="button" 
                      onClick={handleAutoGetCoordinates} 
                      className="btn-auto-geo"
                      disabled={isSearchingAddress}
                    >
                      {isSearchingAddress ? <Loader size={16} className="spin"/> : <Search size={16} />}
                      Tìm tọa độ từ địa chỉ trên
                    </button>
                    <span className="geo-divider">hoặc</span>
                    <button type="button" onClick={handleGetCurrentLocation} className="btn-location">
                       <Navigation size={16} /> Lấy vị trí hiện tại
                    </button>
                  </div>

                  <div className="form-group" style={{marginTop: 20}}>
                    <label>Link Google Maps (Tùy chọn)</label>
                    <input name="mapLink" value={formData.mapLink} onChange={handleMapLinkChange} placeholder="Dán link Google Maps dài (có chứa @lat,lng)" />
                    <small style={{color: '#6b7280', marginTop: 5, display: 'block'}}>
                        * Lưu ý: Link rút gọn (goo.gl) sẽ không tự động tính phí được. Hãy dùng nút "Tìm từ địa chỉ" ở trên.
                    </small>
                  </div>

                  {/* HIỂN THỊ TỌA ĐỘ */}
                  {customerCoords.lat && customerCoords.lng && (
                    <div className="info-box success">
                      <MapPin size={18} />
                      <span>
                        Đã nhận diện tọa độ: <strong>{customerCoords.lat.toFixed(6)}, {customerCoords.lng.toFixed(6)}</strong>
                      </span>
                    </div>
                  )}

                  {/* ✅ GỌI HÀM RENDER PHÍ THÔNG MINH */}
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

              {/* SUMMARY STICKY */}
              <div className="order-summary-section">
                <div className="summary-sticky">
                  {selectedPackage ? (
                    <div className="selected-package-card">
                        <div className="package-badge">{selectedPackage.LoaiGoi}</div>
                        <img src={getImageUrl(selectedPackage.AnhBia)} onError={(e)=>e.target.src='https://via.placeholder.com/400x250'} alt="" />
                        <h3>{selectedPackage.TenGoi}</h3>
                        
                        <div className="price-breakdown">
                            <div className="price-row"><span>Dịch vụ:</span><span>{formatPrice(calculateServicePrice())} VNĐ</span></div>
                            
                            {travelFee?.fee > 0 && (
                                <div className="price-row travel">
                                    <span><Truck size={14}/> Phí di chuyển:</span>
                                    <span>{formatPrice(travelFee.fee)} VNĐ</span>
                                </div>
                            )}

                            <div className="total-price"><span>Tổng cộng:</span><span className="price">{formatPrice(calculateTotalPrice())} VNĐ</span></div>
                            
                            <div className="deposit-info"><span>Cọc 30%:</span><span className="deposit-amount">{formatPrice(Math.round(calculateTotalPrice() * 0.3))} VNĐ</span></div>
                        </div>
                    </div>
                  ) : (
                    <div className="placeholder-box"><Camera size={40} /><p>Chọn gói dịch vụ để xem chi tiết</p></div>
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