import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  FileText,
  DollarSign,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Search,
  Filter,
  Download,
  ChevronRight,
  CreditCard // ✅ Thêm icon CreditCard
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để xem đơn hàng');
      navigate('/signin', { state: { from: '/my-orders' } });
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
      console.log('📦 Orders fetched:', ordersList);
      setOrders(ordersList);
      setFilteredOrders(ordersList);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.service_package_id?.TenGoi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.location?.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending_payment: { // Thêm trạng thái chờ thanh toán
        label: 'Chờ đặt cọc',
        icon: <CreditCard size={16} />,
        className: 'status-pending-payment',
        color: '#f59e0b'
      },
      pending: {
        label: 'Chờ xác nhận',
        icon: <Clock size={16} />,
        className: 'status-pending',
        color: '#f59e0b'
      },
      confirmed: {
        label: 'Đã xác nhận',
        icon: <CheckCircle size={16} />,
        className: 'status-confirmed',
        color: '#3b82f6'
      },
      in_progress: {
        label: 'Đang thực hiện',
        icon: <RefreshCw size={16} />,
        className: 'status-progress',
        color: '#8b5cf6'
      },
      completed: {
        label: 'Hoàn thành',
        icon: <CheckCircle size={16} />,
        className: 'status-completed',
        color: '#10b981'
      },
      cancelled: {
        label: 'Đã hủy',
        icon: <XCircle size={16} />,
        className: 'status-cancelled',
        color: '#ef4444'
      }
    };
    return statusMap[status] || statusMap.pending;
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN') + ' VNĐ';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const getImageUrl = (img) => {
    if (!img) return '/no-image.jpg';
    if (img.startsWith('http')) return img;
    return `http://localhost:5000/${img.replace(/^\/+/, '')}`;
  };

  const OrderCard = ({ order }) => {
    const statusInfo = getStatusInfo(order.status);

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
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/100x60?text=No+Image';
                }}
              />
            )}
            <div className="package-details">
              <h3>{order.service_package_id?.TenGoi || 'Gói dịch vụ'}</h3>
              <p className="package-type">{order.service_package_id?.LoaiGoi}</p>
            </div>
          </div>

          <div className="order-info-grid">
            <div className="info-item">
              <Calendar size={16} />
              <div>
                <span className="info-label">Ngày đặt:</span>
                <span className="info-value">{formatDate(order.booking_date).split(',')[0]}</span>
              </div>
            </div>

            <div className="info-item">
              <DollarSign size={16} />
              <div>
                <span className="info-label">Tổng tiền:</span>
                <span className="info-value price">{formatPrice(order.final_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="order-card-footer">
          <button
            className="btn-view-detail"
            onClick={() => handleViewDetail(order)}
          >
            <Eye size={18} />
            Xem chi tiết
            <ChevronRight size={16} />
          </button>
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
          <div className="modal-header">
            <h2>Chi tiết đơn hàng</h2>
            <button
              className="btn-close-modal"
              onClick={() => setShowDetailModal(false)}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            {/* THÔNG TIN CHUNG */}
            <div className="detail-section">
              <div className="section-title">
                <Package size={20} />
                <h3>Thông tin chung</h3>
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Mã đơn hàng:</span>
                  <span className="value font-bold">{selectedOrder.order_id}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Trạng thái:</span>
                  <span className={`value ${statusInfo.className}`}>
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Ngày book lịch:</span>
                  <span className="value">{formatDate(selectedOrder.booking_date)}</span>
                </div>
              </div>
            </div>

            {/* GÓI DỊCH VỤ */}
            <div className="detail-section">
              <div className="section-title">
                <Package size={20} />
                <h3>Dịch vụ sử dụng</h3>
              </div>
              <div className="package-detail-card">
                {selectedOrder.service_package_id?.AnhBia && (
                  <img
                    src={getImageUrl(selectedOrder.service_package_id.AnhBia)}
                    alt={selectedOrder.service_package_id?.TenGoi}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                  />
                )}
                <div className="package-detail-content">
                    <h4>{selectedOrder.service_package_id?.TenGoi}</h4>
                    <p>{selectedOrder.service_package_id?.MoTa}</p>
                </div>
              </div>
            </div>

            {/* ĐỊA ĐIỂM */}
            <div className="detail-section">
              <div className="section-title">
                <MapPin size={20} />
                <h3>Địa điểm chụp</h3>
              </div>
              <div className="location-detail">
                <p><strong>Địa chỉ:</strong> {selectedOrder.location?.address || 'N/A'}</p>
                <p><strong>Khu vực:</strong> {selectedOrder.location?.district} - {selectedOrder.location?.city}</p>
                {selectedOrder.location?.map_link && (
                  <a href={selectedOrder.location.map_link} target="_blank" rel="noopener noreferrer" className="btn-map-link">
                    <MapPin size={14} /> Xem trên bản đồ
                  </a>
                )}
              </div>
            </div>

            {/* ✅ MỚI: THÔNG TIN THANH TOÁN & CỌC */}
            <div className="detail-section">
              <div className="section-title">
                <CreditCard size={20} />
                <h3>Thanh toán & Đặt cọc</h3>
              </div>
              <div className="payment-detail">
                {/* Dòng Tổng tiền */}
                <div className="payment-row">
                  <span>Tổng giá trị đơn hàng:</span>
                  <span className="font-bold text-lg">{formatPrice(selectedOrder.final_amount)}</span>
                </div>

                <div className="divider"></div>

                {/* Thông tin Cọc */}
                <div className="deposit-info-box">
                    <div className="payment-row">
                        <span>Số tiền cọc yêu cầu (30%):</span>
                        <span className="font-bold text-orange-600">{formatPrice(selectedOrder.deposit_required)}</span>
                    </div>
                    
                    {selectedOrder.payment_info?.transaction_code && (
                        <div className="payment-row">
                            <span>Mã giao dịch / Nội dung CK:</span>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{selectedOrder.payment_info.transaction_code}</span>
                        </div>
                    )}

                    <div className="payment-row">
                        <span>Trạng thái cọc:</span>
                        {selectedOrder.status === 'pending_payment' ? (
                            <span className="status-badge pending">Chưa thanh toán</span>
                        ) : (
                            <span className="status-badge paid">Đã gửi minh chứng</span>
                        )}
                    </div>

                    {/* ✅ Hiển thị ảnh minh chứng nếu có */}
                    {selectedOrder.payment_info?.transfer_image && (
                        <div className="proof-image-section">
                            <p className="label">Ảnh minh chứng chuyển khoản:</p>
                            <div className="proof-image-wrapper" onClick={() => window.open(getImageUrl(selectedOrder.payment_info.transfer_image), '_blank')}>
                                <img 
                                    src={getImageUrl(selectedOrder.payment_info.transfer_image)} 
                                    alt="Minh chứng thanh toán" 
                                />
                                <div className="overlay">
                                    <Eye size={20} color="white"/>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
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
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
              Làm mới
            </button>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn, gói dịch vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="status-filters">
              <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>Tất cả</button>
              <button className={`filter-btn ${statusFilter === 'pending_payment' ? 'active' : ''}`} onClick={() => setStatusFilter('pending_payment')}>Chờ cọc</button>
              <button className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>Chờ xác nhận</button>
              <button className={`filter-btn ${statusFilter === 'confirmed' ? 'active' : ''}`} onClick={() => setStatusFilter('confirmed')}>Đã xác nhận</button>
              <button className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`} onClick={() => setStatusFilter('completed')}>Hoàn thành</button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải đơn hàng...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <Package size={64} />
              <h3>Chưa có đơn hàng nào</h3>
              <p>Bạn chưa đặt dịch vụ nào. Hãy khám phá các gói dịch vụ của chúng tôi!</p>
              <button className="btn-browse" onClick={() => navigate('/service-packages')}>
                Xem gói dịch vụ
              </button>
            </div>
          ) : (
            <div className="orders-grid">
              {filteredOrders.map((order) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showDetailModal && <OrderDetailModal />}

      <Footer />
    </>
  );
}