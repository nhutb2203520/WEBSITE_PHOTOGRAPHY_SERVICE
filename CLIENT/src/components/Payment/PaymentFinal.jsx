import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CreditCard, Calendar, Clock, CheckCircle, 
  Copy, AlertTriangle, ShieldCheck, Upload, X, ChevronDown, Loader, DollarSign
} from 'lucide-react';
import { toast } from 'react-toastify';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './PaymentServicePackage.css'; 
import orderApi from '../../apis/OrderService';
import paymentMethodService from '../../apis/paymentMethodService';

export default function PaymentFinal() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { order: initialOrder } = location.state || {};

  const [orderData, setOrderData] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  
  const [adminBanks, setAdminBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [loadingBanks, setLoadingBanks] = useState(true);

  const [proofImage, setProofImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!initialOrder) {
      toast.error('Không tìm thấy thông tin đơn hàng');
      navigate('/my-orders');
      return;
    }
    
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

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [initialOrder, navigate]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingBanks(true);
        const res = await paymentMethodService.getAllPaymentMethods();
        const methods = Array.isArray(res) ? res : (res.data || []);
        const activeMethods = methods.filter(m => m.isActive);
        setAdminBanks(activeMethods);
        if (activeMethods.length > 0) setSelectedBank(activeMethods[0]);
      } catch (error) {
        console.error("Lỗi lấy thông tin ngân hàng:", error);
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchPaymentMethods();
  }, []);

  if (!orderData) return <div className="p-10 text-center">Đang tải thông tin...</div>;

  // --- TÍNH TOÁN ---
  const totalAmount = Number(orderData.total_amount) || 0;
  const depositPaid = Number(orderData.deposit_required) || 0;
  const remainingAmount = totalAmount - depositPaid;

  // ✅ CẬP NHẬT: Nội dung chuyển khoản là MÃ ĐƠN HÀNG (Chính xác theo yêu cầu)
  const transactionCode = orderData.order_id || 'UNKNOWN';

  const qrUrl = selectedBank 
    ? `https://img.vietqr.io/image/${selectedBank.bank}-${selectedBank.accountNumber}-compact2.png?amount=${remainingAmount}&addInfo=${transactionCode}&accountName=${encodeURIComponent(selectedBank.fullName)}`
    : null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const formatPrice = (price) => Number(price || 0).toLocaleString('vi-VN');

  const getPackageImage = () => {
    const imgPath = orderData.service_package_id?.AnhBia;
    if (!imgPath) return ""; 
    if (imgPath.startsWith("http")) return imgPath;
    return `http://localhost:5000/${imgPath.replace(/^\/+/, "")}`;
  };

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

  const handleConfirmPayment = async () => {
    if (!proofImage) {
      toast.warning('Vui lòng tải lên ảnh minh chứng chuyển khoản!');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('method', 'banking');
      formData.append('amount', remainingAmount);
      formData.append('transaction_code', transactionCode); // Mã đơn hàng
      
      if (selectedBank) formData.append('bank_id', selectedBank._id || selectedBank.id);
      if (proofImage) formData.append('payment_proof', proofImage); 

      await orderApi.confirmPayment(orderData._id || orderData.order_id, formData);

      toast.success('Đã gửi xác nhận thanh toán phần còn lại! Vui lòng chờ duyệt.');
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
          
          {/* CỘT TRÁI */}
          <div className="payment-left">
            <div className="section-title">
              <CreditCard className="text-blue-600" />
              Thanh toán phần còn lại
            </div>

            <div className="qr-section animate-fade-in">
              {loadingBanks ? (
                 <div className="loading-banks"><Loader className="spin" /> Đang tải thông tin ngân hàng...</div>
              ) : adminBanks.length === 0 ? (
                 <div className="no-banks-alert"><AlertTriangle className="text-yellow-500"/> Chưa có thông tin ngân hàng.</div>
              ) : (
                <>
                  {adminBanks.length > 1 && (
                    <div className="bank-selector">
                      <label>Chọn ngân hàng thụ hưởng:</label>
                      <div className="select-wrapper">
                        <select 
                          value={selectedBank?._id || selectedBank?.id} 
                          onChange={(e) => setSelectedBank(adminBanks.find(b => (b._id || b.id) === e.target.value))}
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
                          <span className="font-bold">{selectedBank.bank}</span>
                        </div>
                        <div className="detail-row">
                          <span className="text-gray-500">Số tài khoản</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-green-700">{selectedBank.accountNumber}</span>
                            <button className="copy-btn" onClick={() => handleCopy(selectedBank.accountNumber)}><Copy size={14}/></button>
                          </div>
                        </div>
                        <div className="detail-row">
                          <span className="text-gray-500">Chủ tài khoản</span>
                          <span className="font-bold text-uppercase">{selectedBank.fullName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="text-gray-500">Số tiền cần thanh toán</span>
                          <span className="font-bold text-lg text-red-600">{formatPrice(remainingAmount)} VNĐ</span>
                        </div>
                        <div className="detail-row">
                          <span className="text-gray-500">Nội dung CK</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-600">{transactionCode}</span>
                            <button className="copy-btn" onClick={() => handleCopy(transactionCode)}><Copy size={14}/></button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="upload-section">
                <label className="upload-label">Tải lên biên lai chuyển khoản</label>
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
                    <button className="remove-image-btn" onClick={() => { setProofImage(null); setPreviewUrl(null); }}>
                      <X size={16} />
                    </button>
                    <span className="file-name">{proofImage.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="payment-right">
            <div className="summary-card">
              <div className="section-title">
                <ShieldCheck className="text-blue-600" />
                Chi tiết thanh toán
              </div>

              <div className="package-mini-info">
                <img 
                  src={getPackageImage()} 
                  alt="Package" 
                  className="w-20 h-20 object-cover rounded"
                  style={{ backgroundColor: '#f3f4f6' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                /> 
                <div>
                  <h3>Đơn hàng #{orderData.order_id}</h3>
                  <div className="info-line"><Calendar size={14} /> {formatPrice(orderData.booking_date)}</div>
                  <div className="info-line"><Clock size={14} /> {orderData.start_time}</div>
                </div>
              </div>

              <div className="price-summary">
                <div className="price-row">
                  <span>Tổng giá trị đơn hàng</span>
                  <span className="font-bold">{formatPrice(totalAmount)} VNĐ</span>
                </div>
                <div className="price-row text-green-600">
                  <span>Đã đặt cọc (30%)</span>
                  <span className="font-bold">-{formatPrice(depositPaid)} VNĐ</span>
                </div>
                <div className="deposit-highlight">
                  <div className="deposit-row">
                    <span className="deposit-label">Cần thanh toán nốt</span>
                    <span>{formatPrice(remainingAmount)} VNĐ</span>
                  </div>
                </div>
              </div>

              <div className="actions">
                <button className="btn-confirm" onClick={handleConfirmPayment} disabled={loading}>
                  {loading ? 'Đang xử lý...' : <><CheckCircle size={20} /> Xác nhận đã chuyển khoản</>}
                </button>
                <button className="btn-back-home" onClick={() => navigate('/my-orders')}>Quay lại</button>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}