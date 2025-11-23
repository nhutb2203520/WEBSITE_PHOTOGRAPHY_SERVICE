import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SidebarAdmin from "./SidebarAdmin";
import HeaderAdmin from "./HeaderAdmin";
import "./OrderManage.css"; // Sử dụng chung CSS với trang Payment
import { 
  CheckCircle2, 
  DollarSign, 
  Search, 
  XCircle
} from "lucide-react";

import adminOrderService from "../../apis/adminOrderService";

export default function OrderManage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, completed, settled, unsettled

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
      const rawOrders = res.data?.data || [];
      setOrders(rawOrders);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Lỗi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ QUYẾT TOÁN CHO THỢ ---
  const handleSettlePayment = async (orderId, earning, photographerName) => {
    const confirmMsg = `Xác nhận chuyển khoản ${formatCurrency(earning)} cho nhiếp ảnh gia ${photographerName}?`;
    if(!window.confirm(confirmMsg)) return;

    try {
      await adminOrderService.settleForPhotographer(orderId);
      
      // Cập nhật UI ngay lập tức (Optimistic Update)
      setOrders(prev => prev.map(o => 
        o._id === orderId ? { ...o, settlement_status: 'paid' } : o
      ));
      toast.success("Đã quyết toán thành công!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi quyết toán");
    }
  };

  // --- LỌC DỮ LIỆU ---
  const filteredOrders = orders.filter((order) => {
    // 1. Lọc theo Search (Mã đơn, Tên khách, Email)
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      order.order_id?.toLowerCase().includes(term) || 
      order.customer_id?.full_name?.toLowerCase().includes(term) ||
      order.customer_id?.email?.toLowerCase().includes(term);

    // 2. Lọc theo Tab trạng thái
    if (filterStatus === "all") return matchSearch;
    
    // Đơn đã hoàn thành (Khách hài lòng)
    if (filterStatus === "completed") return matchSearch && order.status === "completed";
    
    // Đã trả tiền thợ
    if (filterStatus === "settled") return matchSearch && order.settlement_status === "paid";
    
    // Chờ quyết toán (Đơn xong nhưng chưa trả tiền thợ)
    if (filterStatus === "unsettled") return matchSearch && order.status === "completed" && order.settlement_status !== "paid";
    
    return matchSearch;
  });

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />
        
        <div className="page-header">
          <h2>Quản lý Đơn hàng & Quyết toán</h2>
        </div>

        {/* --- BỘ LỌC TRẠNG THÁI (TABS) --- */}
        <div className="filter-tabs" style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
            <button 
                className={`btn ${filterStatus === 'all' ? 'add-method' : 'btn-cancel'}`} 
                onClick={() => setFilterStatus('all')}
            >
                Tất cả đơn
            </button>
            <button 
                className={`btn ${filterStatus === 'completed' ? 'add-method' : 'btn-cancel'}`} 
                onClick={() => setFilterStatus('completed')}
            >
                Đã hoàn thành
            </button>
            <button 
                className={`btn ${filterStatus === 'unsettled' ? 'add-method' : 'btn-cancel'}`} 
                onClick={() => setFilterStatus('unsettled')}
                style={filterStatus === 'unsettled' ? {backgroundColor: '#ea580c'} : {}}
            >
                Cần quyết toán
            </button>
            <button 
                className={`btn ${filterStatus === 'settled' ? 'add-method' : 'btn-cancel'}`} 
                onClick={() => setFilterStatus('settled')}
                style={filterStatus === 'settled' ? {backgroundColor: '#059669'} : {}}
            >
                Đã trả thợ
            </button>
        </div>

        <div className="orders-section">
          <div className="orders-header">
            <h3 className="section-title">Danh sách đơn hàng</h3>
            
            {/* Thanh tìm kiếm ở giữa */}
            <div className="search-container">
                <div className="search-box">
                    <input 
                        type="text" 
                        placeholder="Tìm mã đơn, tên khách..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                    <Search size={18} className="search-icon" />
                    {searchTerm && (
                      <XCircle 
                        size={16} 
                        className="clear-icon" 
                        onClick={() => setSearchTerm("")}
                      />
                    )}
                </div>
            </div>
            <div className="header-spacer"></div>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày chụp</th>
                  <th>Tổng thu (Khách)</th>
                  <th>Phí sàn thu</th>
                  <th>Thực trả Thợ</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                    <tr><td colSpan="8" className="text-center">Không tìm thấy đơn hàng nào</td></tr>
                ) : (
                    filteredOrders.map((order) => {
                        const photographerName = order.photographer_id?.full_name || "Photographer";
                        const platformFee = order.platform_fee?.amount || 0;
                        const feePercent = order.platform_fee?.percentage || 0;
                        
                        // Nếu chưa có field photographer_earning trong DB cũ, tự tính tạm
                        const earning = order.photographer_earning || (order.final_amount - platformFee);

                        return (
                        <tr key={order._id}>
                            <td style={{fontWeight: 'bold'}}>#{order.order_id}</td>
                            <td>
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span style={{fontWeight: 500}}>{order.customer_id?.full_name || "Khách vãng lai"}</span>
                                    <span className="text-muted" style={{fontSize: '11px'}}>{order.service_package_id?.name}</span>
                                </div>
                            </td>
                            <td>{formatDate(order.booking_date)}</td>
                            
                            {/* Cột Tiền */}
                            <td className="text-success" style={{fontWeight: 500}}>
                                {formatCurrency(order.total_amount)}
                            </td>
                            <td className="text-danger" style={{fontSize: '13px'}}>
                                -{formatCurrency(platformFee)} <br/>
                                <span style={{color: '#999'}}>({feePercent}%)</span>
                            </td>
                            <td style={{color: '#2563eb', fontWeight: 'bold', fontSize: '15px'}}>
                                {formatCurrency(earning)}
                            </td>
                            
                            {/* Trạng thái */}
                            <td>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                    {/* Trạng thái đơn */}
                                    <span className={`status-badge ${order.status === 'completed' ? 'success' : 'default'}`}>
                                        {order.status === 'completed' ? 'Hoàn thành' : order.status}
                                    </span>
                                    
                                    {/* Trạng thái tiền thợ */}
                                    {order.settlement_status === 'paid' ? (
                                        <span className="status-badge success" style={{border: '1px solid green', backgroundColor: '#f0fdf4'}}>
                                            Đã trả thợ
                                        </span>
                                    ) : (
                                        <span className="status-badge warning">Chưa trả thợ</span>
                                    )}
                                </div>
                            </td>

                            {/* Nút hành động */}
                            <td>
                            {order.status === 'completed' && order.settlement_status !== 'paid' ? (
                                <button 
                                    className="btn-verify" 
                                    style={{backgroundColor: '#2563eb', width: '100%', justifyContent: 'center'}}
                                    onClick={() => handleSettlePayment(order._id, earning, photographerName)}
                                    title="Chuyển tiền cho thợ"
                                >
                                <DollarSign size={16} /> Thanh toán
                                </button>
                            ) : order.settlement_status === 'paid' ? (
                                <span className="text-muted" style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px'}}>
                                    <CheckCircle2 size={16} color="green"/> Đã xong
                                </span>
                            ) : (
                                <span className="text-muted" style={{fontSize: '12px', fontStyle: 'italic'}}>
                                    Đợi hoàn thành
                                </span>
                            )}
                            </td>
                        </tr>
                    )})
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}