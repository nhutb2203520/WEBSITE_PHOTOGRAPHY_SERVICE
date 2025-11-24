import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CreditCard, Calendar, Clock, CheckCircle, 
  Copy, AlertTriangle, ShieldCheck, Upload, X, ChevronDown, Loader, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './PaymentServicePackage.css';
import orderApi from '../../apis/OrderService';
import paymentMethodService from '../../apis/paymentMethodService';

// ⚠️ Tốt nhất nên đưa vào file config hoặc biến môi trường (.env)
const API_BASE_URL = 'http://localhost:5000'; 

export default function PaymentServicePackage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy dữ liệu từ state khi điều hướng (navigate)
  const { order: initialOrder, deposit_required: amountFromState, is_remaining } = location.state || {};

  const [orderData, setOrderData] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  
  const [adminBanks, setAdminBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [loadingBanks, setLoadingBanks] = useState(true);

  const [proofImage, setProofImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // --- 1. Lấy thông tin đơn hàng chi tiết ---
  useEffect(() => {
    if (!initialOrder) {
      toast.error('Không tìm thấy thông tin đơn hàng. Vui lòng thử lại.');
      navigate('/'); // Quay về trang chủ nếu không có dữ liệu
      return;
    }
    
    // Nếu chỉ có ID gói (string), cần fetch lại full data để lấy tên gói, ảnh, v.v.
    if (initialOrder && typeof initialOrder.service_package_id === 'string') {
        const fetchFullOrder = async () => {
            try {
                const orderId = initialOrder._id || initialOrder.order_id;
                const res = await orderApi.getOrderDetail(orderId);
                if (res && res.data) {
                    setOrderData(res.data);
                }
            } catch (error) {
                console.error("Lỗi tải chi tiết đơn hàng:", error);
                toast.error("Không thể tải chi tiết đơn hàng.");
            }
        };
        fetchFullOrder();
    }

    // Cleanup URL preview khi unmount
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [initialOrder, navigate, previewUrl]);

  // --- 2. Lấy danh sách ngân hàng Admin ---
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

  // --- HELPERS ---
  
  // Fix lỗi src="" : Trả về null nếu không có ảnh
  const getPackageImage = () => {
    const imgPath = orderData.service_package_id?.AnhBia;
    if (!imgPath) return null; 
    
    if (imgPath.startsWith("http")) return imgPath;
    // Xử lý đường dẫn tương đối
    return `${API_BASE_URL}/${imgPath.replace(/^\/+/, "")}`;
  };

  const serviceFee = Number(orderData.service_amount) || 0;
  const travelFee = Number(orderData.travel_fee_amount) || 0;
  const totalAmount = Number(orderData.total_amount) || (serviceFee + travelFee);
  
  const paymentAmount = Number(amountFromState) || Math.round(totalAmount * 0.3);
  
  const transactionCode = orderData.order_id || 'UNKNOWN';
  const paymentLabel = is_remaining ? "Thanh toán phần còn lại" : "Đặt cọc (30%)";
  const paymentShortLabel = is_remaining ? "Số tiền TT" : "Số tiền cọc";

  // Fix QR URL: Encode các tham số để tránh lỗi ký tự đặc biệt
  const qrUrl = selectedBank 
    ? `https://img.vietqr.io/image/${selectedBank.bank}-${selectedBank.accountNumber}-compact2.png?amount=${paymentAmount}&addInfo=${encodeURIComponent(transactionCode)}&accountName=${encodeURIComponent(selectedBank.fullName)}`
    : null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const formatPrice = (price) => Number(price || 0).toLocaleString('vi-VN');

  // --- HANDLERS ---

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
    if (!proofImage) {
      toast.warning('Vui lòng tải lên ảnh minh chứng chuyển khoản!');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('method', 'banking');
      formData.append('amount', paymentAmount);
      formData.append('transaction_code', transactionCode);
      
      if (selectedBank) {
        formData.append('bank_id', selectedBank._id || selectedBank.id);
      }
      
      if (proofImage) {
        formData.append('payment_proof', proofImage); 
      }

      const orderId = orderData._id || orderData.order_id;
      await orderApi.confirmPayment(orderId, formData);

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

  const packageImgSrc = getPackageImage();

  return (
    <>
      <Header />
      <div className="payment-page">
        <div className="payment-container">
          
          {/* --- CỘT TRÁI: THÔNG TIN CK --- */}
          <div className="payment-left">
            <div className="section-title">
              <CreditCard className="text-green-600" />
              Thông tin chuyển khoản
            </div>

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

              <div className="upload-section">
                <label className="upload-label">Tải lên minh chứng thanh toán (Bill)</label>
                
                {!proofImage ? (
                  <div className="upload-box">
                    <input type="file" accept="image/*" id="file-upload" hidden onChange={handleImageChange} />
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
          </div>

          {/* --- CỘT PHẢI: TÓM TẮT ĐƠN HÀNG --- */}
          <div className="payment-right">
            <div className="summary-card">
              <div className="section-title">
                <ShieldCheck className="text-blue-600" />
                Thông tin đặt lịch
              </div>

              <div className="package-mini-info">
                {/* ✅ Fix: Chỉ render img nếu có src, tránh warning */}
                {packageImgSrc ? (
                    <img 
                      src={packageImgSrc} 
                      alt="Package" 
                      className="w-20 h-20 object-cover rounded"
                      style={{ backgroundColor: '#f3f4f6' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    /> 
                ) : (
                    // Placeholder khi không có ảnh
                    <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                        <ImageIcon size={24} />
                    </div>
                )}

                <div>
                  <h3>Đơn hàng #{orderData.order_id}</h3>
                  <div className="info-line">
                    <Calendar size={14} /> {orderData.booking_date ? new Date(orderData.booking_date).toLocaleDateString('vi-VN') : '...'}
                  </div>
                  <div className="info-line">
                    <Clock size={14} /> {orderData.start_time}
                  </div>
                  <div className="info-line font-semibold text-sm mt-1">
                     {orderData.service_package_id?.TenGoi || "Gói dịch vụ"}
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
                      Tôi đã chuyển khoản
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