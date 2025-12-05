import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import SidebarAdmin from "./SidebarAdmin";
import HeaderAdmin from "./HeaderAdmin";
import "./OrderManage.css"; // Đảm bảo file CSS nằm cùng thư mục
import { 
  CheckCircle2, 
  DollarSign, 
  Search, 
  XCircle,
  X,
  Copy,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

import adminOrderService from "../../apis/adminOrderService";

export default function OrderManage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [paymentInfo, setPaymentInfo] = useState({
      photographerName: '',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      amount: 0,
      transactionCode: '',
      qrUrl: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await adminOrderService.getAllOrders();
      setOrders(res.data?.data || res.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Lỗi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (order, earning) => {
    // Defensive coding: Đảm bảo không crash nếu photographer_id null
    const photographer = order.photographer_id || {};
    const bankName = photographer.TenNganHang || "";     
    const accountNumber = photographer.SoTaiKhoan || ""; 
    const accountHolder = photographer.TenChuTaiKhoan || photographer.HoTen || ""; 
    const paymentAmount = earning > 0 ? earning : 0;
    const transactionCode = `TT don ${order.order_id || '...'}`;

    let qrUrl = null;
    if (bankName && accountNumber && paymentAmount > 0) {
        const cleanAccNumber = String(accountNumber).replace(/\s/g, ''); // Ép kiểu String để an toàn
        const cleanBankName = bankName.trim(); 
        qrUrl = `https://img.vietqr.io/image/${cleanBankName}-${cleanAccNumber}-compact2.png?amount=${paymentAmount}&addInfo=${encodeURIComponent(transactionCode)}&accountName=${encodeURIComponent(accountHolder)}`;
    }

    setPaymentInfo({
        photographerName: photographer.HoTen || "Không rõ tên",
        bankName,
        accountNumber,
        accountHolder,
        amount: paymentAmount,
        transactionCode,
        qrUrl
    });

    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedOrder) return;
    try {
      await adminOrderService.settleForPhotographer(selectedOrder._id);
      setOrders(prev => prev.map(o => 
        o._id === selectedOrder._id ? { ...o, settlement_status: 'paid' } : o
      ));
      toast.success(`Đã quyết toán cho ${paymentInfo.photographerName}!`);
      setShowPaymentModal(false);
      setSelectedOrder(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi quyết toán");
    }
  };

  const handleCopy = (text) => {
      if (!text) return;
      navigator.clipboard.writeText(text);
      toast.success("Đã sao chép!");
  };

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const orderId = String(order.order_id || "").toLowerCase();
    const cusName = (order.customer_id?.full_name || order.customer_name || "").toLowerCase();
    const matchSearch = orderId.includes(term) || cusName.includes(term);

    if (filterStatus === "all") return matchSearch;
    if (filterStatus === "completed") return matchSearch && (order.status === "completed" || order.status === "cancelled");
    if (filterStatus === "settled") return matchSearch && order.settlement_status === "paid";
    if (filterStatus === "unsettled") return matchSearch && (order.status === "completed" || order.status === "cancelled") && order.settlement_status !== "paid";
    return matchSearch;
  });

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />
        <div className="page-header"><h2>Quản lý Đơn hàng & Quyết toán</h2></div>

        <div className="filter-tabs">
            {['all', 'completed', 'unsettled', 'settled'].map(status => (
                <button 
                    key={status}
                    className={`btn ${filterStatus === status ? 'add-method' : 'btn-cancel'}`} 
                    onClick={() => setFilterStatus(status)}
                    style={
                        filterStatus === status && status === 'unsettled' ? {background: '#ea580c', color:'#fff', borderColor:'transparent'} : 
                        filterStatus === status && status === 'settled' ? {background: '#059669', color:'#fff', borderColor:'transparent'} : {}
                    }
                >
                    {status === 'all' ? 'Tất cả đơn' : 
                     status === 'completed' ? 'Đã xong / Hủy' :
                     status === 'unsettled' ? 'Cần quyết toán' : 'Đã trả thợ'}
                </button>
            ))}
        </div>

        <div className="orders-section">
          <div className="orders-header">
            <h3 className="section-title">Danh sách đơn hàng</h3>
            <div className="search-container">
                <div className="search-box">
                    <input type="text" placeholder="Tìm mã đơn, tên khách..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <Search size={18} className="search-icon" />
                    {searchTerm && <XCircle size={16} className="clear-icon" onClick={() => setSearchTerm("")} />}
                </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn / Gói</th>
                  <th>Ngày chụp</th>
                  <th>Tổng thu</th>
                  <th>Phí sàn</th>
                  <th>Thực trả Thợ</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                    <tr><td colSpan="7" style={{textAlign: 'center', padding: '30px'}}>Không tìm thấy đơn hàng nào</td></tr>
                ) : (
                    filteredOrders.map((order) => {
                        const isCancelled = order.status === 'cancelled';
                        const isPaid = order.settlement_status === 'paid';
                        
                        let displayRevenue = isCancelled 
                            ? (order.deposit_amount || order.deposit_required || 0) 
                            : order.total_amount;

                        const feeAmount = order.platform_fee?.amount || 0;
                        const feePercent = order.platform_fee?.percentage || 0;
                        const earning = order.photographer_earning || 0;

                        return (
                        <tr key={order._id}>
                            <td>
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span style={{fontWeight: 'bold', fontSize: '14px'}}>#{order.order_id}</span>
                                    <span className="text-muted" style={{fontSize: '12px', marginTop: '4px'}}>
                                        {order.service_package_id?.name || "Gói dịch vụ"}
                                    </span>
                                </div>
                            </td>
                            <td>{formatDate(order.booking_date)}</td>
                            <td className="text-success">
                                {formatCurrency(displayRevenue)}
                                {isCancelled && <div style={{fontSize: '11px', fontStyle: 'italic', color: '#dc2626'}}>(Tiền cọc)</div>}
                            </td>
                            <td className="text-danger" style={{fontSize: '13px'}}>
                                -{formatCurrency(feeAmount)} <span style={{color: '#999'}}>({feePercent}%)</span>
                            </td>
                            <td style={{color: '#2563eb', fontWeight: 'bold', fontSize: '14px', fontFamily: 'Roboto Mono'}}>
                                {formatCurrency(earning)}
                            </td>
                            <td>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                    {isCancelled ? (
                                        <span className="status-badge" style={{backgroundColor: '#fee2e2', color: '#991b1b'}}>Đã hủy</span>
                                    ) : (
                                        <span className={`status-badge ${order.status === 'completed' ? 'success' : 'default'}`}>
                                            {order.status === 'completed' ? 'Hoàn thành' : order.status}
                                        </span>
                                    )}
                                    {isPaid ? (
                                        <span className="status-badge success" style={{backgroundColor: '#f0fdf4'}}>Đã trả thợ</span>
                                    ) : (
                                        <span className="status-badge warning">Chưa trả thợ</span>
                                    )}
                                </div>
                            </td>
                            <td>
                            {(order.status === 'completed' || isCancelled) && !isPaid ? (
                                <button className="btn-verify" onClick={() => openPaymentModal(order, earning)} title="Quyết toán cho thợ">
                                <DollarSign size={16} /> Thanh toán
                                </button>
                            ) : isPaid ? (
                                <span className="text-muted" style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px'}}>
                                    <CheckCircle2 size={16} color="green"/> Đã xong
                                </span>
                            ) : (
                                <span className="text-muted" style={{fontSize: '12px', fontStyle: 'italic'}}>Đợi xử lý</span>
                            )}
                            </td>
                        </tr>
                    )})
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL SECTION --- */}
        {showPaymentModal && createPortal(
            <div className="modal-overlay">
                <div className="modal-container compact-modal">
                    <div className="modal-header">
                        <h3 className="modal-title"><DollarSign size={20}/> Quyết toán lương</h3>
                        <button onClick={() => setShowPaymentModal(false)} className="modal-close-btn"><X size={20}/></button>
                    </div>
                    <div className="modal-body">
                        <div className="photographer-info-card">
                            {/* Sửa lỗi charAt nếu tên null */}
                            <div className="avatar-circle">
                                {(paymentInfo.photographerName || "?").charAt(0)}
                            </div>
                            <div>
                                <p className="text-label">Người thụ hưởng</p>
                                <p className="text-value-large">{paymentInfo.photographerName}</p>
                            </div>
                        </div>
                        {paymentInfo.qrUrl ? (
                            <div className="qr-layout-vertical">
                                <div className="qr-image-wrapper-compact">
                                    <img 
                                        src={paymentInfo.qrUrl} 
                                        alt="VietQR Code" 
                                        className="qr-img-display"
                                        onError={(e) => {e.target.style.display='none';}} // Ẩn ảnh nếu lỗi
                                    />
                                </div>
                                <div className="bank-info-details">
                                    <div className="detail-row"><span className="detail-label">Ngân hàng</span><span className="detail-value">{paymentInfo.bankName}</span></div>
                                    <div className="detail-row"><span className="detail-label">Chủ tài khoản</span><span className="detail-value text-uppercase">{paymentInfo.accountHolder}</span></div>
                                    
                                    {/* Highlight Box cho Số TK */}
                                    <div className="highlight-box">
                                        <span className="detail-label">STK:</span>
                                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                            <span className="text-acc-number">{paymentInfo.accountNumber}</span>
                                            <button onClick={() => handleCopy(paymentInfo.accountNumber)} className="btn-copy-icon"><Copy size={16}/></button>
                                        </div>
                                    </div>

                                    {/* Highlight Box cho Số tiền */}
                                    <div className="highlight-box" style={{background: '#fff1f2', borderColor:'#fecdd3'}}>
                                        <span className="detail-label">Số tiền:</span>
                                        <span className="text-money-compact">{formatCurrency(paymentInfo.amount)}</span>
                                    </div>

                                    <div className="detail-row" style={{borderBottom:'none', paddingTop:'5px'}}>
                                        <span className="detail-label">Nội dung CK</span>
                                        <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                            <span className="detail-value">{paymentInfo.transactionCode}</span>
                                            <button onClick={() => handleCopy(paymentInfo.transactionCode)} className="btn-copy-icon"><Copy size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="missing-bank-alert">
                                <AlertTriangle size={32} style={{marginBottom: '10px'}}/>
                                <p className="alert-title">Thiếu thông tin ngân hàng</p>
                                <p className="alert-desc">Thợ ảnh này chưa cập nhật Số tài khoản hoặc Ngân hàng.</p>
                                <p style={{fontSize: '20px', fontWeight: 'bold', color: '#dc2626'}}>Cần trả: {formatCurrency(paymentInfo.amount)}</p>
                            </div>
                        )}
                        <div className="modal-note">* Vui lòng quét mã QR hoặc chuyển khoản thủ công, sau đó nhấn xác nhận.</div>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setShowPaymentModal(false)} className="btn-modal-cancel">Hủy bỏ</button>
                        <button onClick={handleConfirmTransfer} className="btn-modal-confirm"><CheckCircle size={16}/> Xác nhận chuyển tiền</button>
                    </div>
                </div>
            </div>,
            document.body // Portal target
        )}
      </main>
    </div>
  );
}