import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Package, FileText, DollarSign, User, Phone, Mail,
  CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, Search, Filter,
  Download, ChevronRight, CreditCard, Truck, AlertTriangle, Ban, HelpCircle,
  RefreshCcw, Star // ✅ Import icon Star
} from 'lucide-react';
import './MyOrder.css';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from '../Sidebar/Sidebar';
import orderApi from '../../apis/OrderService';

export default function MyOrder() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.user || {});

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Cancel Form State
  const [cancelReason, setCancelReason] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getMyOrders();
      const ordersList = response?.data || response || [];
      const sortedOrders = ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
      setFilteredOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.service_package_id?.TenGoi?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredOrders(filtered);
  };

  // --- XỬ LÝ HỦY ĐƠN ---
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    const isPendingPayment = selectedOrder.status === 'pending_payment';
    const isPending = selectedOrder.status === 'pending'; // Đã cọc, chưa xác nhận
    const isConfirmed = selectedOrder.status === 'confirmed'; // Đã xác nhận

    // Validate đầu vào
    if (!isPendingPayment) {
       if (!cancelReason.trim()) {
          return toast.warning("Vui lòng nhập lý do hủy đơn!");
       }
       // Chỉ cần STK nếu được hoàn tiền (trạng thái pending)
       if (isPending && !refundAccount.trim()) {
          return toast.warning("Vui lòng nhập số tài khoản nhận hoàn tiền!");
       }
    }

    try {
      setCancelling(true);
      
      let nextStatus = 'cancelled';
      let cancelNote = "Khách hàng hủy đơn khi chưa thanh toán.";

      if (!isPendingPayment) {
         if (isPending) {
             // ✅ TRƯỜNG HỢP 1: Đã cọc, chưa xác nhận -> Chờ hoàn tiền
             nextStatus = 'refund_pending';
             cancelNote = `[Chờ hoàn tiền] Khách hủy đơn chưa xác nhận. Lý do: ${cancelReason}. STK: ${refundAccount}`;
         } else if (isConfirmed) {
             // ✅ TRƯỜNG HỢP 2: Đã xác nhận -> Hủy luôn (Mất cọc)
             nextStatus = 'cancelled'; 
             cancelNote = `[Khách hủy - MẤT CỌC] Đơn đã xác nhận lịch. Lý do: ${cancelReason}.`;
         }
      }

      await orderApi.updateOrderStatus(selectedOrder.order_id, nextStatus, cancelNote);
      
      if (nextStatus === 'refund_pending') {
        toast.info("Đã gửi yêu cầu. Đơn hàng chuyển sang trạng thái Chờ hoàn tiền.");
      } else if (isConfirmed) {
        toast.success("Đã hủy đơn hàng (Lưu ý: Bạn đã mất cọc).");
      } else {
        toast.success("Đã hủy đơn hàng thành công.");
      }

      setShowCancelModal(false);
      setCancelReason('');
      setRefundAccount('');
      fetchOrders(); 
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Lỗi khi xử lý hủy đơn hàng.";
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleContinuePayment = (order) => {
    navigate("/payment", { 
      state: { 
        order: order,
        transfer_code: order.payment_info?.transfer_code,
        deposit_required: order.deposit_required
      } 
    });
  };

  const openCancelModal = (order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
    setCancelReason('');
    setRefundAccount('');
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending_payment: { label: 'Chờ đặt cọc', icon: <CreditCard size={16} />, className: 'status-pending-payment', color: '#f59e0b' },
      pending: { label: 'Chờ xác nhận', icon: <Clock size={16} />, className: 'status-pending', color: '#3b82f6' },
      confirmed: { label: 'Đã xác nhận', icon: <CheckCircle size={16} />, className: 'status-confirmed', color: '#0ea5e9' },
      in_progress: { label: 'Đang thực hiện', icon: <RefreshCw size={16} />, className: 'status-progress', color: '#8b5cf6' },
      completed: { label: 'Hoàn thành', icon: <CheckCircle size={16} />, className: 'status-completed', color: '#10b981' },
      cancelled: { label: 'Đã hủy', icon: <XCircle size={16} />, className: 'status-cancelled', color: '#ef4444' },
      refund_pending: { label: 'Chờ hoàn tiền', icon: <RefreshCcw size={16} />, className: 'status-refund', color: '#a855f7' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const formatPrice = (price) => Number(price || 0).toLocaleString('vi-VN') + ' VNĐ';
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : 'N/A';
  const getImageUrl = (img) => img ? (img.startsWith('http') ? img : `http://localhost:5000/${img.replace(/^\/+/, '')}`) : '/no-image.jpg';

  const OrderCard = ({ order }) => {
    const statusInfo = getStatusInfo(order.status);
    
    const isPendingPayment = order.status === 'pending_payment';
    const isCancelled = order.status === 'cancelled';
    const isCompleted = order.status === 'completed';
    const isRefundPending = order.status === 'refund_pending';

    // ✅ Lấy thông tin đánh giá từ gói dịch vụ
    const rating = order.service_package_id?.DanhGia || 0;
    const reviews = order.service_package_id?.SoLuotDanhGia || 0;

    return (
      <div className="order-card">
        <div className="order-card-header">
          <div className="order-id-section">
            <span className="order-id-label">Mã đơn:</span>
            <span className="order-id-value">{order.order_id}</span>
          </div>
          <div className={`order-status ${statusInfo.className}`}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>

        <div className="order-card-body">
          <div className="order-package-info">
            {order.service_package_id?.AnhBia && (
              <img
                src={getImageUrl(order.service_package_id.AnhBia)}
                alt={order.service_package_id?.TenGoi}
                className="package-thumbnail"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/100x60?text=No+Image'; }}
              />
            )}
            <div className="package-details">
              <h3>{order.service_package_id?.TenGoi || 'Gói dịch vụ'}</h3>
              <p className="package-type">{order.service_package_id?.LoaiGoi}</p>
              
              {/* ✅ HIỂN THỊ ĐÁNH GIÁ GÓI TRÊN CARD */}
              <div className="package-rating-mini">
                 <Star size={14} fill="#f59e0b" color="#f59e0b"/>
                 <span className="rating-value">{rating.toFixed(1)}</span>
                 <span className="rating-count">({reviews} đánh giá)</span>
              </div>
            </div>
          </div>
          <div className="order-info-grid">
            <div className="info-item">
              <Calendar size={16} />
              <div><span className="info-label">Ngày đặt:</span><span className="info-value">{formatDate(order.booking_date)}</span></div>
            </div>
            <div className="info-item">
              <DollarSign size={16} />
              <div><span className="info-label">Tổng tiền:</span><span className="info-value price">{formatPrice(order.final_amount)}</span></div>
            </div>
          </div>
        </div>

        <div className="order-card-footer">
          <button className="btn-view-detail" onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}>
            <Eye size={18} /> Chi tiết
          </button>

          <div className="action-buttons">
            {isPendingPayment ? (
                <>
                  <button className="btn-pay-now" onClick={() => handleContinuePayment(order)}>
                    <CreditCard size={16} /> Thanh toán
                  </button>
                  <button className="btn-cancel-order" onClick={() => openCancelModal(order)}>Hủy đơn</button>
                </>
            ) : isRefundPending ? (
                <span className="cancel-disabled text-purple">
                   <RefreshCcw size={16} className="spin"/> Đang chờ hoàn tiền
                </span>
            ) : (!isCancelled && !isCompleted) ? (
                <button className="btn-cancel-order" onClick={() => openCancelModal(order)}>
                  <AlertCircle size={16} /> Yêu cầu hủy
                </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const OrderDetailModal = () => {
    if (!selectedOrder) return null;
    const statusInfo = getStatusInfo(selectedOrder.status);

    // ✅ Lấy thông tin đánh giá cho modal
    const rating = selectedOrder.service_package_id?.DanhGia || 0;
    const reviews = selectedOrder.service_package_id?.SoLuotDanhGia || 0;

    return (
      <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Chi tiết đơn hàng #{selectedOrder.order_id}</h2>
            <button className="btn-close-modal" onClick={() => setShowDetailModal(false)}>×</button>
          </div>
          <div className="modal-body" style={{padding: '20px 30px'}}>
             
             <div className="detail-section">
                <div className="section-title"><Package size={20}/> <h3>Thông tin chung</h3></div>
                <div className="detail-grid">
                    <div className="detail-item"><span className="label">Trạng thái:</span><span className={`value ${statusInfo.className}`}>{statusInfo.label}</span></div>
                    <div className="detail-item"><span className="label">Ngày book:</span><span className="value">{formatDate(selectedOrder.booking_date)}</span></div>
                </div>
             </div>

             {/* GÓI DỊCH VỤ + ĐÁNH GIÁ */}
             <div className="detail-section">
               <div className="section-title"><Package size={20}/> <h3>Gói dịch vụ</h3></div>
               <div className="package-detail-card">
                 {selectedOrder.service_package_id?.AnhBia && (
                   <img src={getImageUrl(selectedOrder.service_package_id.AnhBia)} alt="" onError={(e) => e.target.src = 'https://via.placeholder.com/300x200'} />
                 )}
                 <div className="package-detail-content">
                    <h4>{selectedOrder.service_package_id?.TenGoi}</h4>
                    
                    {/* ✅ HIỂN THỊ ĐÁNH GIÁ TRONG MODAL */}
                    <div className="package-rating-modal">
                        <Star size={18} fill="#f59e0b" color="#f59e0b"/>
                        <span className="rating-value-large">{rating.toFixed(1)}</span>
                        <span className="rating-count-large">({reviews} đánh giá)</span>
                    </div>

                    <p className="mt-2 text-muted">{selectedOrder.service_package_id?.MoTa}</p>
                 </div>
               </div>
             </div>

             <div className="detail-section">
               <div className="section-title"><CreditCard size={20}/> <h3>Thanh toán</h3></div>
               <div className="deposit-info-box">
                 <div className="payment-row"><span>Tổng tiền:</span><span className="font-bold">{formatPrice(selectedOrder.final_amount)}</span></div>
                 <div className="payment-row"><span>Đã cọc:</span><span className="font-bold text-green-600">{formatPrice(selectedOrder.payment_info?.deposit_amount || 0)}</span></div>
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <Sidebar />

      <div className="my-orders-page">
        <div className="container">
          <div className="page-header">
            <div>
              <h1>Đơn hàng của tôi</h1>
              <p className="page-subtitle">Quản lý và theo dõi các đơn đặt dịch vụ</p>
            </div>
            <button className="btn-refresh" onClick={fetchOrders} disabled={loading}>
              <RefreshCw size={18} className={loading ? 'spinning' : ''} /> Làm mới
            </button>
          </div>

          {/* ✅ CHÍNH SÁCH HỦY ĐƠN */}
          <div className="policy-alert">
            <AlertTriangle className="alert-icon" size={24} />
            <div className="alert-content">
                <h4>Chính sách hủy đơn hàng & Hoàn tiền:</h4>
                <ul>
                    <li><strong>Chờ thanh toán:</strong> Hủy ngay lập tức.</li>
                    <li><strong>Đã cọc (Chưa xác nhận):</strong> Được hoàn tiền cọc nếu hủy.</li>
                    <li><strong>Đã xác nhận lịch:</strong> Nếu hủy, bạn sẽ <strong>MẤT TOÀN BỘ TIỀN CỌC</strong>.</li>
                </ul>
            </div>
          </div>

          <div className="filters-section">
            <div className="search-box"><Search size={18} /><input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="status-filters">
              {['all', 'pending_payment', 'pending', 'confirmed', 'refund_pending', 'completed', 'cancelled'].map(s => (
                  <button key={s} className={`filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                    {s === 'all' ? 'Tất cả' : getStatusInfo(s).label}
                  </button>
              ))}
            </div>
          </div>

          {loading ? <div className="loading-state"><div className="spinner"></div></div> : 
           <div className="orders-grid">
              {filteredOrders.map((order) => <OrderCard key={order._id} order={order} />)}
           </div>
          }
        </div>
      </div>

      {showDetailModal && <OrderDetailModal />}

      {/* ✅ MODAL HỦY ĐƠN */}
      {showCancelModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
            <div className="modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-danger">
                        {selectedOrder.status === 'pending_payment' ? 'Xác nhận hủy đơn' : 'Yêu cầu hủy đơn hàng'}
                    </h2>
                    <button className="btn-close-modal" onClick={() => setShowCancelModal(false)}>×</button>
                </div>
                <div className="modal-body">
                    {selectedOrder.status === 'pending_payment' ? (
                        <p className="cancel-hint">Bạn có chắc chắn muốn hủy đơn hàng này không?</p>
                    ) : (
                        <div className="cancel-form">
                            {selectedOrder.status === 'pending' && (
                                <div className="alert-box info">
                                    <CheckCircle size={16}/> 
                                    <div>Đơn chưa được xác nhận. Bạn có thể yêu cầu <strong>hoàn tiền cọc</strong>.</div>
                                </div>
                            )}
                            {selectedOrder.status === 'confirmed' && (
                                <div className="alert-box danger">
                                    <AlertTriangle size={24}/> 
                                    <div><strong>CẢNH BÁO:</strong> Đơn đã xác nhận lịch. Bạn sẽ <strong>MẤT CỌC</strong> nếu hủy.</div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Lý do hủy <span className="required">*</span></label>
                                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows="3" placeholder="Nhập lý do..." />
                            </div>
                            
                            {/* Chỉ hiện ô nhập STK nếu là đơn Pending (được hoàn tiền) */}
                            {selectedOrder.status === 'pending' && (
                                <div className="form-group">
                                    <label>Số tài khoản nhận hoàn tiền <span className="required">*</span></label>
                                    <input value={refundAccount} onChange={(e) => setRefundAccount(e.target.value)} placeholder="Ngân hàng - Số TK - Tên chủ thẻ" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button className="btn-back-modal" onClick={() => setShowCancelModal(false)}>Quay lại</button>
                        <button className="btn-confirm-cancel" onClick={handleCancelOrder} disabled={cancelling}>
                            {cancelling ? 'Đang xử lý...' : (selectedOrder.status === 'confirmed' ? 'Chấp nhận mất cọc & Hủy' : 'Xác nhận hủy')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <Footer />
    </>
  );
}