import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, DollarSign,
  CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, Search,
  CreditCard, AlertTriangle, HelpCircle,
  RefreshCcw, Star, Hourglass, Image as ImageIcon, Upload, Edit3
} from 'lucide-react';
import './MyOrder.css';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

// ✅ KHÔNG IMPORT HEADER/SIDEBAR/FOOTER Ở ĐÂY NỮA
import orderApi from '../../apis/OrderService';

export default function MyOrder() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.user || {});

  // --- STATE DỮ LIỆU ---
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // --- STATE MODAL ---
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // --- STATE HỦY ĐƠN ---
  const [cancelReason, setCancelReason] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // --- STATE ĐÁNH GIÁ ---
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]); // File upload
  const [previewImages, setPreviewImages] = useState([]); // URL hiển thị
  const [existingReview, setExistingReview] = useState(null); 
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // true: Sửa, false: Xem

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    fetchOrders();
  }, [user, navigate]);

  useEffect(() => { filterOrders(); }, [orders, searchTerm, statusFilter]);

  // --- API CALLS ---
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getMyOrders();
      const ordersList = response?.data || response || [];
      
      // Đảm bảo ordersList là mảng
      const safeList = Array.isArray(ordersList) ? ordersList : (ordersList.data || []);
      
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

  // --- REVIEW LOGIC ---
  const openReviewModal = (order) => {
    setSelectedOrder(order);
    
    if (order.review) {
        // Đã có đánh giá -> Chế độ Xem
        setExistingReview(order.review);
        setRating(order.review.Rating || 5);
        setReviewComment(order.review.Comment || '');
        setPreviewImages(order.review.Images || []); 
        setReviewImages([]); 
        setIsEditing(false);
    } else {
        // Chưa có -> Chế độ Nhập
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
    if (!reviewComment.trim()) return toast.warning("Vui lòng nhập nội dung đánh giá!");
    try {
        setSubmittingReview(true);
        const formData = new FormData();
        formData.append('order_id', selectedOrder._id);
        formData.append('rating', rating);
        formData.append('comment', reviewComment);
        reviewImages.forEach(img => formData.append('images', img));

        let res;
        // Kiểm tra _id để biết là tạo mới hay cập nhật
        if (existingReview && existingReview._id) {
            if (existingReview.is_edited) return toast.error("Bạn chỉ được chỉnh sửa đánh giá 1 lần duy nhất.");
            res = await orderApi.updateReview(existingReview._id, formData); 
        } else {
            res = await orderApi.createReview(formData);
        }
        toast.success("Thành công!");
        setShowReviewModal(false);
        fetchOrders(); 
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi gửi đánh giá.");
    } finally {
        setSubmittingReview(false);
    }
  };

  // --- CANCEL & PAYMENT LOGIC ---
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      setCancelling(true);
      let nextStatus = 'cancelled';
      let cancelNote = "Khách hàng hủy đơn.";
      if (selectedOrder.status === 'pending') {
          nextStatus = 'refund_pending';
          cancelNote = `[Chờ hoàn tiền] ${cancelReason}. STK: ${refundAccount}`;
      }
      await orderApi.updateOrderStatus(selectedOrder.order_id, nextStatus, cancelNote);
      toast.success("Hủy đơn hàng thành công.");
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
    let isRemaining = order.status === 'confirmed';
    navigate("/payment", { state: { order, transfer_code: order.payment_info?.transfer_code, deposit_required: amountToPay, is_remaining: isRemaining } });
  };

  const openCancelModal = (order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
    setCancelReason('');
    setRefundAccount('');
  };

  // --- UTILS & COMPONENTS ---
  const getStatusInfo = (status) => {
    const statusMap = {
      pending_payment: { label: 'Chờ đặt cọc', icon: <CreditCard size={16} />, className: 'status-pending-payment' },
      pending: { label: 'Chờ duyệt cọc', icon: <Clock size={16} />, className: 'status-pending' },
      confirmed: { label: 'Đã xác nhận', icon: <CheckCircle size={16} />, className: 'status-confirmed' },
      in_progress: { label: 'Đang thực hiện', icon: <RefreshCw size={16} />, className: 'status-progress' },
      final_payment_pending: { label: 'Chờ duyệt TT cuối', icon: <Hourglass size={16} />, className: 'status-refund' }, 
      processing: { label: 'Đang xử lý ảnh', icon: <RefreshCw size={16} />, className: 'status-progress' },
      completed: { label: 'Hoàn thành', icon: <CheckCircle size={16} />, className: 'status-completed' },
      cancelled: { label: 'Đã hủy', icon: <XCircle size={16} />, className: 'status-cancelled' },
      refund_pending: { label: 'Chờ hoàn tiền', icon: <RefreshCcw size={16} />, className: 'status-refund' }
    };
    return statusMap[status] || { label: status, icon: <HelpCircle size={16} />, className: 'status-default' };
  };

  const formatPrice = (price) => Number(price || 0).toLocaleString('vi-VN') + ' VNĐ';
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : 'N/A';
  const getImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith('http')) return img;
    return `http://localhost:5000/${img.replace(/^\/+/, '')}`;
  };

  const OrderCard = ({ order }) => {
    const statusInfo = getStatusInfo(order.status);
    const isCompleted = order.status === 'completed';
    const isPendingPayment = order.status === 'pending_payment';
    const isConfirmed = order.status === 'confirmed';
    const imgUrl = getImageUrl(order.service_package_id?.AnhBia);

    return (
      <div className="order-card">
        <div className="order-card-header">
          <div className="order-id-section"><span className="order-id-label">Mã đơn:</span><span className="order-id-value">{order.order_id}</span></div>
          <div className={`order-status ${statusInfo.className}`}>{statusInfo.icon}<span>{statusInfo.label}</span></div>
        </div>
        <div className="order-card-body">
          <div className="order-package-info">
            <div className="thumbnail-wrapper" style={{width:'80px', height:'80px', borderRadius:'8px', overflow:'hidden', backgroundColor:'#f3f4f6'}}>
                <img src={imgUrl} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={(e)=>e.target.style.display='none'}/>
            </div>
            <div className="package-details">
              <h3>{order.service_package_id?.TenGoi || 'Gói dịch vụ'}</h3>
              <p className="package-type">{order.service_package_id?.LoaiGoi}</p>
            </div>
          </div>
          <div className="order-info-grid">
            <div className="info-item"><Calendar size={16}/><div><span className="info-label">Ngày đặt:</span><span className="info-value">{formatDate(order.booking_date)}</span></div></div>
            <div className="info-item"><DollarSign size={16}/><div><span className="info-label">Tổng tiền:</span><span className="info-value price">{formatPrice(order.final_amount)}</span></div></div>
          </div>
        </div>
        <div className="order-card-footer">
          <button className="btn-view-detail" onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}><Eye size={18}/> Chi tiết</button>
          <div className="action-buttons">
            {isPendingPayment && <button className="btn-pay-now" onClick={() => handleContinuePayment(order)}>Đặt cọc ngay</button>}
            {isConfirmed && <button className="btn-pay-now btn-remaining" onClick={() => handleContinuePayment(order)}>Thanh toán nốt</button>}
            
            {/* Nút Đánh giá / Xem đánh giá */}
            {isCompleted && (
                <button className={`btn-review ${order.review ? 'reviewed' : ''}`} onClick={() => openReviewModal(order)}>
                    {order.review ? <><CheckCircle size={16}/> Xem đánh giá</> : <><Star size={16}/> Đánh giá ngay</>}
                </button>
            )}

            {!['cancelled', 'completed', 'pending_payment', 'refund_pending', 'final_payment_pending'].includes(order.status) && 
             <button className="btn-cancel-order" onClick={() => openCancelModal(order)}>Hủy lịch</button>}
          </div>
        </div>
      </div>
    );
  };

  const OrderDetailModal = () => {
    if (!selectedOrder) return null;
    const statusInfo = getStatusInfo(selectedOrder.status);
    return (
      <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h2>Chi tiết đơn hàng #{selectedOrder.order_id}</h2><button onClick={() => setShowDetailModal(false)}>×</button></div>
          <div className="modal-body" style={{padding: '20px 30px'}}>
             <div className="detail-item"><span className="label">Trạng thái:</span><span className={`value ${statusInfo.className}`}>{statusInfo.label}</span></div>
             {/* ... */}
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
            <div className="search-box"><Search size={18} /><input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="status-filters">
              {['all', 'pending_payment', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                  <button key={s} className={`filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s === 'all' ? 'Tất cả' : getStatusInfo(s).label}</button>
              ))}
            </div>
          </div>
          {loading ? <div className="loading-state"><div className="spinner"></div></div> : 
           <div className="orders-grid">
             {filteredOrders.map((order) => <OrderCard key={order._id} order={order} />)}
             {filteredOrders.length === 0 && <div className="no-orders">Không có đơn hàng nào.</div>}
           </div>
          }
        </div>
      </div>
      
      {showReviewModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{existingReview ? (isEditing ? 'Chỉnh sửa đánh giá' : 'Chi tiết đánh giá') : 'Đánh giá dịch vụ'}</h2>
                    <button className="btn-close-modal" onClick={() => setShowReviewModal(false)}>×</button>
                </div>
                <div className="modal-body">
                    <div className="review-product-info">
                        <img src={getImageUrl(selectedOrder.service_package_id?.AnhBia)} alt="" />
                        <div><h4>{selectedOrder.service_package_id?.TenGoi}</h4><p>Mã đơn: {selectedOrder.order_id}</p></div>
                    </div>
                    
                    {/* CHẾ ĐỘ NHẬP / SỬA */}
                    {isEditing ? (
                        <div className="review-form">
                            <div className="star-rating-input">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={32} fill={star <= rating ? "#fbbf24" : "none"} color={star <= rating ? "#fbbf24" : "#ccc"} style={{cursor: 'pointer'}} onClick={() => setRating(star)}/>
                                ))}
                                <span className="rating-label">{rating === 5 ? 'Tuyệt vời' : rating === 4 ? 'Hài lòng' : rating === 3 ? 'Bình thường' : 'Tệ'}</span>
                            </div>
                            <textarea className="review-textarea" placeholder="Chia sẻ cảm nhận của bạn..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows="4"></textarea>
                            <div className="review-image-upload">
                                <label htmlFor="review-images" className="upload-btn"><Upload size={20}/> Thêm hình ảnh</label>
                                <input type="file" id="review-images" multiple accept="image/*" onChange={handleImageChange} style={{display: 'none'}}/>
                                <div className="image-previews">
                                    {previewImages.map((src, index) => (
                                        <div key={index} className="preview-item">
                                            <img src={existingReview && !src.startsWith('blob') ? getImageUrl(src) : src} alt="Preview" />
                                            <button className="btn-remove-img" onClick={() => removeImage(index)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {existingReview && <p className="edit-warning"><Edit3 size={14}/> Bạn chỉ được chỉnh sửa 1 lần.</p>}
                        </div>
                    ) : (
                        // CHẾ ĐỘ XEM
                        <div className="review-view-only">
                            <div className="view-rating">{[...Array(5)].map((_, i) => <Star key={i} size={24} fill={i < rating ? "#fbbf24" : "#e5e7eb"} color={i < rating ? "#fbbf24" : "#e5e7eb"} />)}</div>
                            <p className="view-comment">{reviewComment}</p>
                            <div className="view-images">
                                {previewImages.map((src, index) => (
                                    <img key={index} src={getImageUrl(src)} alt="Review" onClick={()=>window.open(getImageUrl(src), '_blank')} style={{cursor:'zoom-in'}}/>
                                ))}
                            </div>
                            {existingReview?.is_edited ? (
                                <div className="edited-badge">Đã chỉnh sửa</div>
                            ) : (
                                <button className="btn-enable-edit" onClick={() => setIsEditing(true)}>
                                    <Edit3 size={14} style={{marginRight: 6}}/> Chỉnh sửa đánh giá
                                </button>
                            )}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button className="btn-back-modal" onClick={() => setShowReviewModal(false)}>Đóng</button>
                        {isEditing && <button className="btn-submit-review" onClick={handleSubmitReview} disabled={submittingReview}>Gửi đánh giá</button>}
                    </div>
                </div>
            </div>
        </div>
      )}

      {showCancelModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
            <div className="modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
               {/* Modal Content Hủy (Giữ nguyên) */}
               <div className="modal-header"><h2>Hủy đơn hàng</h2><button onClick={()=>setShowCancelModal(false)}>×</button></div>
               <div className="modal-body">
                  <textarea value={cancelReason} onChange={(e)=>setCancelReason(e.target.value)} placeholder="Lý do hủy..." className="review-textarea"></textarea>
                  {selectedOrder.status === 'pending' && <input value={refundAccount} onChange={(e)=>setRefundAccount(e.target.value)} placeholder="Số TK hoàn tiền..." className="review-input"/>}
                  <div className="modal-actions">
                      <button className="btn-confirm-cancel" onClick={handleCancelOrder} disabled={cancelling}>{cancelling ? '...' : 'Xác nhận hủy'}</button>
                  </div>
               </div>
            </div>
        </div>
      )}
    </>
  );
}