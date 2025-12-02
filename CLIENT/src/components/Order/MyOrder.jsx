import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, DollarSign,
  CheckCircle, XCircle, RefreshCw, Eye, Search,
  CreditCard, HelpCircle, RefreshCcw, Star, Hourglass, 
  Upload, Edit3, Camera, Image as ImageIcon, AlertTriangle, MessageSquareWarning, ThumbsUp
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import orderApi from '../../apis/OrderService';
import './MyOrder.css';

// ✅ Import MainLayout
import MainLayout from '../../layouts/MainLayout/MainLayout';

// ❌ Đã xóa import Header, Sidebar, Footer lẻ tẻ

export default function MyOrder() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.user || {});

  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // --- STATE QUẢN LÝ MODAL ---
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  
  // --- STATE QUẢN LÝ FORM ACTION ---
  const [complaintReason, setComplaintReason] = useState('');
  const [complaintImages, setComplaintImages] = useState([]); 
  const [complaintPreviews, setComplaintPreviews] = useState([]); 
  const [processingAction, setProcessingAction] = useState(false); 

  // --- STATE QUẢN LÝ REVIEW ---
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]); 
  const [previewImages, setPreviewImages] = useState([]); 
  const [existingReview, setExistingReview] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 

  // --- INIT ---
  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    fetchOrders();
  }, [user, navigate]);

  useEffect(() => { filterOrders(); }, [orders, searchTerm, statusFilter]);

  // --- API FUNCTIONS ---
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getMyOrders();
      const ordersList = response?.data?.data || response?.data || [];
      const safeList = Array.isArray(ordersList) ? ordersList : [];
      
      const sortedOrders = safeList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
      setFilteredOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];
    
    if (statusFilter !== 'all') {
        if (statusFilter === 'processing_group') {
            filtered = filtered.filter(o => ['in_progress', 'processing', 'delivered'].includes(o.status));
        } else {
            filtered = filtered.filter(order => order.status === statusFilter);
        }
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        (order.order_id && order.order_id.toLowerCase().includes(lowerTerm)) ||
        (order.service_package_id?.TenGoi && order.service_package_id.TenGoi.toLowerCase().includes(lowerTerm))
      );
    }
    setFilteredOrders(filtered);
  };

  // --- HELPER FUNCTIONS ---
  const getStatusInfo = (status) => {
    switch (status) {
        case 'pending_payment': return { label: 'Chờ thanh toán cọc', icon: <CreditCard size={16}/>, className: 'status-pending-payment' };
        case 'pending': return { label: 'Chờ xác nhận', icon: <Clock size={16}/>, className: 'status-pending' };
        case 'confirmed': return { label: 'Đã chốt lịch', icon: <CheckCircle size={16}/>, className: 'status-confirmed' };
        case 'in_progress': return { label: 'Đang thực hiện', icon: <Camera size={16}/>, className: 'status-progress' };
        case 'processing': return { label: 'Đang xử lý ảnh', icon: <RefreshCw size={16}/>, className: 'status-processing' };
        case 'delivered': return { label: 'Đã giao ảnh', icon: <ImageIcon size={16}/>, className: 'status-delivered' };
        case 'waiting_final_payment': 
        case 'final_payment_pending': return { label: 'Chờ thanh toán', icon: <Hourglass size={16}/>, className: 'status-payment' };
        case 'completed': return { label: 'Hoàn thành', icon: <Star size={16}/>, className: 'status-completed' };
        case 'cancelled': return { label: 'Đã hủy', icon: <XCircle size={16}/>, className: 'status-cancelled' };
        case 'refund_pending': return { label: 'Chờ hoàn tiền', icon: <RefreshCcw size={16}/>, className: 'status-refund' };
        case 'complaint': return { label: 'Đang khiếu nại', icon: <AlertTriangle size={16}/>, className: 'status-cancelled' };
        default: return { label: status, icon: <HelpCircle size={16}/>, className: 'status-default' };
    }
  };

  const formatPrice = (price) => Number(price || 0).toLocaleString('vi-VN') + ' đ';
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : 'N/A';
  
  const getImageUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return `http://localhost:5000${img.startsWith('/') ? '' : '/'}${img}`;
  };

  // --- ACTIONS ---
  const handleOpenCancel = (order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
    setShowDetailModal(false);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    try {
      setProcessingAction(true);
      
      let nextStatus = 'cancelled';
      let cancelNote = "Khách hàng hủy đơn.";

      const isDepositPaid = selectedOrder.deposit_paid || selectedOrder.status === 'confirmed';
      
      if (isDepositPaid) {
          nextStatus = 'refund_pending'; 
          cancelNote = "Khách hàng yêu cầu hủy đơn (Đơn đã đặt cọc).";
      }

      await orderApi.updateOrderStatus(selectedOrder.order_id || selectedOrder._id, nextStatus, cancelNote);
      
      toast.success("Đã gửi yêu cầu hủy đơn thành công.");
      setShowCancelModal(false);
      fetchOrders(); 
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi khi hủy đơn. Vui lòng thử lại.");
    } finally {
      setProcessingAction(false);
    }
  };

  // --- REVIEW & COMPLAINT & PAYMENT ---
  const openReviewModal = (order) => {
    setSelectedOrder(order);
    const hasReviewed = order.review && (order.review.is_reviewed === true || order.review.rating > 0 || order.review.Rating > 0);

    if (hasReviewed) {
        setExistingReview(order.review);
        setRating(order.review.rating || order.review.Rating || 5);
        setReviewComment(order.review.comment || order.review.Comment || '');
        setPreviewImages(order.review.images || order.review.Images || []); 
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

  const handleReviewImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
        toast.warning("Chỉ được upload tối đa 5 ảnh.");
        return;
    }
    setReviewImages(files);
    setPreviewImages(files.map(file => URL.createObjectURL(file)));
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) return toast.warning("Vui lòng nhập nội dung đánh giá!");
    try {
        setProcessingAction(true);
        const formData = new FormData();
        if (!existingReview) formData.append('order_id', selectedOrder._id || selectedOrder.order_id); 
        formData.append('rating', rating);
        formData.append('comment', reviewComment);
        reviewImages.forEach(file => formData.append('images', file));

        if (existingReview) {
            const reviewId = existingReview._id || existingReview.id;
            await orderApi.updateReview(reviewId, formData);
            toast.success("Cập nhật đánh giá thành công!");
        } else {
            await orderApi.createReview(formData);
            toast.success("Cảm ơn bạn đã đánh giá dịch vụ!");
        }

        await fetchOrders(); 
        setShowReviewModal(false);
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Lỗi khi gửi đánh giá.");
    } finally {
        setProcessingAction(false);
    }
  };

  const openComplaintModal = (order) => {
    setSelectedOrder(order);
    setComplaintReason('');
    setComplaintImages([]);
    setComplaintPreviews([]);
    setShowComplaintModal(true);
  };

  const handleComplaintImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + complaintImages.length > 10) return toast.warning("Tối đa 10 ảnh.");
    setComplaintImages(prev => [...prev, ...files]);
    setComplaintPreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  const handleSubmitComplaint = async () => {
    if (!complaintReason.trim()) return toast.warning("Vui lòng nhập lý do khiếu nại");
    try {
        setProcessingAction(true);
        const formData = new FormData();
        formData.append('order_id', selectedOrder._id); 
        formData.append('reason', complaintReason);
        complaintImages.forEach(file => formData.append('images', file));
        await orderApi.createComplaint(formData); 
        toast.success("Đã gửi khiếu nại thành công.");
        setShowComplaintModal(false);
        fetchOrders();
    } catch (error) {
        toast.error("Lỗi khi gửi khiếu nại.");
    } finally {
        setProcessingAction(false);
    }
  };

  const handleConfirmComplete = async () => {
      if (!selectedOrder) return;
      try {
          setProcessingAction(true);
          await orderApi.updateOrderStatus(selectedOrder.order_id, 'completed', 'Khách hàng xác nhận hoàn thành.');
          toast.success("Đã xác nhận hoàn thành đơn hàng!");
          setShowCompleteModal(false);
          await fetchOrders();
          const updatedOrder = { ...selectedOrder, status: 'completed', review: null };
          openReviewModal(updatedOrder);
      } catch (error) {
          toast.error("Lỗi khi xác nhận hoàn thành.");
      } finally {
          setProcessingAction(false);
      }
  };

  const handleContinuePayment = (order) => {
    let amountToPay = order.status === 'pending_payment' ? order.deposit_required : (order.final_amount - order.deposit_required);
    let isRemaining = order.status !== 'pending_payment';
    navigate("/payment", { state: { order, transfer_code: order.payment_info?.transfer_code, deposit_required: amountToPay, is_remaining: isRemaining } });
  };

  // --- COMPONENT CON: ORDER CARD ---
  const OrderCard = ({ order }) => {
    const statusInfo = getStatusInfo(order.status);
    const isCompleted = order.status === 'completed';
    const isPaidRemaining = order.payment_info?.remaining_status === 'paid';
    
    const hasReviewed = order.review && (order.review.is_reviewed === true || order.review.rating > 0 || order.review.Rating > 0);

    const showPayDeposit = order.status === 'pending_payment';
    const showPayRemaining = ['confirmed', 'processing', 'delivered', 'in_progress'].includes(order.status) && !isPaidRemaining && order.status !== 'final_payment_pending';
    const showViewAlbum = (order.has_album || ['delivered', 'completed'].includes(order.status)) && isPaidRemaining;
    const showCompleteBtn = order.status === 'delivered' && isPaidRemaining;
    const showComplaintBtn = ['processing', 'delivered', 'in_progress'].includes(order.status);
    
    const canCancel = ['pending_payment', 'pending', 'confirmed'].includes(order.status);

    return (
      <div className="order-card">
        <div className="order-card-header">
          <div className="order-id-section"><span className="order-id-label">Mã:</span><span className="order-id-value">#{order.order_id}</span></div>
          <div className={`order-status ${statusInfo.className}`}>{statusInfo.icon}<span>{statusInfo.label}</span></div>
        </div>
        <div className="order-card-body">
          <div className="order-package-info">
            <div className="thumbnail-wrapper"><img src={getImageUrl(order.service_package_id?.AnhBia)} alt="" onError={(e)=>e.target.style.display='none'}/></div>
            <div className="package-details">
              <h3>{order.service_package_id?.TenGoi}</h3>
              <p>{order.service_package_id?.LoaiGoi}</p>
              <div className="photographer-name"><Camera size={14}/> {order.photographer_id?.HoTen || 'Đang cập nhật'}</div>
            </div>
          </div>
          <div className="order-info-grid">
            <div className="info-item"><Calendar size={14}/> {formatDate(order.booking_date)}</div>
            <div className="info-item"><Clock size={14}/> {order.start_time}</div>
            <div className="info-item"><DollarSign size={14}/> {formatPrice(order.final_amount)}</div>
          </div>
        </div>
        <div className="order-card-footer">
          <div className="footer-top-actions">
             <button className="btn-view-detail" onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}><Eye size={16}/> Chi tiết</button>
             {showComplaintBtn && <button className="btn-link-danger" onClick={() => openComplaintModal(order)}><MessageSquareWarning size={16}/> Khiếu nại</button>}
          </div>
          <div className="action-buttons">
            {canCancel && (
                <button 
                    className="btn-cancel-order" 
                    onClick={() => handleOpenCancel(order)}
                    style={{
                        borderColor: '#dc2626', color: '#dc2626', borderWidth: '1px', borderStyle: 'solid', 
                        background: 'white', marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '5px'
                    }}
                >
                    <XCircle size={16} /> Hủy đơn
                </button>
            )}

            {showPayDeposit && <button className="btn-pay-now" onClick={() => handleContinuePayment(order)}>Thanh toán cọc</button>}
            {showPayRemaining && <button className="btn-pay-now btn-remaining" onClick={() => handleContinuePayment(order)}>Thanh toán nốt</button>}
            {showViewAlbum && <button className="btn-success" onClick={() => navigate(`/albums/detail/${order.order_id}`)}><ImageIcon size={16}/> Xem Album</button>}
            {showCompleteBtn && <button className="btn-complete" onClick={() => {setSelectedOrder(order); setShowCompleteModal(true);}}><ThumbsUp size={16}/> Đã nhận ảnh</button>}
            
            {isCompleted && (
                <button className={`btn-review ${hasReviewed ? 'reviewed' : ''}`} onClick={() => openReviewModal(order)}>
                    {hasReviewed ? <><CheckCircle size={16}/> Xem đánh giá</> : <><Star size={16}/> Đánh giá ngay</>}
                </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER MAIN ---
  return (
    // ✅ Bọc trong MainLayout
    <MainLayout>
      <div className="my-orders-page">
        <div className="container">
          <div className="page-header"><h1>Đơn hàng của tôi</h1></div>
          
          {/* FILTERS */}
          <div className="filters-section">
            <div className="search-box"><Search size={18} /><input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Tìm mã đơn, tên gói..."/></div>
            <div className="status-filters">
              {[{k:'all',l:'Tất cả'},{k:'pending_payment',l:'Chờ cọc'},{k:'pending',l:'Chờ duyệt'},{k:'processing_group',l:'Đang xử lý'},{k:'completed',l:'Hoàn thành'},{k:'cancelled',l:'Đã hủy'}].map(tab=>(
                  <button key={tab.k} className={statusFilter===tab.k?'active':''} onClick={()=>setStatusFilter(tab.k)}>{tab.l}</button>
              ))}
            </div>
          </div>

          {/* GRID */}
          {loading ? <div className="loading-state">Loading...</div> : 
            <div className="orders-grid">
              {filteredOrders.length > 0 ? filteredOrders.map(o => <OrderCard key={o._id} order={o} />) : <div className="no-orders">Không có đơn hàng nào.</div>}
            </div>
          }
        </div>
      </div>

      {/* --- MODALS (Để ngoài container chính để tránh ảnh hưởng layout nhưng vẫn trong MainLayout context nếu cần, hoặc để ngoài cùng) --- */}
      
      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
          <div className="modal-overlay" onClick={()=>setShowDetailModal(false)}>
              <div className="modal-content" onClick={e=>e.stopPropagation()}>
                  <div className="modal-header"><h2>Chi tiết đơn hàng #{selectedOrder.order_id}</h2><button onClick={()=>setShowDetailModal(false)}>×</button></div>
                  <div className="modal-body">
                      <p><strong>Dịch vụ:</strong> {selectedOrder.service_package_id?.TenGoi}</p>
                      <p><strong>Thời gian:</strong> {selectedOrder.start_time} - {formatDate(selectedOrder.booking_date)}</p>
                      <p><strong>Địa chỉ:</strong> {selectedOrder.location?.address}</p>
                      <p><strong>Tổng tiền:</strong> {formatPrice(selectedOrder.final_amount)}</p>
                      <p><strong>Trạng thái:</strong> {getStatusInfo(selectedOrder.status).label}</p>
                  </div>
                  <div className="modal-actions" style={{justifyContent: 'flex-end', marginTop: 20}}>
                        {['pending_payment', 'pending', 'confirmed'].includes(selectedOrder.status) && (
                            <button 
                                className="btn-cancel-order" 
                                style={{marginRight: 10, borderColor: '#dc2626', color: '#dc2626', background: 'white'}} 
                                onClick={() => handleOpenCancel(selectedOrder)}
                            >
                                Hủy đơn hàng
                            </button>
                        )}
                        <button className="btn-secondary" onClick={()=>setShowDetailModal(false)}>Đóng</button>
                  </div>
              </div>
          </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedOrder && (
          <div className="modal-overlay" onClick={()=>setShowCancelModal(false)}>
              <div className="modal-content cancel-modal" onClick={e=>e.stopPropagation()}>
                  <div className="modal-header">
                      <h2>Hủy đơn hàng #{selectedOrder.order_id}</h2>
                      <button onClick={()=>setShowCancelModal(false)}>×</button>
                  </div>
                  
                  <div className="modal-body">
                      <div className="alert-box error" style={{backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '6px', marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'start'}}>
                          <AlertTriangle size={24} style={{flexShrink: 0}} />
                          <div>
                              <strong>CẢNH BÁO: CHÍNH SÁCH HỦY & TIỀN CỌC</strong>
                              <p style={{fontSize: '14px', marginTop: '4px'}}>
                                  Lưu ý: Việc hủy đơn hàng có thể ảnh hưởng đến quyền lợi hoặc số tiền đã đặt cọc (nếu có) theo chính sách của hệ thống. Vui lòng cân nhắc kỹ trước khi hủy.
                              </p>
                          </div>
                      </div>

                      <div className="modal-actions" style={{marginTop: '20px'}}>
                          <button className="btn-secondary" onClick={()=>setShowCancelModal(false)}>Đóng</button>
                          <button 
                            className="btn-confirm-cancel" 
                            style={{backgroundColor: '#dc2626', color: 'white', border: 'none'}}
                            onClick={handleCancelOrder} 
                            disabled={processingAction}
                          >
                            {processingAction ? 'Đang xử lý...' : 'Xác nhận hủy'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{existingReview ? (isEditing ? 'Sửa đánh giá' : 'Chi tiết đánh giá') : 'Đánh giá dịch vụ'}</h2>
                    <button className="btn-close-modal" onClick={() => setShowReviewModal(false)}>×</button>
                </div>
                <div className="modal-body">
                    <div className="review-product-info">
                        <img src={getImageUrl(selectedOrder.service_package_id?.AnhBia)} alt="" onError={e=>e.target.style.display='none'}/>
                        <div><h4>{selectedOrder.service_package_id?.TenGoi}</h4><p>#{selectedOrder.order_id}</p></div>
                    </div>
                    {isEditing ? (
                        <div className="review-form">
                            <div className="star-rating-input">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={32} fill={star <= rating ? "#fbbf24" : "none"} color={star <= rating ? "#fbbf24" : "#ccc"} style={{cursor: 'pointer'}} onClick={() => setRating(star)}/>
                                ))}
                                <span className="ml-2 font-bold">{rating}/5</span>
                            </div>
                            <textarea className="review-textarea" placeholder="Nhập nội dung..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows="4"></textarea>
                            <div className="review-image-upload">
                                <label htmlFor="review-images" className="upload-btn"><Upload size={20}/> Chọn ảnh (Max 5)</label>
                                <input type="file" id="review-images" multiple accept="image/*" onChange={handleReviewImageChange} style={{display: 'none'}}/>
                                <div className="image-previews">
                                    {previewImages.map((src, i) => (<div key={i} className="preview-item"><img src={src.startsWith('blob:') ? src : getImageUrl(src)} alt=""/></div>))}
                                </div>
                            </div>
                            <div className="modal-actions">
                                {existingReview && <button className="btn-secondary" onClick={() => setIsEditing(false)}>Hủy</button>}
                                <button className="btn-submit-review" onClick={handleSubmitReview} disabled={processingAction}>{processingAction ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="review-view-only">
                            <div className="view-rating">
                                {[...Array(5)].map((_, i) => <Star key={i} size={24} fill={i < rating ? "#fbbf24" : "#e5e7eb"} color={i < rating ? "#fbbf24" : "#e5e7eb"} />)}
                                <span className="rating-text">{rating} Sao</span>
                            </div>
                            <p className="view-comment">{reviewComment}</p>
                            <div className="view-images">{previewImages.map((src, i) => <img key={i} src={getImageUrl(src)} alt=""/>)}</div>
                            {!existingReview.is_edited && <button className="btn-enable-edit" onClick={() => setIsEditing(true)}><Edit3 size={14}/> Sửa đánh giá</button>}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Complete & Complaint Modals */}
      {showCompleteModal && selectedOrder && (
          <div className="modal-overlay" onClick={()=>setShowCompleteModal(false)}>
              <div className="modal-content small-modal" onClick={e=>e.stopPropagation()}>
                  <div className="modal-header"><h2>Xác nhận</h2><button onClick={()=>setShowCompleteModal(false)}>×</button></div>
                  <div className="modal-body text-center">
                      <ThumbsUp size={40} className="mb-3 text-green mx-auto"/>
                      <p>Bạn xác nhận đã nhận đủ ảnh và hài lòng với dịch vụ?</p>
                      <div className="modal-actions center">
                          <button className="btn-secondary" onClick={()=>setShowCompleteModal(false)}>Hủy</button>
                          <button className="btn-primary" onClick={handleConfirmComplete} disabled={processingAction}>Đồng ý</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showComplaintModal && selectedOrder && (
          <div className="modal-overlay" onClick={()=>setShowComplaintModal(false)}>
              <div className="modal-content" onClick={e=>e.stopPropagation()}>
                  <div className="modal-header warning-header"><h2>Khiếu nại dịch vụ</h2><button onClick={()=>setShowComplaintModal(false)}>×</button></div>
                  <div className="modal-body">
                      <p>Vui lòng cho biết vấn đề bạn gặp phải:</p>
                      <textarea className="review-textarea" rows="4" value={complaintReason} onChange={e=>setComplaintReason(e.target.value)}></textarea>
                      <div className="review-image-upload">
                          <label htmlFor="complaint-images" className="upload-btn"><Upload size={20}/> Thêm ảnh minh chứng (Max 10)</label>
                          <input type="file" id="complaint-images" multiple accept="image/*" onChange={handleComplaintImageChange} style={{display: 'none'}}/>
                          <div className="image-previews">
                              {complaintPreviews.map((src, i) => (<div key={i} className="preview-item"><img src={src} alt="Proof"/></div>))}
                          </div>
                      </div>
                      <div className="modal-actions">
                          <button className="btn-secondary" onClick={()=>setShowComplaintModal(false)}>Hủy</button>
                          <button className="btn-danger" onClick={handleSubmitComplaint} disabled={processingAction}>Gửi khiếu nại</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </MainLayout>
  );
}