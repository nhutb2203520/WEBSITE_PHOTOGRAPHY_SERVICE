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
  ChevronRight
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
      day: '2-digit'
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
                <span className="info-value">{formatDate(order.booking_date)}</span>
              </div>
            </div>

            <div className="info-item">
              <Clock size={16} />
              <div>
                <span className="info-label">Giờ bắt đầu:</span>
                <span className="info-value">{order.start_time}</span>
              </div>
            </div>

            <div className="info-item">
              <MapPin size={16} />
              <div>
                <span className="info-label">Địa điểm:</span>
                <span className="info-value">{order.location?.address || 'N/A'}</span>
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

          {order.photographer_id && (
            <div className="photographer-info">
              <User size={16} />
              <span>Photographer: {order.photographer_id.HoTen || 'Chưa phân công'}</span>
            </div>
          )}
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
            <div className="detail-section">
              <div className="section-title">
                <Package size={20} />
                <h3>Thông tin đơn hàng</h3>
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Mã đơn hàng:</span>
                  <span className="value">{selectedOrder.order_id}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Trạng thái:</span>
                  <span className={`value ${statusInfo.className}`}>
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Ngày đặt:</span>
                  <span className="value">{formatDate(selectedOrder.booking_date)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Giờ bắt đầu:</span>
                  <span className="value">{selectedOrder.start_time}</span>
                </div>
                {selectedOrder.completion_date && (
                  <div className="detail-item">
                    <span className="label">Ngày hoàn thành dự kiến:</span>
                    <span className="value">{formatDate(selectedOrder.completion_date)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <div className="section-title">
                <Package size={20} />
                <h3>Gói dịch vụ</h3>
              </div>
              <div className="package-detail-card">
                {selectedOrder.service_package_id?.AnhBia && (
                  <img
                    src={getImageUrl(selectedOrder.service_package_id.AnhBia)}
                    alt={selectedOrder.service_package_id?.TenGoi}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                )}
                <h4>{selectedOrder.service_package_id?.TenGoi}</h4>
                <p>{selectedOrder.service_package_id?.MoTa}</p>
              </div>
            </div>

            {selectedOrder.guest_times?.length > 0 && (
              <div className="detail-section">
                <div className="section-title">
                  <Clock size={20} />
                  <h3>Khung giờ tiếp khách</h3>
                </div>
                <div className="guest-times-list">
                  {selectedOrder.guest_times.map((time, idx) => (
                    <span key={idx} className="guest-time-badge">
                      <Clock size={14} /> {time}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-section">
              <div className="section-title">
                <MapPin size={20} />
                <h3>Địa điểm</h3>
              </div>
              <div className="location-detail">
                <p><strong>Tên địa điểm:</strong> {selectedOrder.location?.name || 'N/A'}</p>
                <p><strong>Địa chỉ:</strong> {selectedOrder.location?.address || 'N/A'}</p>
                <p><strong>Quận/Huyện:</strong> {selectedOrder.location?.district || 'N/A'}</p>
                <p><strong>Thành phố:</strong> {selectedOrder.location?.city || 'N/A'}</p>
                {selectedOrder.location?.map_link && (
                  <a
                    href={selectedOrder.location.map_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-map-link"
                  >
                    <MapPin size={16} /> Xem trên bản đồ
                  </a>
                )}
              </div>
            </div>

            {(selectedOrder.notes || selectedOrder.special_requests) && (
              <div className="detail-section">
                <div className="section-title">
                  <FileText size={20} />
                  <h3>Ghi chú</h3>
                </div>
                {selectedOrder.notes && (
                  <div className="note-box">
                    <strong>Ghi chú:</strong>
                    <p>{selectedOrder.notes}</p>
                  </div>
                )}
                {selectedOrder.special_requests && (
                  <div className="note-box">
                    <strong>Yêu cầu đặc biệt:</strong>
                    <p>{selectedOrder.special_requests}</p>
                  </div>
                )}
              </div>
            )}

            <div className="detail-section">
              <div className="section-title">
                <DollarSign size={20} />
                <h3>Thông tin thanh toán</h3>
              </div>
              <div className="payment-detail">
                <div className="payment-row">
                  <span>Tổng tiền:</span>
                  <span>{formatPrice(selectedOrder.total_amount)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="payment-row discount">
                    <span>Giảm giá:</span>
                    <span>-{formatPrice(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="payment-row total">
                  <span>Thành tiền:</span>
                  <span>{formatPrice(selectedOrder.final_amount)}</span>
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
              <button
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Tất cả
              </button>
              <button
                className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                Chờ xác nhận
              </button>
              <button
                className={`filter-btn ${statusFilter === 'confirmed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('confirmed')}
              >
                Đã xác nhận
              </button>
              <button
                className={`filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setStatusFilter('in_progress')}
              >
                Đang thực hiện
              </button>
              <button
                className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                Hoàn thành
              </button>
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