import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Calendar, Clock, MapPin, 
    CreditCard, User, Package, Phone, 
    CheckCircle, Circle, AlertTriangle, 
    Download, MessageSquare, Camera,
    DollarSign, ChevronRight, Image as ImageIcon,
    ExternalLink, Layers
} from 'lucide-react';
import { toast } from 'react-toastify';
import MainLayout from '../../layouts/MainLayout/MainLayout';
import orderApi from '../../apis/OrderService';
import albumApi from '../../apis/albumApi'; // ✅ Import Album API
import './MyOrderDetail.css';

export default function MyOrderDetail() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    
    const [order, setOrder] = useState(null);
    const [album, setAlbum] = useState(null); // ✅ State lưu thông tin Album
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [orderId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 1. Lấy chi tiết đơn hàng
            const orderRes = await orderApi.getOrderDetail(orderId);
            const orderData = orderRes.data?.data || orderRes.data;
            setOrder(orderData);

            // 2. ✅ Lấy chi tiết Album (Nếu có)
            try {
                // Lưu ý: API getAlbumDetail thường nhận OrderID hoặc AlbumID
                // Nếu backend bạn viết getAlbumDetail nhận orderId thì gọi như sau:
                const albumRes = await albumApi.getAlbumDetail(orderId);
                if (albumRes.data && albumRes.data.data) {
                    setAlbum(albumRes.data.data);
                } else if (albumRes.data) {
                    setAlbum(albumRes.data); // Fallback tùy cấu trúc response
                }
            } catch (albumError) {
                console.log("Chưa có album hoặc lỗi lấy album:", albumError);
                // Không toast lỗi ở đây vì đơn mới tạo sẽ chưa có album
            }

        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            toast.error("Không tìm thấy đơn hàng.");
            navigate('/my-orders');
        } finally {
            setLoading(false);
        }
    };

    // --- HELPER FUNCTIONS ---
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A';
    
    const getImageUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/150';
        return url.startsWith('http') ? url : `http://localhost:5000/${url.replace(/^\/+/, "")}`;
    };

    const getAlbumStatusText = (status) => {
        const map = {
            'draft': 'Mới tạo',
            'sent_to_customer': 'Đã gửi ảnh gốc (Chờ bạn chọn)',
            'selection_completed': 'Đã chọn ảnh (Chờ chỉnh sửa)',
            'finalized': 'Đã giao ảnh chỉnh sửa',
            'delivered': 'Hoàn tất'
        };
        return map[status] || status;
    };

    const getStepStatus = (currentStatus) => {
        const steps = [
            { key: 'pending', label: 'Đặt lịch', icon: Calendar },
            { key: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle },
            { key: 'in_progress', label: 'Chụp ảnh', icon: Camera },
            { key: 'processing', label: 'Hậu kỳ', icon: Package }, 
            { key: 'completed', label: 'Hoàn thành', icon: CheckCircle },
        ];

        let activeIndex = 0;
        if (['pending', 'pending_payment'].includes(currentStatus)) activeIndex = 0;
        else if (['confirmed', 'waiting_final_payment', 'final_payment_pending'].includes(currentStatus)) activeIndex = 1;
        else if (currentStatus === 'in_progress') activeIndex = 2;
        else if (['processing', 'delivered'].includes(currentStatus)) activeIndex = 3;
        else if (currentStatus === 'completed') activeIndex = 4;
        
        return { steps, activeIndex };
    };

    const handlePayment = () => {
        let amountToPay = order.status === 'pending_payment' ? order.deposit_required : (order.final_amount - order.deposit_required);
        let isRemaining = order.status !== 'pending_payment';
        navigate("/payment", { state: { order, transfer_code: order.payment_info?.transfer_code, deposit_required: amountToPay, is_remaining: isRemaining } });
    };

    if (loading) return <MainLayout><div className="loading-screen"><div className="spinner"></div></div></MainLayout>;
    if (!order) return null;

    const { steps, activeIndex } = getStepStatus(order.status);
    const isCancelled = ['cancelled', 'refund_pending'].includes(order.status);

    return (
        <MainLayout>
            <div className="order-detail-page">
                <div className="container">
                    {/* 1. HEADER & NAVIGATION */}
                    <div className="detail-header">
                        <button className="btn-back" onClick={() => navigate('/my-orders')}>
                            <ArrowLeft size={20}/> Quay lại
                        </button>
                        <div className="header-info">
                            <h1>Chi tiết đơn hàng <span className="highlight">#{order.order_id}</span></h1>
                            <span className="date-created">Ngày tạo: {formatDate(order.createdAt)}</span>
                        </div>
                        <div className="header-actions">
                            {/* Nếu có album, hiện nút xem nhanh */}
                            {album && (
                                <button className="btn-primary" onClick={() => navigate(`/albums/detail/${order.order_id}`)}>
                                    <ImageIcon size={18}/> Xem Album Ảnh
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 2. PROGRESS STEPPER */}
                    {!isCancelled ? (
                        <div className="order-stepper">
                            {steps.map((step, index) => (
                                <div key={index} className={`step-item ${index <= activeIndex ? 'active' : ''}`}>
                                    <div className="step-icon">
                                        <step.icon size={20} />
                                    </div>
                                    <span className="step-label">{step.label}</span>
                                    {index < steps.length - 1 && <div className="step-line"></div>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="alert-cancelled">
                            <AlertTriangle size={24} />
                            <div>
                                <h4>Đơn hàng đã bị hủy</h4>
                                <p>Lý do: {order.status_history?.find(h => h.status === 'cancelled')?.note || "Khách hàng yêu cầu hủy"}</p>
                            </div>
                        </div>
                    )}

                    <div className="detail-content-grid">
                        {/* 3. CỘT TRÁI: THÔNG TIN CHÍNH */}
                        <div className="detail-left">
                            
                            <div className="info-section">
                                <h3 className="section-title"><Package size={20}/> Thông tin gói dịch vụ</h3>
                                <div className="package-info-box">
                                    <img 
                                        src={getImageUrl(order.service_package_id?.AnhBia)} 
                                        alt={order.service_package_id?.TenGoi} 
                                        className="package-thumb"
                                    />
                                    <div className="package-text">
                                        <h4>{order.service_package_id?.TenGoi}</h4>
                                        <p className="pkg-type">{order.service_package_id?.LoaiGoi}</p>
                                        <p className="pkg-price">{formatPrice(order.final_amount)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="info-section">
                                <h3 className="section-title"><Calendar size={20}/> Thời gian & Địa điểm</h3>
                                <div className="info-row">
                                    <div className="info-col">
                                        <span className="label">Ngày chụp</span>
                                        <span className="value">{formatDate(order.booking_date)}</span>
                                    </div>
                                    <div className="info-col">
                                        <span className="label">Giờ bắt đầu</span>
                                        <span className="value">{order.start_time}</span>
                                    </div>
                                </div>
                                <div className="info-row full">
                                    <span className="label">Địa điểm</span>
                                    <span className="value flex-align">
                                        <MapPin size={16} className="text-muted"/> {order.location?.address}
                                    </span>
                                </div>
                            </div>

                            <div className="info-section">
                                <h3 className="section-title"><Camera size={20}/> Nhiếp ảnh gia</h3>
                                {order.photographer_id ? (
                                    <div className="photographer-profile">
                                        <img 
                                            src={getImageUrl(order.photographer_id.Avatar)} 
                                            alt="Avatar" 
                                            className="pg-avatar"
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/50'}
                                        />
                                        <div className="pg-details">
                                            <h4>{order.photographer_id.HoTen}</h4>
                                            <div className="pg-contact">
                                                <span><Phone size={14}/> {order.photographer_id.SoDienThoai}</span>
                                                <button className="btn-chat"><MessageSquare size={14}/> Nhắn tin</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted">Đang sắp xếp nhiếp ảnh gia...</p>
                                )}
                            </div>
                        </div>

                        {/* 4. CỘT PHẢI: THANH TOÁN & ALBUM */}
                        <div className="detail-right">
                            
                            {/* ✅ THẺ THÔNG TIN ALBUM (MỚI) */}
                            {album && (
                                <div className="album-info-card">
                                    <div className="card-header-row">
                                        <h3><Layers size={18}/> Album ảnh</h3>
                                        <span className="badge-album-status">{getAlbumStatusText(album.status)}</span>
                                    </div>
                                    
                                    <div className="album-stats">
                                        <div className="stat-item">
                                            <span className="stat-num">{album.photos?.length || 0}</span>
                                            <span className="stat-label">Ảnh gốc</span>
                                        </div>
                                        <div className="vertical-divider"></div>
                                        <div className="stat-item">
                                            <span className="stat-num highlight">{album.edited_photos?.length || 0}</span>
                                            <span className="stat-label">Đã chỉnh sửa</span>
                                        </div>
                                    </div>

                                    <button 
                                        className="btn-view-album-full" 
                                        onClick={() => navigate(`/albums/detail/${order.order_id}`)}
                                    >
                                        Truy cập Album <ExternalLink size={16}/>
                                    </button>
                                    
                                    {/* Nếu đang ở trạng thái gửi ảnh gốc, nhắc khách chọn ảnh */}
                                    {album.status === 'sent_to_customer' && (
                                        <div className="album-notice">
                                            <AlertTriangle size={14} />
                                            <span>Vui lòng chọn ảnh để thợ chỉnh sửa.</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="payment-summary-card">
                                <h3>Thanh toán</h3>
                                <div className="payment-rows">
                                    <div className="pay-row">
                                        <span>Tổng tiền dịch vụ</span>
                                        <span>{formatPrice(order.final_amount)}</span>
                                    </div>
                                    {order.travel_fee_amount > 0 && (
                                        <div className="pay-row">
                                            <span>Phí di chuyển</span>
                                            <span>{formatPrice(order.travel_fee_amount)}</span>
                                        </div>
                                    )}
                                    <div className="pay-line"></div>
                                    <div className="pay-row total">
                                        <span>Thành tiền</span>
                                        <span className="text-primary">{formatPrice(order.final_amount)}</span>
                                    </div>
                                    
                                    <div className="pay-status-box">
                                        <div className="pay-row">
                                            <span>Đã thanh toán (Cọc)</span>
                                            <span className="text-success">
                                                {order.deposit_paid ? formatPrice(order.deposit_required) : '0 đ'}
                                            </span>
                                        </div>
                                        <div className="pay-row">
                                            <span>Còn lại</span>
                                            <span className="text-danger">
                                                {order.deposit_paid 
                                                    ? formatPrice(order.final_amount - order.deposit_required) 
                                                    : formatPrice(order.final_amount)}
                                            </span>
                                        </div>
                                    </div>

                                    {(['pending_payment', 'confirmed', 'processing'].includes(order.status) && 
                                      order.payment_info?.remaining_status !== 'paid' && 
                                      order.status !== 'final_payment_pending') && (
                                        <button className="btn-pay-full" onClick={handlePayment}>
                                            <DollarSign size={18}/> 
                                            {order.status === 'pending_payment' ? 'Thanh toán Cọc ngay' : 'Thanh toán nốt'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="history-card">
                                <h3>Lịch sử đơn hàng</h3>
                                <div className="history-timeline">
                                    {order.status_history?.slice().reverse().map((hist, i) => (
                                        <div key={i} className="timeline-item">
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-content">
                                                <p className="hist-status">{hist.note || hist.status}</p>
                                                <span className="hist-time">{new Date(hist.changed_at).toLocaleString('vi-VN')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}