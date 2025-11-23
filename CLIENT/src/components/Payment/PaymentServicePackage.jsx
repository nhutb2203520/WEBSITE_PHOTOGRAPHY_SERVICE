import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CreditCard, Calendar, MapPin, Clock, CheckCircle, 
  Copy, AlertTriangle, ShieldCheck, Wallet, Upload, X, ChevronDown, Loader
} from 'lucide-react';
import { toast } from 'react-toastify';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './PaymentServicePackage.css';
import orderApi from '../../apis/OrderService';
import paymentMethodService from '../../apis/paymentMethodService';

export default function PaymentServicePackage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy dữ liệu từ trang Order (MyOrder hoặc OrderService)
  // deposit_required: Là số tiền CẦN THANH TOÁN (có thể là cọc hoặc phần còn lại)
  const { order: initialOrder, transfer_code, deposit_required: amountFromState, is_remaining } = location.state || {};

  // ✅ State lưu trữ order mới nhất, khởi tạo bằng data truyền qua state
  const [orderData, setOrderData] = useState(initialOrder);
  const [paymentMethod, setPaymentMethod] = useState('banking');
  const [loading, setLoading] = useState(false);
  
  // STATE QUẢN LÝ THÔNG TIN NGÂN HÀNG
  const [adminBanks, setAdminBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [loadingBanks, setLoadingBanks] = useState(true);

  // State cho ảnh minh chứng
  const [proofImage, setProofImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!initialOrder) {
      toast.error('Không tìm thấy thông tin đơn hàng');
      navigate('/');
      return;
    }
    
    // ✅ TỰ ĐỘNG FETCH LẠI ĐƠN HÀNG ĐỂ CÓ DỮ LIỆU POPULATE (NẾU CẦN)
    // Nếu service_package_id chỉ là string (ID) thay vì object, nghĩa là chưa populate
    if (initialOrder && typeof initialOrder.service_package_id === 'string') {
        const fetchFullOrder = async () => {
            try {
                const res = await orderApi.getOrderDetail(initialOrder._id || initialOrder.order_id);
                if (res && res.data) {
                    setOrderData(res.data);
                }
            } catch (error) {
                console.error("Lỗi tải chi tiết đơn hàng:", error);
            }
        };
        fetchFullOrder();
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [initialOrder, navigate, previewUrl]);

  // 1. TỰ ĐỘNG LẤY THÔNG TIN NGÂN HÀNG CỦA ADMIN
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingBanks(true);
        const res = await paymentMethodService.getAllPaymentMethods();
        
        const methods = Array.isArray(res) ? res : (res.data || []);
        const activeMethods = methods.filter(m => m.isActive);

        setAdminBanks(activeMethods);
        
        if (activeMethods.length > 0) {
          setSelectedBank(activeMethods[0]);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin ngân hàng:", error);
        toast.error("Không thể tải thông tin thanh toán.");
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  if (!orderData) return null;

  // --- XỬ LÝ URL ẢNH (LẤY TỪ ORDER DATA ĐÃ UPDATE) ---
  const getPackageImage = () => {
    // Thử lấy ảnh bìa từ object service_package_id (sau khi populate)
    const imgPath = orderData.service_package_id?.AnhBia;
    
    if (!imgPath) return "https://placehold.co/100x100?text=No+Image"; // Fallback
    if (imgPath.startsWith("http")) return imgPath;
    return `http://localhost:5000/${imgPath.replace(/^\/+/, "")}`;
  };

  // --- TÍNH TOÁN SỐ TIỀN & NỘI DUNG ---
  const serviceFee = Number(orderData.service_amount) || 0;
  const travelFee = Number(orderData.travel_fee_amount) || 0;
  const totalAmount = Number(orderData.total_amount) || (serviceFee + travelFee);
  
  // Số tiền cần thanh toán 
  const paymentAmount = Number(amountFromState) || Math.round(totalAmount * 0.3);
  
  // Mã giao dịch
  const transactionCode = transfer_code || `PAY ${orderData.order_id ? orderData.order_id.slice(-6).toUpperCase() : 'UNKNOWN'}`;

  // Label hiển thị
  const paymentLabel = is_remaining ? "Thanh toán phần còn lại" : "Đặt cọc (30%)";
  const paymentShortLabel = is_remaining ? "Số tiền TT" : "Số tiền cọc";

  // 2. TẠO LINK VIETQR
  const qrUrl = selectedBank 
    ? `https://img.vietqr.io/image/${selectedBank.bank}-${selectedBank.accountNumber}-compact2.png?amount=${paymentAmount}&addInfo=${transactionCode}&accountName=${encodeURIComponent(selectedBank.fullName)}`
    : null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const formatPrice = (price) => Number(price || 0).toLocaleString('vi-VN');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB");
        return;
      }
      setProofImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setProofImage(null);
    setPreviewUrl(null);
  };

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'banking' && !proofImage) {
      toast.warning('Vui lòng tải lên ảnh minh chứng chuyển khoản!');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('method', paymentMethod);
      formData.append('amount', paymentAmount);
      formData.append('transaction_code', transactionCode);
      
      if (selectedBank) {
        formData.append('bank_id', selectedBank._id || selectedBank.id);
      }
      
      if (proofImage) {
        formData.append('payment_proof', proofImage); 
      }

      // Gọi API xác nhận
      await orderApi.confirmPayment(orderData._id || orderData.order_id, formData);

      toast.success('Đã gửi xác nhận thanh toán! Vui lòng chờ duyệt.');
      navigate('/my-orders'); 
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Lỗi khi xác nhận. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="payment-page">
        <div className="payment-container">
          
          {/* CỘT TRÁI: PHƯƠNG THỨC THANH TOÁN */}
          <div className="payment-left">
            <div className="section-title">
              <Wallet className="text-green-600" />
              Phương thức thanh toán
            </div>

            <div className="payment-tabs">
              <div 
                className={`payment-tab ${paymentMethod === 'banking' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('banking')}
              >
                <CreditCard size={20} />
                Chuyển khoản
              </div>
              <div 
                className={`payment-tab ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Wallet size={20} />
                Tiền mặt
              </div>
            </div>

            {paymentMethod === 'banking' ? (
              <div className="qr-section animate-fade-in">
                
                {loadingBanks ? (
                   <div className="loading-banks">
                     <Loader className="spin" /> Đang tải thông tin ngân hàng...
                   </div>
                ) : adminBanks.length === 0 ? (
                   <div className="no-banks-alert">
                     <AlertTriangle className="text-yellow-500"/> 
                     Chưa có thông tin ngân hàng. Vui lòng liên hệ Admin.
                   </div>
                ) : (
                  <>
                    {/* Dropdown chọn ngân hàng */}
                    {adminBanks.length > 1 && (
                      <div className="bank-selector">
                        <label>Chọn ngân hàng thụ hưởng:</label>
                        <div className="select-wrapper">
                          <select 
                            value={selectedBank?._id || selectedBank?.id} 
                            onChange={(e) => {
                              const bank = adminBanks.find(b => (b._id || b.id) === e.target.value);
                              setSelectedBank(bank);
                            }}
                          >
                            {adminBanks.map(bank => (
                              <option key={bank._id || bank.id} value={bank._id || bank.id}>
                                {bank.bank} - {bank.accountNumber} ({bank.fullName})
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="select-icon"/>
                        </div>
                      </div>
                    )}

                    {/* QR Code & Info */}
                    {selectedBank && (
                      <>
                        <img src={qrUrl} alt="VietQR Code" className="qr-image" />
                        
                        <div className="bank-details">
                          <div className="detail-row">
                            <span className="text-gray-500">Ngân hàng</span>
                            <span className="font-bold">
                                {selectedBank.bank} {selectedBank.branch ? `(${selectedBank.branch})` : ''}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="text-gray-500">Chủ tài khoản</span>
                            <span className="font-bold text-uppercase">{selectedBank.fullName}</span>
                          </div>
                          <div className="detail-row">
                            <span className="text-gray-500">Số tài khoản</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-green-700">{selectedBank.accountNumber}</span>
                              <button className="copy-btn" onClick={() => handleCopy(selectedBank.accountNumber)}>
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="detail-row">
                            <span className="text-gray-500">{paymentShortLabel}</span>
                            <span className="font-bold text-lg text-red-600">{formatPrice(paymentAmount)} VNĐ</span>
                          </div>
                          <div className="detail-row">
                            <span className="text-gray-500">Nội dung CK</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-600">{transactionCode}</span>
                              <button className="copy-btn" onClick={() => handleCopy(transactionCode)}>
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* UPLOAD ẢNH */}
                <div className="upload-section">
                  <label className="upload-label">Tải lên minh chứng thanh toán (Bill)</label>
                  
                  {!proofImage ? (
                    <div className="upload-box">
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="file-upload" 
                        hidden 
                        onChange={handleImageChange}
                      />
                      <label htmlFor="file-upload" className="upload-trigger">
                        <Upload size={30} className="text-gray-400 mb-2" />
                        <span>Nhấn để tải ảnh lên</span>
                      </label>
                    </div>
                  ) : (
                    <div className="image-preview-container">
                      <img src={previewUrl} alt="Proof" className="image-preview" />
                      <button className="remove-image-btn" onClick={removeImage}>
                        <X size={16} />
                      </button>
                      <span className="file-name">{proofImage.name}</span>
                    </div>
                  )}
                </div>

                <div className="transfer-note">
                  <AlertTriangle size={16} className="inline mr-2" />
                  Vui lòng tải lên ảnh chụp màn hình chuyển khoản thành công.
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <MapPin size={40} className="mx-auto text-gray-400 mb-3" />
                <h3 className="font-bold text-gray-700 mb-2">Thanh toán tại Studio</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Vui lòng đến trực tiếp studio để thanh toán trong vòng 24h tới.
                </p>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: TÓM TẮT */}
          <div className="payment-right">
            <div className="summary-card">
              <div className="section-title">
                <ShieldCheck className="text-blue-600" />
                Thông tin đặt lịch
              </div>

              <div className="package-mini-info">
                {/* ✅ Sử dụng ảnh thật từ orderData */}
                <img 
                  src={getPackageImage()} 
                  alt="Package" 
                  className="w-20 h-20 object-cover rounded"
                  onError={(e) => { e.target.src = "https://placehold.co/100x100?text=No+Image"; }}
                /> 
                <div>
                  <h3>Đơn hàng #{orderData.order_id ? orderData.order_id.slice(-6).toUpperCase() : '...'}</h3>
                  <div className="info-line">
                    <Calendar size={14} /> {orderData.booking_date ? new Date(orderData.booking_date).toLocaleDateString('vi-VN') : '...'}
                  </div>
                  <div className="info-line">
                    <Clock size={14} /> {orderData.start_time}
                  </div>
                </div>
              </div>

              <div className="price-summary">
                <div className="price-row total">
                  <span>Tổng đơn hàng</span>
                  <span className="text-xl">{formatPrice(totalAmount)} VNĐ</span>
                </div>
                <div className="deposit-highlight">
                  <div className="deposit-row">
                    <span className="deposit-label">{paymentLabel}</span>
                    <span>{formatPrice(paymentAmount)} VNĐ</span>
                  </div>
                </div>
              </div>

              <div className="actions">
                <button 
                  className="btn-confirm" 
                  onClick={handleConfirmPayment}
                  disabled={loading}
                >
                  {loading ? 'Đang gửi...' : (
                    <>
                      <CheckCircle size={20} />
                      {paymentMethod === 'banking' ? 'Tôi đã chuyển khoản' : 'Xác nhận thanh toán'}
                    </>
                  )}
                </button>
                <button className="btn-back-home" onClick={() => navigate('/')}>
                  Về trang chủ
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}