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
// ✅ Import Service để lấy thông tin ngân hàng từ Database
import paymentMethodService from '../../apis/paymentMethodService';

export default function PaymentServicePackage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy dữ liệu từ trang Order
  const { order, transfer_code, deposit_required: depositFromState } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('banking');
  const [loading, setLoading] = useState(false);
  
  // ✅ STATE QUẢN LÝ THÔNG TIN NGÂN HÀNG ĐỘNG
  const [adminBanks, setAdminBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [loadingBanks, setLoadingBanks] = useState(true);

  // State cho ảnh minh chứng
  const [proofImage, setProofImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!order) {
      toast.error('Không tìm thấy thông tin đơn hàng');
      navigate('/');
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [order, navigate, previewUrl]);

  // ✅ 1. TỰ ĐỘNG LẤY THÔNG TIN NGÂN HÀNG CỦA ADMIN KHI LOAD TRANG
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingBanks(true);
        // Gọi API lấy danh sách phương thức thanh toán
        const res = await paymentMethodService.getAllPaymentMethods();
        
        const methods = Array.isArray(res) ? res : (res.data || []);
        // Chỉ lấy những tài khoản đang hoạt động (isActive = true)
        const activeMethods = methods.filter(m => m.isActive);

        setAdminBanks(activeMethods);
        
        // Mặc định chọn tài khoản đầu tiên để hiển thị QR ngay lập tức
        if (activeMethods.length > 0) {
          setSelectedBank(activeMethods[0]);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin ngân hàng:", error);
        toast.error("Không thể tải thông tin thanh toán của Admin.");
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  if (!order) return null;

  // --- TÍNH TOÁN SỐ TIỀN ---
  const serviceFee = Number(order.service_amount) || 0;
  const travelFee = Number(order.travel_fee_amount) || 0; // Lưu ý: dùng travel_fee_amount
  const totalAmount = Number(order.total_amount) || (serviceFee + travelFee);
  const depositAmount = Number(depositFromState) || Math.round(totalAmount * 0.3);
  const transactionCode = transfer_code || `COC ${order._id.slice(-6).toUpperCase()}`;

  // ✅ 2. TẠO LINK VIETQR ĐỘNG DỰA TRÊN NGÂN HÀNG ĐANG CHỌN
  // Format: https://img.vietqr.io/image/[BANK_ID]-[ACCOUNT_NO]-[TEMPLATE].png
  const qrUrl = selectedBank 
    ? `https://img.vietqr.io/image/${selectedBank.bank}-${selectedBank.accountNumber}-compact2.png?amount=${depositAmount}&addInfo=${transactionCode}&accountName=${encodeURIComponent(selectedBank.fullName)}`
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
      formData.append('amount', depositAmount);
      formData.append('transaction_code', transactionCode);
      
      // Gửi kèm ID ngân hàng (nếu có) để Admin dễ đối soát
      if (selectedBank) {
        formData.append('bank_id', selectedBank._id || selectedBank.id);
      }
      
      if (proofImage) {
        formData.append('payment_proof', proofImage); 
      }

      await orderApi.confirmPayment(order._id, formData);

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
                     Chưa có thông tin ngân hàng. Vui lòng liên hệ Admin để được hỗ trợ.
                   </div>
                ) : (
                  <>
                    {/* Dropdown chọn ngân hàng nếu có nhiều hơn 1 */}
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

                    {/* ✅ HIỂN THỊ QR ĐỘNG */}
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
                            <span className="text-gray-500">Số tiền cọc</span>
                            <span className="font-bold text-lg text-red-600">{formatPrice(depositAmount)} VNĐ</span>
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
                  Vui lòng đến trực tiếp studio để đặt cọc trong vòng 24h tới để giữ lịch.
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
                <img 
                  src="https://via.placeholder.com/100?text=Package" 
                  alt="Package" 
                  className="w-20 h-20 object-cover rounded"
                /> 
                <div>
                  <h3>Đơn hàng #{order._id.slice(-6).toUpperCase()}</h3>
                  <div className="info-line">
                    <Calendar size={14} /> {new Date(order.booking_date).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="info-line">
                    <Clock size={14} /> {order.start_time}
                  </div>
                </div>
              </div>

              <div className="price-summary">
                <div className="price-row total">
                  <span>Tổng cộng</span>
                  <span className="text-xl">{formatPrice(totalAmount)} VNĐ</span>
                </div>
                <div className="deposit-highlight">
                  <div className="deposit-row">
                    <span className="deposit-label">Cọc (30%)</span>
                    <span>{formatPrice(depositAmount)} VNĐ</span>
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
                      {paymentMethod === 'banking' ? 'Tôi đã chuyển khoản' : 'Xác nhận đặt lịch'}
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