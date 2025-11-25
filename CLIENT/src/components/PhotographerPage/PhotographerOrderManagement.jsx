import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  Calendar, MapPin, Clock, DollarSign,
  Search, CheckCircle, XCircle, Eye,
  Briefcase, Image as ImageIcon, FolderOpen
} from 'lucide-react';

import orderApi from '../../apis/OrderService';
import Header from '../../components/Header/Header';
import Sidebar from '../../components/Sidebar/Sidebar';
import './PhotographerOrderManagement.css';

export default function PhotographerOrderManagement() {
  const { user } = useSelector(state => state.user);
  const navigate = useNavigate();

  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, income: 0 });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getPhotographerOrders();
      const data = res.data?.data || res.data || [];
      setOrders(data);
      calculateStats(data);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const pending = data.filter(o => o.status === 'pending' || o.status === 'pending_payment').length;
    const confirmed = data.filter(o => ['confirmed', 'in_progress', 'waiting_final_payment', 'final_payment_pending', 'processing'].includes(o.status)).length;
    const income = data.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.final_amount || 0), 0);
    setStats({ total: data.length, pending, confirmed, income });
  };

  // --- HÀM XỬ LÝ SỰ KIỆN ---

  const handleDeliverAlbum = (orderId) => {
    navigate(`/albums/detail/${orderId}`);
  };

  const handleViewDetail = (orderId) => {
    toast.info(`Xem chi tiết đơn: ${orderId}`);
    // navigate(`/order-detail/${orderId}`);
  };

  const handleGoToAlbumManager = () => {
    navigate('/photographer/albums-manage');
  };

  // --- FILTER & HELPERS ---

  const filteredOrders = orders.filter(order => {
    let matchesStatus = false;
    if (filterStatus === 'all') matchesStatus = true;
    else if (filterStatus === 'pending') matchesStatus = ['pending', 'pending_payment'].includes(order.status);
    else if (filterStatus === 'confirmed') matchesStatus = ['confirmed', 'in_progress', 'waiting_final_payment', 'final_payment_pending', 'processing', 'delivered'].includes(order.status);
    else if (filterStatus === 'completed') matchesStatus = order.status === 'completed';
    else if (filterStatus === 'cancelled') matchesStatus = ['cancelled', 'refund_pending'].includes(order.status);

    const customerName = order.customer_id?.HoTen || "Khách vãng lai";
    const orderId = order.order_id || "";
    const matchesSearch = orderId.toLowerCase().includes(searchTerm.toLowerCase()) || customerName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const formatPrice = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

  const getImg = (p) => p?.AnhBia ? (p.AnhBia.startsWith('http') ? p.AnhBia : `http://localhost:5000/${p.AnhBia.replace(/^\/+/, "")}`) : 'https://via.placeholder.com/150';

  const renderStatus = (status, order) => {
    if (order.payment_info?.remaining_status === 'paid' || status === 'processing') {
      return <span className="status-badge status-completed" style={{ background: '#dcfce7', color: '#15803d' }}><CheckCircle size={14} /> Hoàn thành thanh toán</span>;
    }
    switch (status) {
      case 'pending_payment': return <span className="status-badge status-pending"><Clock size={14} /> Chờ cọc</span>;
      case 'pending': return <span className="status-badge status-pending"><Clock size={14} /> Chờ duyệt cọc</span>;
      case 'confirmed': return <span className="status-badge status-confirmed"><CheckCircle size={14} /> Đã cọc (Chờ chụp)</span>;
      case 'in_progress': return <span className="status-badge status-confirmed" style={{ background: '#dbeafe', color: '#1e40af' }}>Đang chụp</span>;
      case 'waiting_final_payment': return <span className="status-badge status-pending"><DollarSign size={14} /> Chờ TT cuối</span>;
      case 'final_payment_pending': return <span className="status-badge status-pending"><DollarSign size={14} /> Chờ duyệt TT cuối</span>;
      case 'delivered': return <span className="status-badge status-confirmed" style={{ background: '#e0f2fe', color: '#0284c7' }}><ImageIcon size={14} /> Đã giao ảnh</span>;
      case 'completed': return <span className="status-badge status-completed"><CheckCircle size={14} /> Hoàn thành</span>;
      case 'cancelled':
      case 'refund_pending': return <span className="status-badge status-cancelled"><XCircle size={14} /> Đã hủy</span>;
      default: return <span className="status-badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>{status}</span>;
    }
  };

  const renderDepositStatus = (order) => {
    if (['completed', 'cancelled', 'refund_pending'].includes(order.status) || order.payment_info?.remaining_status === 'paid') return null;
    if (order.deposit_paid || order.payment_info?.deposit_status === 'paid') return <span className="deposit-tag" style={{ background: '#dcfce7', color: '#16a34a' }}>Đã cọc</span>;
    return <span className="deposit-tag" style={{ background: '#fee2e2', color: '#dc2626' }}>Chưa cọc</span>;
  };

  const canDeliverAlbum = (order) => {
    const isPaid = order.payment_info?.remaining_status === 'paid';
    const isProcessing = order.status === 'processing';
    const isDelivered = order.status === 'delivered';
    return (isPaid || isProcessing || isDelivered) && order.status !== 'cancelled' && order.status !== 'refund_pending';
  };

  return (
    <>
      <Header />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div className="photographer-order-page" style={{ flex: 1 }}>
          <div className="container">

            <div className="page-header" style={{ flexWrap: 'wrap', gap: '15px' }}>
              <div className="page-title">
                <h1>Quản lý đơn đặt</h1>
                <p>Xin chào {user?.HoTen}, đây là danh sách các lịch chụp của bạn.</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className="btn-action"
                  style={{ background: '#fff', border: '1px solid #ddd', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                  onClick={handleGoToAlbumManager}
                >
                  <FolderOpen size={18} color="#4f46e5" /> Kho Album / Job Ngoài
                </button>

                <div className="search-box" style={{ position: 'relative' }}>
                  <Search size={20} style={{ position: 'absolute', left: 10, top: 10, color: '#9ca3af' }} />
                  <input
                    type="text"
                    placeholder="Tìm mã đơn, tên khách..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '250px' }}
                  />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-info"><h3>{stats.total}</h3><p>Tổng đơn</p></div></div>
              <div className="stat-card"><div className="stat-info"><h3>{stats.pending}</h3><p>Chờ xử lý</p></div></div>
              <div className="stat-card"><div className="stat-info"><h3>{stats.confirmed}</h3><p>Đang thực hiện</p></div></div>
              <div className="stat-card"><div className="stat-info"><h3>{formatPrice(stats.income)}</h3><p>Doanh thu</p></div></div>
            </div>

            {/* Tabs */}
            <div className="filter-tabs">
              {[
                { k: 'all', l: 'Tất cả' },
                { k: 'pending', l: 'Chờ xác nhận' },
                { k: 'confirmed', l: 'Sắp tới/Đang làm' },
                { k: 'completed', l: 'Hoàn thành' },
                { k: 'cancelled', l: 'Đã hủy' }
              ].map(tab => (
                <button key={tab.k} className={`tab-btn ${filterStatus === tab.k ? 'active' : ''}`} onClick={() => setFilterStatus(tab.k)}>{tab.l}</button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>Không có đơn nào.</div>
            ) : (
              <div className="orders-grid">
                {filteredOrders.map(order => (
                  <div key={order._id} className="order-card">
                    <img src={getImg(order.service_package_id)} alt="" className="order-img" />

                    <div className="order-main-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 'bold' }}>#{order.order_id}</span>
                        {renderStatus(order.status, order)}
                      </div>

                      <h3>{order.service_package_id?.TenGoi}</h3>

                      <div className="order-meta">
                        <div className="meta-item"><Calendar size={16} /> {new Date(order.booking_date).toLocaleDateString('vi-VN')}</div>
                        <div className="meta-item"><Clock size={16} /> {order.start_time}</div>
                        <div className="meta-item"><MapPin size={16} /> {order.location?.district}</div>
                        <div className="meta-item" style={{ color: '#3b82f6', fontWeight: 600 }}><Briefcase size={16} /> {order.customer_id?.HoTen}</div>
                      </div>
                    </div>

                    <div className="order-price-col">
                      <span className="price-tag">{formatPrice(order.final_amount)}</span>
                      {renderDepositStatus(order)}
                    </div>

                    <div className="order-actions">
                      <button className="btn-action btn-view" onClick={() => handleViewDetail(order._id)}>
                        <Eye size={16} /> Chi tiết
                      </button>

                      {canDeliverAlbum(order) && (
                        <button
                          className="btn-action btn-accept"
                          style={{ background: '#8b5cf6' }}
                          onClick={() => handleDeliverAlbum(order.order_id || order._id)}
                        >
                          <ImageIcon size={16} /> {order.status === 'delivered' ? 'Xem Album' : 'Giao Album'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}