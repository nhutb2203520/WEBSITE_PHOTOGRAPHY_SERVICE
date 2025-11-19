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
  Map,
  Check
} from 'lucide-react';
import './OrderService.css';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';
import servicePackageApi from '../../apis/ServicePackageService';
import orderApi from '../../apis/OrderService';

export default function OrderServices() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user || {});

  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const todayISODate = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    customerName: user?.HoTen || '',
    customerPhone: user?.SoDienThoai || '',
    customerEmail: user?.Email || '',
    packageId: '',
    selectedServices: [], 
    bookingDate: '',
    startTime: '',
    estimatedDuration: '', // days (number or string)
    completionDate: '',    // yyyy-mm-dd (editable)
    location: '',
    address: '',
    city: '',
    district: '',
    notes: '',
    specialRequests: '',
    mapLink: '',
    guestTimes: [''] // multiple time slots for receiving customers
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, location]);

  // Load details of a package
  const loadSelectedPackage = async (packageId) => {
    try {
      const response = await servicePackageApi.getPackageById(packageId);
      if (response) {
        setSelectedPackage(response);

        if (response.ThoiGianThucHien) {
          // assume ThoiGianThucHien is number of days or string
          setFormData(prev => ({ ...prev, estimatedDuration: String(response.ThoiGianThucHien) }));
          // If bookingDate already set, compute completion now safely
          if (prevHasValidDate(prev => prev.bookingDate)) {
            calculateCompletionDate(prevValue('bookingDate'), String(response.ThoiGianThucHien));
          }
        }

        // Do not auto-select services — keep selectedServices empty
        setFormData(prev => ({ ...prev, selectedServices: [] }));
      }
    } catch (error) {
      console.error("❌ Lỗi tải package:", error);
    }
  };

  const prevHasValidDate = (fn) => {
    try {
      const val = fn();
      if (!val) return false;
      const d = new Date(`${val}T00:00:00`);
      return !isNaN(d.getTime());
    } catch {
      return false;
    }
  };

  const prevValue = (key) => formData[key];

  // Fetch packages
  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await servicePackageApi.getAllPackages();
      const list = Array.isArray(response)
        ? response
        : response?.data || response?.packages || [];

      setPackages(list);
      if (list.length === 0) toast.info("Chưa có gói dịch vụ nào");
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách gói dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  // Safe compute of completion date: requires both bookingDate and duration
  const calculateCompletionDate = (bookingDate, duration) => {
    if (!bookingDate || duration === '' || duration === undefined || duration === null) {
      // if duration missing or bookingDate missing — don't set completion
      return;
    }

    // Booking date expected in yyyy-mm-dd — create Date at midnight
    const d = new Date(`${bookingDate}T00:00:00`);
    if (isNaN(d.getTime())) {
      // invalid date — abort safely
      return;
    }

    // convert duration to integer days (if user provided "1" or "1.0")
    const days = Number(duration);
    if (isNaN(days)) return;

    d.setDate(d.getDate() + Math.floor(days));
    const iso = d.toISOString().split("T")[0];
    setFormData(prev => ({ ...prev, completionDate: iso }));
  };

  // helper: set form value and clear error
  const setField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setField(name, value);

    // Recalculate completionDate when bookingDate or estimatedDuration change
    if (name === "bookingDate") {
      // if estimatedDuration exists, compute; else wait until it's set
      if (formData.estimatedDuration) {
        calculateCompletionDate(value, formData.estimatedDuration);
      }
    }

    if (name === "estimatedDuration") {
      // use bookingDate from state (may be blank)
      if (formData.bookingDate) {
        calculateCompletionDate(formData.bookingDate, value);
      }
    }

    // If user manually edits completionDate, accept it — no extra calc here
  };

  // Package select
  const handlePackageSelect = async (e) => {
    const id = e.target.value;
    setFormData(prev => ({
      ...prev,
      packageId: id,
      selectedServices: [] // do not auto-select
    }));

    if (!id) {
      setSelectedPackage(null);
      return;
    }

    try {
      const pkg = await servicePackageApi.getPackageById(id);
      setSelectedPackage(pkg);

      if (pkg?.ThoiGianThucHien) {
        setField('estimatedDuration', String(pkg.ThoiGianThucHien));
        // if bookingDate set -> calculate completion
        if (formData.bookingDate) calculateCompletionDate(formData.bookingDate, String(pkg.ThoiGianThucHien));
      }

      setField('selectedServices', []);
    } catch (error) {
      console.error("❌ Error loading package:", error);
      toast.error("Không thể tải thông tin gói dịch vụ");
    }
  };

  // Toggle service selection in package
  const handleServiceToggle = (serviceIndex) => {
    setFormData(prev => {
      const isSelected = prev.selectedServices.includes(serviceIndex);
      const newSelectedServices = isSelected
        ? prev.selectedServices.filter(i => i !== serviceIndex)
        : [...prev.selectedServices, serviceIndex];

      return { ...prev, selectedServices: newSelectedServices };
    });
    setFormErrors(prev => ({ ...prev, selectedServices: '' }));
  };

  // Guest times helpers: multiple time slots
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
    setFormData(prev => {
      const updated = prev.guestTimes.filter((_, i) => i !== index);
      return { ...prev, guestTimes: updated };
    });
  };

  // GPS: get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error("Trình duyệt không hỗ trợ định vị!");

    toast.info("Đang lấy vị trí...");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const link = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
        setFormData(prev => ({
          ...prev,
          mapLink: link,
          location: `${coords.latitude}, ${coords.longitude}`
        }));
        toast.success("Đã lấy vị trí!");
      },
      () => toast.error("Không thể lấy vị trí")
    );
  };

  const handleOpenGoogleMaps = () => {
    const q = formData.address || formData.location || "Việt Nam";
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(q)}`, "_blank");
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) errors.customerName = "Vui lòng nhập họ tên";
    if (!formData.packageId) errors.packageId = "Vui lòng chọn gói dịch vụ";
    if (formData.selectedServices.length === 0) errors.selectedServices = "Vui lòng chọn ít nhất một dịch vụ";
    if (!formData.bookingDate) errors.bookingDate = "Vui lòng chọn ngày đặt";
    if (!formData.startTime) errors.startTime = "Vui lòng chọn giờ bắt đầu";
    if (!formData.address.trim()) errors.address = "Vui lòng nhập địa chỉ chụp";

    // guestTimes validation: ensure no empty entries (optional)
    const invalidGuestTimes = formData.guestTimes.some(t => t !== '' && !/^\d{2}:\d{2}$/.test(t));
    if (invalidGuestTimes) errors.guestTimes = "Vui lòng kiểm tra các khung giờ tiếp khách";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit
  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return toast.error("Vui lòng kiểm tra lại thông tin");

    try {
      setSubmitting(true);

      // 🔥 TÍNH TỔNG GIÁ TRỊ ĐƠN HÀNG
      const totalPrice = calculateTotalPrice();

      // 🔥 GỬI ĐẦY ĐỦ DỮ LIỆU THEO YÊU CẦU CỦA BACKEND
      const orderData = {
        service_package_id: formData.packageId,
        photographer_id: selectedPackage?.PhotographerId?._id || null,
        booking_date: formData.bookingDate,
        start_time: formData.startTime, // ✅ Trường này backend cần
        completion_date: formData.completionDate || null,
        estimated_duration_days: formData.estimatedDuration ? Number(formData.estimatedDuration) : null,
        guest_times: formData.guestTimes.filter(t => t), // remove empty strings
        selected_services: formData.selectedServices, // ✅ Thêm trường này
        total_amount: totalPrice, // ✅ Thêm trường này
        notes: formData.notes || "",
        special_requests: formData.specialRequests || "",
        location: {
          name: formData.location,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          map_link: formData.mapLink || ""
        }
      };

      console.log("📤 Sending order data:", orderData); // DEBUG để kiểm tra

      await orderApi.createOrder(orderData);

      toast.success("Đặt dịch vụ thành công!");
      navigate("/my-orders");
    } catch (error) {
      console.error("❌ Create order error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Lỗi khi tạo đơn hàng";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  const formatPrice = (p) => Number(p || 0).toLocaleString("vi-VN");

  const calculateTotalPrice = () => {
    if (!selectedPackage?.DichVu || formData.selectedServices.length === 0) return 0;
    return formData.selectedServices.reduce((total, index) => {
      const service = selectedPackage.DichVu[index];
      return total + (Number(service?.Gia) || 0);
    }, 0);
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

          {/* HEADER */}
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

              {/* FORM */}
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
                      <input 
                        name="customerPhone" 
                        value={formData.customerPhone} 
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input 
                        name="customerEmail" 
                        value={formData.customerEmail} 
                        onChange={handleInputChange}
                      />
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
                        <option key={pkg._id} value={pkg._id}>
                          {pkg.TenGoi}
                        </option>
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

                      {formErrors.selectedServices && (
                        <span className="error-message">{formErrors.selectedServices}</span>
                      )}
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
                      <input 
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className={formErrors.startTime ? 'error' : ''}
                      />
                      {formErrors.startTime && <span className="error-message">{formErrors.startTime}</span>}
                    </div>
                  </div>

                  {/* Estimated duration & completion */}
                  <div style={{ marginTop: 12 }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Thời gian thực hiện (số ngày)</label>
                        <input
                          name="estimatedDuration"
                          value={formData.estimatedDuration}
                          onChange={handleInputChange}
                          placeholder="VD: 1"
                        />
                      </div>

                      <div className="form-group">
                        <label>Ngày hoàn thành dự kiến</label>
                        <input
                          type="date"
                          name="completionDate"
                          value={formData.completionDate}
                          min={formData.bookingDate || todayISODate}
                          onChange={(e) => {
                            // user can manually edit completion date
                            setField('completionDate', e.target.value);
                          }}
                        />
                        <small style={{ display: 'block', marginTop: 6, color: '#6b7280' }}>
                          (Tự tính khi bạn đã nhập ngày đặt và thời gian thực hiện; bạn có thể chỉnh sửa)
                        </small>
                      </div>
                    </div>
                  </div>

                  {formData.estimatedDuration && (
                    <div className="info-box" style={{ marginTop: 12 }}>
                      <Clock size={18} />
                      <span>Thời gian thực hiện dự kiến: <strong>{formData.estimatedDuration}</strong></span>
                    </div>
                  )}
                </div>

                {/* THỜI GIAN TIẾP KHÁCH: nhiều khung giờ */}
                <div className="form-section">
                  <div className="section-header">
                    <Clock />
                    <h2>Thời gian tiếp khách</h2>
                  </div>

                  {formData.guestTimes.map((t, idx) => (
                    <div className="form-row" key={idx} style={{ alignItems: 'center' }}>
                      <div className="form-group">
                        <label>Khung giờ {idx + 1}</label>
                        <input
                          type="time"
                          value={t}
                          onChange={(e) => handleGuestTimeChange(idx, e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                        {idx > 0 && (
                          <button
                            type="button"
                            className="btn-cancel"
                            style={{ padding: '10px 12px', minWidth: 80 }}
                            onClick={() => removeGuestTime(idx)}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn-map"
                      onClick={addGuestTime}
                      style={{ background: '#eef2ff', color: '#374151', borderColor: '#c7d2fe', padding: '10px 14px' }}
                    >
                      + Thêm khung giờ
                    </button>
                    {formErrors.guestTimes && <div className="error-message" style={{ marginTop: 8 }}>{formErrors.guestTimes}</div>}
                  </div>
                </div>

                {/* ĐỊA ĐIỂM */}
                <div className="form-section">
                  <div className="section-header">
                    <MapPin />
                    <h2>Địa điểm chụp</h2>
                  </div>

                  <div className="form-group">
                    <label>Tên địa điểm</label>
                    <input 
                      name="location" 
                      value={formData.location} 
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Địa chỉ <span className="required">*</span></label>
                    <input 
                      name="address" 
                      value={formData.address} 
                      onChange={handleInputChange}
                      className={formErrors.address ? 'error' : ''}
                    />
                    {formErrors.address && <span className="error-message">{formErrors.address}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Thành phố</label>
                      <input 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Quận/Huyện</label>
                      <input 
                        name="district" 
                        value={formData.district} 
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Link Google Maps</label>
                    <div className="map-input-group">
                      <input 
                        name="mapLink" 
                        value={formData.mapLink} 
                        onChange={handleInputChange}
                      />

                      <button type="button" onClick={handleOpenGoogleMaps} className="btn-map">
                        <Map size={18} />
                        Mở Maps
                      </button>

                      <button type="button" onClick={handleGetCurrentLocation} className="btn-location">
                        <MapPin size={18} />
                        Vị trí
                      </button>
                    </div>
                  </div>
                </div>

                {/* GHI CHÚ */}
                <div className="form-section">
                  <div className="section-header">
                    <FileText />
                    <h2>Ghi chú & Yêu cầu đặc biệt</h2>
                  </div>

                  <div className="form-group">
                    <label>Ghi chú</label>
                    <textarea 
                      name="notes" 
                      value={formData.notes} 
                      onChange={handleInputChange}
                      rows="4"
                    />
                  </div>

                  <div className="form-group">
                    <label>Yêu cầu đặc biệt</label>
                    <textarea 
                      name="specialRequests" 
                      value={formData.specialRequests} 
                      onChange={handleInputChange}
                      rows="4"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={() => navigate(-1)}
                    disabled={submitting}
                  >
                    Hủy bỏ
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

              {/* SUMMARY */}
              <div className="order-summary-section">
                <div className="summary-sticky">

                  {selectedPackage ? (
                    <>
                      <div className="selected-package-card">
                        <div className="package-badge">{selectedPackage?.LoaiGoi}</div>

                        <img 
                          src={getImageUrl(selectedPackage.AnhBia)}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x250?text=No+Image";
                          }}
                          alt={selectedPackage.TenGoi}
                        />

                        <h3>{selectedPackage.TenGoi}</h3>
                        <p className="package-desc">{selectedPackage.MoTa}</p>

                        {formData.selectedServices.length > 0 && (
                          <div className="selected-services-summary">
                            <h4>Dịch vụ đã chọn ({formData.selectedServices.length})</h4>

                            <ul>
                              {formData.selectedServices.map(idx => (
                                <li key={idx}>
                                  <Check size={14} />
                                  <span>{selectedPackage.DichVu[idx].name}</span>
                                  <span className="price">
                                    {formatPrice(selectedPackage.DichVu[idx].Gia)} VNĐ
                                  </span>
                                </li>
                              ))}
                            </ul>

                            <div className="total-price">
                              <span>Tổng cộng:</span>
                              <span className="price">{formatPrice(calculateTotalPrice())} VNĐ</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="important-notes">
                        <div className="note-header">
                          <AlertCircle />
                          <h4>Lưu ý quan trọng</h4>
                        </div>
                        <ul>
                          <li>Vui lòng đặt trước ít nhất 2 ngày</li>
                          <li>Photographer sẽ liên hệ xác nhận trong 24h</li>
                          <li>Có thể thay đổi lịch trước 1 ngày</li>
                          <li>Thanh toán sau khi hoàn thành dịch vụ</li>
                        </ul>
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
