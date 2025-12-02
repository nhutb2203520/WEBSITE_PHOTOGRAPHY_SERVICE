import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SidebarAdmin from "./SidebarAdmin";
import HeaderAdmin from "./HeaderAdmin";
import "./OrderManage.css"; 
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
    const photographer = order.photographer_id || {};
    const bankName = photographer.TenNganHang || "";     
    const accountNumber = photographer.SoTaiKhoan || ""; 
    const accountHolder = photographer.TenChuTaiKhoan || photographer.HoTen || ""; 
    const paymentAmount = earning > 0 ? earning : 0;
    const transactionCode = `TT don ${order.order_id}`;

    let qrUrl = null;
    if (bankName && accountNumber && paymentAmount > 0) {
        const cleanAccNumber = accountNumber.replace(/\s/g, '');
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
      navigator.clipboard.writeText(text);
      toast.success("Đã sao chép!");
  };

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const orderId = order.order_id || "";
    const cusName = order.customer_id?.full_name || order.customer_name || "";
    const matchSearch = orderId.toLowerCase().includes(term) || cusName.toLowerCase().includes(term);

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
                        filterStatus === status && status === 'unsettled' ? {background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', color:'#fff', borderColor:'transparent'} : 
                        filterStatus === status && status === 'settled' ? {background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color:'#fff', borderColor:'transparent'} : {}
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
                        
                        // Lấy dữ liệu đã tính toán sẵn từ Backend
                        // 1. Doanh thu (Actual Revenue)
                        let displayRevenue = isCancelled 
                            ? (order.deposit_amount || order.deposit_required || 0) 
                            : order.total_amount;

                        // 2. Phí sàn và Phần trăm
                        const feeAmount = order.platform_fee?.amount || 0;
                        const feePercent = order.platform_fee?.percentage || 0;

                        // 3. Thực nhận
                        const earning = order.photographer_earning || 0;

                        return (
                        <tr key={order._id}>
                            <td>
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span style={{fontWeight: 'bold', fontSize: '15px'}}>#{order.order_id}</span>
                                    <span className="text-muted" style={{fontSize: '12px', marginTop: '4px'}}>
                                        {order.service_package_id?.name || "Gói dịch vụ"}
                                    </span>
                                </div>
                            </td>
                            <td>{formatDate(order.booking_date)}</td>
                            <td className="text-success">
                                {formatCurrency(displayRevenue)}
                                {isCancelled && <div style={{fontSize: '11px', fontStyle: 'italic', color: '#dc2626'}}>(Tiền cọc giữ lại)</div>}
                            </td>
                            <td className="text-danger" style={{fontSize: '13px'}}>
                                -{formatCurrency(feeAmount)} <span style={{color: '#999'}}>({feePercent}%)</span>
                            </td>
                            <td style={{color: '#2563eb', fontWeight: 'bold', fontSize: '15px', fontFamily: 'Roboto Mono'}}>
                                {formatCurrency(earning)}
                            </td>
                            <td>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                    {isCancelled ? (
                                        <span className="status-badge" style={{backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171'}}>Đã hủy</span>
                                    ) : (
                                        <span className={`status-badge ${order.status === 'completed' ? 'success' : 'default'}`}>
                                            {order.status === 'completed' ? 'Hoàn thành' : order.status}
                                        </span>
                                    )}
                                    {isPaid ? (
                                        <span className="status-badge success" style={{border: '1px solid green', backgroundColor: '#f0fdf4'}}>Đã trả thợ</span>
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

        {showPaymentModal && (
            <div className="modal-overlay">
                <div className="modal-container big-modal">
                    <div className="modal-header">
                        <h3 className="modal-title"><DollarSign size={24}/> Quyết toán lương thợ ảnh</h3>
                        <button onClick={() => setShowPaymentModal(false)} className="modal-close-btn"><X size={24}/></button>
                    </div>
                    <div className="modal-body">
                        <div className="photographer-info-card big-card">
                            <div className="avatar-circle big-avatar">{paymentInfo.photographerName.charAt(0)}</div>
                            <div>
                                <p className="text-label">Người thụ hưởng</p>
                                <p className="text-value-large">{paymentInfo.photographerName}</p>
                            </div>
                        </div>
                        {paymentInfo.qrUrl ? (
                            <div className="qr-layout-vertical">
                                <div className="qr-image-wrapper-big"><img src={paymentInfo.qrUrl} alt="VietQR Code" className="qr-img-display"/></div>
                                <div className="bank-info-details big-details">
                                    <div className="detail-row-big"><span className="detail-label">Ngân hàng</span><span className="detail-value">{paymentInfo.bankName}</span></div>
                                    <div className="detail-row-big"><span className="detail-label">Chủ tài khoản</span><span className="detail-value text-uppercase">{paymentInfo.accountHolder}</span></div>
                                    <div className="detail-row-big highlight-row">
                                        <span className="detail-label">Số tài khoản</span>
                                        <div className="copy-wrapper"><span className="text-acc-number">{paymentInfo.accountNumber}</span><button onClick={() => handleCopy(paymentInfo.accountNumber)} className="btn-copy-big"><Copy size={20}/></button></div>
                                    </div>
                                    <div className="detail-row-big highlight-row">
                                        <span className="detail-label">Số tiền</span><span className="text-money-big">{formatCurrency(paymentInfo.amount)}</span>
                                    </div>
                                    <div className="detail-row-big">
                                        <span className="detail-label">Nội dung CK</span>
                                        <div className="copy-wrapper"><span className="detail-value">{paymentInfo.transactionCode}</span><button onClick={() => handleCopy(paymentInfo.transactionCode)} className="btn-copy-big"><Copy size={18}/></button></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="missing-bank-alert big-alert">
                                <AlertTriangle size={40} style={{marginBottom: '10px'}}/>
                                <p className="alert-title">Thiếu thông tin ngân hàng</p>
                                <p className="alert-desc">Thợ ảnh này chưa cập nhật Số tài khoản hoặc Ngân hàng.</p>
                                <p className="alert-money-big">Cần trả: <strong>{formatCurrency(paymentInfo.amount)}</strong></p>
                            </div>
                        )}
                        <div className="modal-note">* Vui lòng quét mã QR hoặc chuyển khoản thủ công, sau đó nhấn xác nhận bên dưới.</div>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setShowPaymentModal(false)} className="btn-modal-cancel big-btn">Hủy bỏ</button>
                        <button onClick={handleConfirmTransfer} className="btn-modal-confirm big-btn"><CheckCircle size={20}/> Xác nhận đã chuyển tiền</button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}