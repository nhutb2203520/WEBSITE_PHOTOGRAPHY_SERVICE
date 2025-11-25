import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, DollarSign,
  CheckCircle, XCircle, RefreshCw, Eye, Search,
  CreditCard, HelpCircle, RefreshCcw, Star, Hourglass, 
  Upload, Edit3, Camera, Image as ImageIcon
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import orderApi from '../../apis/OrderService';
import './MyOrder.css';

export default function MyOrder() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.user || {});

  // --- STATE ---
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Cancel State
  const [cancelReason, setCancelReason] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Review State
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]); 
  const [previewImages, setPreviewImages] = useState([]); 
  const [existingReview, setExistingReview] = useState(null); 
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    fetchOrders();
  }, [user, navigate]);

  useEffect(() => { filterOrders(); }, [orders, searchTerm, statusFilter]);

  // --- API ---
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getMyOrders();
      // Đảm bảo lấy đúng cấu trúc dữ liệu trả về từ Backend
      const ordersList = response?.data?.data || response?.data || [];
      const safeList = Array.isArray(ordersList) ? ordersList : [];
      
      // Sắp xếp mới nhất lên đầu
      const sortedOrders = safeList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    
    // Lọc theo Tab trạng thái
    if (statusFilter !== 'all') {
        if (statusFilter === 'processing_group') {
            filtered = filtered.filter(o => ['in_progress', 'processing', 'delivered'].includes(o.status));
        } else {
            filtered = filtered.filter(order => order.status === statusFilter);
        }
    }

    // Lọc theo Search
    if (searchTerm) {
      filtered = filtered.filter(order =>
        (order.order_id && order.order_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.service_package_id?.TenGoi && order.service_package_id.TenGoi.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredOrders(filtered);
  };

  // --- HELPER: STATUS INFO ---
  const getStatusInfo = (status) => {
    switch (status) {
        case 'pending_payment': 
            return { label: 'Chờ cọc', icon: <CreditCard size={16}/>, className: 'status-pending-payment' };
        case 'pending': 
            return { label: 'Chờ xác nhận', icon: <Clock size={16}/>, className: 'status-pending' };
        case 'confirmed': 
            return { label: 'Đã chốt lịch', icon: <CheckCircle size={16}/>, className: 'status-confirmed' };
        case 'in_progress': 
            return { label: 'Đang chụp', icon: <Camera size={16}/>, className: 'status-progress' };
        case 'processing': 
            return { label: 'Đang xử lý ảnh', icon: <RefreshCw size={16}/>, className: 'status-processing' };
        case 'delivered': 
            return { label: 'Đã giao ảnh', icon: <ImageIcon size={16}/>, className: 'status-delivered' };
        case 'waiting_final_payment': 
        case 'final_payment_pending': 
            return { label: 'Chờ TT còn lại', icon: <Hourglass size={16}/>, className: 'status-payment' };
        case 'completed': 
            return { label: 'Hoàn thành', icon: <Star size={16}/>, className: 'status-completed' };
        case 'cancelled': 
            return { label: 'Đã hủy', icon: <XCircle size={16}/>, className: 'status-cancelled' };
        case 'refund_pending': 
            return { label: 'Chờ hoàn tiền', icon: <RefreshCcw size={16}/>, className: 'status-refund' };
        default: 
            return { label: status, icon: <HelpCircle size={16}/>, className: 'status-default' };
    }
  };

  // --- ACTION HANDLERS ---
  const openReviewModal = (order) => {
    setSelectedOrder(order);
    if (order.review) {
        setExistingReview(order.review);
        setRating(order.review.Rating || 5);
        setReviewComment(order.review.Comment || '');
        setPreviewImages(order.review.Images || []); 
        setReviewImages([]); 
        setIsEditing(false);
    } else {
        setExistingReview(null);
        setRating(5);
        setReviewComment('');
        setReviewImages([]);
        setPreviewImages([]);
        setIsEditing(true);
    }
    setShowReviewModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + reviewImages.length > 5) return toast.warning("Tối đa 5 ảnh.");
    setReviewImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
      if (existingReview && !isEditing) return; 
      const newPreviews = [...previewImages];
      newPreviews.splice(index, 1);
      setPreviewImages(newPreviews);
      if(index >= (existingReview?.Images?.length || 0)) {
          const fileIndex = index - (existingReview?.Images?.length || 0);
          const newFiles = [...reviewImages];
          newFiles.splice(fileIndex, 1);
          setReviewImages(newFiles);
      }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) return toast.warning("Vui lòng nhập nội dung!");
    try {
        setSubmittingReview(true);
        const formData = new FormData();
        formData.append('order_id', selectedOrder._id);
        formData.append('rating', rating);
        formData.append('comment', reviewComment);
        reviewImages.forEach(img => formData.append('images', img));

        if (existingReview && existingReview._id) {
            await orderApi.updateReview(existingReview._id, formData); 
        } else {
            await orderApi.createReview(formData);
        }
        toast.success("Đánh giá thành công!");
        setShowReviewModal(false);
        fetchOrders(); 
    } catch (error) {
        toast.error("Lỗi gửi đánh giá.");
    } finally {
        setSubmittingReview(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      setCancelling(true);
      let nextStatus = 'cancelled';
      let cancelNote = "Khách hàng hủy đơn.";
      if (['pending', 'confirmed'].includes(selectedOrder.status) && selectedOrder.deposit_paid) {
          nextStatus = 'refund_pending';
          cancelNote = `[Chờ hoàn tiền] ${cancelReason}. STK: ${refundAccount}`;
      }
      await orderApi.updateOrderStatus(selectedOrder.order_id, nextStatus, cancelNote);
      toast.success("Đã gửi yêu cầu hủy.");
      setShowCancelModal(false);
      fetchOrders(); 
    } catch (error) {
      toast.error("Lỗi khi hủy đơn.");
    } finally {
      setCancelling(false);
    }
  };

  const handleContinuePayment = (order) => {
    let amountToPay = order.status === 'pending_payment' ? order.deposit_required : (order.final_amount - order.deposit_required);
    let isRemaining = ['confirmed', 'delivered', 'processing', 'in_progress'].includes(order.status);
    navigate("/payment", { state: { order, transfer_code: order.payment_info?.transfer_code, deposit_required: amountToPay, is_remaining: isRemaining } });
  };

  // --- UTILS ---
  const formatPrice = (price) => Number(price || 0).toLocaleString('vi-VN') + ' đ';
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : 'N/A';
  const getImageUrl = (img) => img ? (img.startsWith('http') ? img : `http://localhost:5000/${img.replace(/^\/+/, '')}`) : '';

  // --- COMPONENTS ---
  const OrderCard = ({ order }) => {
    const statusInfo = getStatusInfo(order.status);
    const isCompleted = order.status === 'completed';
    const isPaidRemaining = order.payment_info?.remaining_status === 'paid';

    // 1. Logic Nút Thanh Toán
    const showPayDeposit = order.status === 'pending_payment';
    const showPayRemaining = ['confirmed', 'processing', 'delivered', 'in_progress'].includes(order.status) && 
                             !isPaidRemaining && 
                             order.status !== 'final_payment_pending';

    // 2. Logic Nút Hủy
    const canCancel = ['pending_payment', 'pending', 'confirmed'].includes(order.status);

    // 3. ✅ LOGIC NÚT XEM ALBUM (Quan trọng)
    // Điều kiện: 
    // - (Có has_album = true TỪ BACKEND) HOẶC (Trạng thái là delivered/completed)
    // - VÀ (Đã thanh toán đủ tiền)
    const hasAlbumData = order.has_album === true || ['delivered', 'completed'].includes(order.status);
    const showViewAlbum = hasAlbumData && isPaidRemaining;

    return (
      <div className="order-card">
        <div className="order-card-header">
          <div className="order-id-section"><span className="order-id-label">Mã đơn:</span><span className="order-id-value">#{order.order_id}</span></div>
          <div className={`order-status ${statusInfo.className}`}>{statusInfo.icon}<span>{statusInfo.label}</span></div>
        </div>
        <div className="order-card-body">
          <div className="order-package-info">
            <div className="thumbnail-wrapper">
                <img src={getImageUrl(order.service_package_id?.AnhBia)} alt="" onError={(e)=>e.target.style.display='none'}/>
            </div>
            <div className="package-details">
              <h3>{order.service_package_id?.TenGoi || 'Gói dịch vụ'}</h3>
              <p className="package-type">{order.service_package_id?.LoaiGoi}</p>
            </div>
          </div>
          <div className="order-info-grid">
            <div className="info-item"><Calendar size={16}/><div><span className="info-label">Ngày chụp:</span><span className="info-value">{formatDate(order.booking_date)}</span></div></div>
            <div className="info-item"><Clock size={16}/><div><span className="info-label">Giờ:</span><span className="info-value">{order.start_time}</span></div></div>
            <div className="info-item"><DollarSign size={16}/><div><span className="info-label">Tổng tiền:</span><span className="info-value price">{formatPrice(order.final_amount)}</span></div></div>
          </div>
        </div>
        <div className="order-card-footer">
          <button className="btn-view-detail" onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}><Eye size={18}/> Chi tiết</button>
          
          <div className="action-buttons">
            {showPayDeposit && <button className="btn-pay-now" onClick={() => handleContinuePayment(order)}>Thanh toán cọc</button>}
            
            {showPayRemaining && <button className="btn-pay-now btn-remaining" onClick={() => handleContinuePayment(order)}>Thanh toán nốt</button>}
            
            {/* NÚT XEM ALBUM */}
            {showViewAlbum && (
                <button className="btn-success" onClick={() => navigate(`/albums/detail/${order.order_id}`)}>
                    <ImageIcon size={16} /> Xem Album
                </button>
            )}

            {isCompleted && (
                <button className={`btn-review ${order.review ? 'reviewed' : ''}`} onClick={() => openReviewModal(order)}>
                    {order.review ? <><CheckCircle size={16}/> Xem đánh giá</> : <><Star size={16}/> Đánh giá</>}
                </button>
            )}

            {canCancel && <button className="btn-cancel-order" onClick={() => { setSelectedOrder(order); setShowCancelModal(true); setCancelReason(''); }}>Hủy đơn</button>}
          </div>
        </div>
      </div>
    );
  };

  // --- MODAL COMPONENTS ---
  const OrderDetailModal = () => {
    if (!selectedOrder) return null;
    const statusInfo = getStatusInfo(selectedOrder.status);
    return (
      <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h2>Chi tiết đơn hàng #{selectedOrder.order_id}</h2><button onClick={() => setShowDetailModal(false)}>×</button></div>
          <div className="modal-body">
             <div className="detail-row"><span className="d-label">Trạng thái:</span><span className={`d-value ${statusInfo.className}`}>{statusInfo.label}</span></div>
             <div className="detail-row"><span className="d-label">Khách hàng:</span><span className="d-value">{selectedOrder.customer_id?.HoTen}</span></div>
             <div className="detail-row"><span className="d-label">SĐT:</span><span className="d-value">{selectedOrder.customer_id?.SoDienThoai}</span></div>
             <div className="detail-row"><span className="d-label">Địa điểm:</span><span className="d-value">{selectedOrder.location?.district} ({selectedOrder.location?.address})</span></div>
             {selectedOrder.note && <div className="detail-note"><strong>Ghi chú:</strong> {selectedOrder.note}</div>}
             
             <div className="payment-history">
                 <h4>Thanh toán</h4>
                 <div className="ph-item"><span>Cọc ({formatPrice(selectedOrder.deposit_required)}):</span><span className={selectedOrder.deposit_paid ? 'text-green' : 'text-red'}>{selectedOrder.deposit_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></div>
                 <div className="ph-item"><span>Còn lại:</span><span className={selectedOrder.payment_info?.remaining_status === 'paid' ? 'text-green' : 'text-orange'}>{selectedOrder.payment_info?.remaining_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="my-orders-page">
        <div className="container">
          <div className="page-header"><h1>Đơn hàng của tôi</h1></div>
          
          <div className="filters-section">
            <div className="search-box"><Search size={18} /><input type="text" placeholder="Tìm tên gói, mã đơn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="status-filters">
              {[{k: 'all', l: 'Tất cả'}, {k: 'pending_payment', l: 'Chờ cọc'}, {k: 'pending', l: 'Chờ duyệt'}, {k: 'confirmed', l: 'Sắp chụp'}, {k: 'processing_group', l: 'Đang thực hiện'}, {k: 'completed', l: 'Hoàn thành'}, {k: 'cancelled', l: 'Đã hủy'}].map(tab => (
                  <button key={tab.k} className={`filter-btn ${statusFilter === tab.k ? 'active' : ''}`} onClick={() => setStatusFilter(tab.k)}>{tab.l}</button>
              ))}
            </div>
          </div>

          {loading ? <div className="loading-state"><div className="spinner"></div></div> : 
           <div className="orders-grid">
             {filteredOrders.length > 0 ? filteredOrders.map((order) => <OrderCard key={order._id} order={order} />) : <div className="no-orders">Không tìm thấy đơn hàng nào.</div>}
           </div>
          }
        </div>
      </div>
      
      {showDetailModal && <OrderDetailModal />}
      
      {showReviewModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header"><h2>{existingReview ? (isEditing ? 'Sửa đánh giá' : 'Chi tiết đánh giá') : 'Đánh giá dịch vụ'}</h2><button className="btn-close-modal" onClick={() => setShowReviewModal(false)}>×</button></div>
                <div className="modal-body">
                    <div className="review-product-info"><img src={getImageUrl(selectedOrder.service_package_id?.AnhBia)} alt="" /><div><h4>{selectedOrder.service_package_id?.TenGoi}</h4><p>#{selectedOrder.order_id}</p></div></div>
                    {isEditing ? (
                        <div className="review-form">
                            <div className="star-rating-input">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={32} fill={star <= rating ? "#fbbf24" : "none"} color={star <= rating ? "#fbbf24" : "#ccc"} style={{cursor: 'pointer'}} onClick={() => setRating(star)}/>)}</div>
                            <textarea className="review-textarea" placeholder="Nội dung..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows="4"></textarea>
                            <div className="review-image-upload"><label htmlFor="review-images" className="upload-btn"><Upload size={20}/> Tải ảnh</label><input type="file" id="review-images" multiple accept="image/*" onChange={handleImageChange} style={{display: 'none'}}/>
                                <div className="image-previews">{previewImages.map((src, index) => (<div key={index} className="preview-item"><img src={existingReview && !src.startsWith('blob') ? getImageUrl(src) : src} alt="Preview" /><button className="btn-remove-img" onClick={() => removeImage(index)}>×</button></div>))}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="review-view-only"><div className="view-rating">{[...Array(5)].map((_, i) => <Star key={i} size={24} fill={i < rating ? "#fbbf24" : "#e5e7eb"} color={i < rating ? "#fbbf24" : "#e5e7eb"} />)}</div><p className="view-comment">{reviewComment}</p><div className="view-images">{previewImages.map((src, index) => <img key={index} src={getImageUrl(src)} alt="Review" onClick={()=>window.open(getImageUrl(src), '_blank')}/>)}</div>{!existingReview?.is_edited && <button className="btn-enable-edit" onClick={() => setIsEditing(true)}><Edit3 size={14}/> Sửa đánh giá</button>}</div>
                    )}
                    <div className="modal-actions">{isEditing && <button className="btn-submit-review" onClick={handleSubmitReview} disabled={submittingReview}>Gửi đánh giá</button>}</div>
                </div>
            </div>
        </div>
      )}

      {showCancelModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
            <div className="modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
               <div className="modal-header"><h2>Hủy đơn hàng</h2><button onClick={()=>setShowCancelModal(false)}>×</button></div>
               <div className="modal-body">
                  <p>Bạn có chắc chắn muốn hủy đơn <strong>#{selectedOrder.order_id}</strong>?</p>
                  <textarea value={cancelReason} onChange={(e)=>setCancelReason(e.target.value)} placeholder="Lý do hủy..." className="review-textarea"></textarea>
                  {selectedOrder.deposit_paid && (<div className="refund-warning"><span>Đơn đã cọc. Nhập STK để hoàn tiền.</span><input value={refundAccount} onChange={(e)=>setRefundAccount(e.target.value)} placeholder="Ngân hàng - Số TK - Tên chủ TK" className="review-input"/></div>)}
                  <div className="modal-actions"><button className="btn-confirm-cancel" onClick={handleCancelOrder} disabled={cancelling}>{cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}</button></div>
               </div>
            </div>
        </div>
      )}
    </>
  );
}