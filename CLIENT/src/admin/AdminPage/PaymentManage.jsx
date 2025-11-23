import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

import SidebarAdmin from "./SidebarAdmin";
import HeaderAdmin from "./HeaderAdmin";
import "./PaymentManage.css";

import {
  CheckCircle2,
  PlusCircle,
  Trash2,
  Edit2,
  Save,
  Search,
  XCircle
} from "lucide-react";

import paymentMethodService from "../../apis/paymentMethodService";
import adminAuthService from "../../apis/adminAuthService";
import adminOrderService from "../../apis/adminOrderService";

export default function PaymentManage() {
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  // Map màu sắc trạng thái
  const statusColors = {
    "pending_payment": "warning",
    "pending": "info",
    "confirmed": "success",
    "in_progress": "primary",
    "final_payment_pending": "warning",
    "completed": "success",
    "cancelled": "danger"
  };

  const statusLabels = {
    "pending_payment": "Chờ cọc",
    "pending": "Chờ duyệt cọc",
    "confirmed": "Đã xác nhận",
    "in_progress": "Đang thực hiện",
    "final_payment_pending": "Chờ thanh toán cuối",
    "completed": "Hoàn thành",
    "cancelled": "Đã hủy"
  };

  useEffect(() => {
    adminAuthService.initAutoRefresh();
    fetchData();
  }, []);

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Logic lọc danh sách (Tìm theo Mã đơn, Tên khách, Dịch vụ)
  const filteredPayments = payments.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.displayId?.toLowerCase().includes(term) ||
      p.customer?.toLowerCase().includes(term) ||
      p.service?.toLowerCase().includes(term)
    );
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Payment Methods
      const methodsRes = await paymentMethodService.getAllPaymentMethods();
      const methodsList = Array.isArray(methodsRes) ? methodsRes : (methodsRes?.data || []);

      const formattedMethods = methodsList.map((method) => ({
        id: method._id,
        fullName: method.fullName,
        accountNumber: method.accountNumber,
        bank: method.bank,
        branch: method.branch || "",
        isActive: method.isActive,
        editing: false,
      }));
      setPaymentMethods(formattedMethods);

      // 2. Orders (API Thật)
      const ordersRes = await adminOrderService.getAllOrders();
      const rawOrders = ordersRes.data?.data || ordersRes.data || [];

      const formattedOrders = rawOrders.map((order) => {
        const customerName = order.customer_id?.full_name || order.customer_id?.email || "Khách hàng";
        const serviceName = order.service_package_id?.name || "Gói dịch vụ";

        return {
          id: order._id,
          displayId: order.order_id,
          customer: customerName,
          service: serviceName,
          amount: formatCurrency(order.final_amount),
          date: formatDate(order.createdAt),
          status: order.status,
          rawStatus: order.status
        };
      });

      setPayments(formattedOrders);

    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Lỗi khi tải dữ liệu đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // --- PAYMENT METHODS LOGIC ---
  const addPaymentMethod = () => {
    const newId = `temp-${Date.now()}`;
    setPaymentMethods((prev) => [
      ...prev,
      { id: newId, fullName: "", accountNumber: "", bank: "", branch: "", isActive: true, editing: true, isNew: true },
    ]);
  };

  const removePaymentMethod = async (id) => {
    const method = paymentMethods.find((m) => m.id === id);
    if (!method) return;
    if (method.isNew) {
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      return;
    }
    if (!window.confirm("Bạn có chắc muốn xóa phương thức này?")) return;
    try {
      await paymentMethodService.deletePaymentMethod(id);
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success("Đã xóa phương thức thanh toán");
    } catch (error) {
      toast.error("Lỗi khi xóa phương thức");
    }
  };

  const handleMethodChange = (id, field, value) => {
    setPaymentMethods((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const toggleEdit = async (id) => {
    const method = paymentMethods.find((m) => m.id === id);
    if (!method) return;
    if (method.editing) {
      if (!method.fullName || !method.accountNumber || !method.bank) {
        return toast.error("Vui lòng nhập: Tên, Số TK, Ngân hàng");
      }
      try {
        const payload = { fullName: method.fullName, accountNumber: method.accountNumber, bank: method.bank, branch: method.branch || "", isActive: method.isActive };
        let res;
        if (method.isNew) {
          res = await paymentMethodService.createPaymentMethod(payload);
          toast.success("Đã tạo phương thức mới");
        } else {
          res = await paymentMethodService.updatePaymentMethod(id, payload);
          toast.success("Đã cập nhật thành công");
        }
        const updatedData = res?.data || res || {}; 
        setPaymentMethods((prev) => prev.map((m) => m.id === id ? { ...m, id: updatedData._id || m.id, editing: false, isNew: false } : m));
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi lưu dữ liệu");
      }
    } else {
      setPaymentMethods((prev) => prev.map((m) => (m.id === id ? { ...m, editing: true } : m)));
    }
  };

  // --- ORDERS LOGIC ---
  const openConfirmModal = (id) => {
    setSelectedPaymentId(id);
    setModalOpen(true);
  };

  const confirmOrderPayment = async () => {
    try {
      await adminOrderService.approveOrderManually(selectedPaymentId);
      setPayments((prev) => prev.map((p) => p.id === selectedPaymentId ? { ...p, status: "confirmed" } : p));
      toast.success("Đã xác nhận thanh toán đơn hàng");
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật đơn hàng: " + (error.response?.data?.message || "Lỗi Server"));
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />

        <div className="page-header">
          <h2>Quản lý Thanh toán</h2>
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={fetchData}>Thử lại</button>
          </div>
        )}

        {/* --- PHẦN PAYMENT METHODS --- */}
        <button className="btn add-method" onClick={addPaymentMethod}>
          <PlusCircle size={20} /> Thêm phương thức thanh toán
        </button>

        <div className="payment-methods-section">
          <h3 className="section-title">Phương thức thanh toán ({paymentMethods.length})</h3>
          <p className="text-muted mb-3">Nhập đúng <strong>Mã Ngân hàng</strong> (VD: MB, VCB, TCB) để mã QR hiển thị chính xác.</p>
          
          <div className="cards-container">
            {paymentMethods.map((m) => (
              <div key={m.id} className={`payment-card ${!m.isActive ? "inactive-mode" : ""}`}>
                <div className="card-header">
                  <strong className="card-title">
                    {m.fullName || "Tài khoản mới"}
                    {!m.isActive && <span className="inactive-tag">(Đã ẩn)</span>}
                  </strong>
                  <div className="card-icons">
                    {m.editing ? (
                      <Save size={20} className="icon-save" onClick={() => toggleEdit(m.id)} />
                    ) : (
                      <Edit2 size={20} className="icon-edit" onClick={() => toggleEdit(m.id)} />
                    )}
                    <Trash2 size={20} className="icon-trash" onClick={() => removePaymentMethod(m.id)} />
                  </div>
                </div>

                <div className="card-body">
                  <div className="form-toggle">
                    <label>Trạng thái hoạt động:</label>
                    <label className="switch">
                      <input 
                        type="checkbox" checked={m.isActive} disabled={!m.editing}
                        onChange={(e) => handleMethodChange(m.id, "isActive", e.target.checked)} 
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Họ tên chủ thẻ *</label>
                    <input type="text" value={m.fullName} readOnly={!m.editing} 
                      placeholder="VD: NGUYEN VAN A"
                      onChange={(e) => handleMethodChange(m.id, "fullName", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Số tài khoản *</label>
                    <input type="text" value={m.accountNumber} readOnly={!m.editing} 
                      placeholder="VD: 0123456789"
                      onChange={(e) => handleMethodChange(m.id, "accountNumber", e.target.value)} />
                  </div>
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Mã Ngân hàng *</label>
                      <input type="text" value={m.bank} readOnly={!m.editing} 
                        placeholder="VD: MB, VCB"
                        onChange={(e) => handleMethodChange(m.id, "bank", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Chi nhánh</label>
                      <input type="text" value={m.branch} readOnly={!m.editing} 
                        placeholder="Tùy chọn"
                        onChange={(e) => handleMethodChange(m.id, "branch", e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- ORDERS LIST VỚI THANH TÌM KIẾM Ở GIỮA --- */}
        <div className="orders-section">
          <div className="orders-header">
            {/* 1. Title bên trái */}
            <h3 className="section-title">Duyệt thanh toán đơn hàng</h3>
            
            {/* 2. Thanh tìm kiếm ở giữa */}
            <div className="search-container">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Tìm mã đơn hoặc khách hàng..."
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

            {/* 3. Khoảng trống bên phải để cân bằng */}
            <div className="header-spacer"></div>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Dịch vụ</th>
                  <th>Tổng tiền</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                    <tr><td colSpan="7" className="text-center">
                        {searchTerm ? "Không tìm thấy kết quả phù hợp" : "Chưa có đơn hàng nào"}
                    </td></tr>
                ) : (
                    filteredPayments.map((p) => (
                    <tr key={p.id}>
                        <td>#{p.displayId}</td>
                        <td>{p.customer}</td>
                        <td>{p.service}</td>
                        <td className="price-text">{p.amount}</td>
                        <td>{p.date}</td>
                        <td>
                        <span className={`status-badge ${statusColors[p.status] || 'default'}`}>
                            {statusLabels[p.status] || p.status}
                        </span>
                        </td>
                        <td>
                        {(p.status === "pending" || p.status === "final_payment_pending") ? (
                            <button className="btn-verify" onClick={() => openConfirmModal(p.id)}>
                            <CheckCircle2 size={16} /> Xác nhận
                            </button>
                        ) : (
                            <span className="text-muted">-</span>
                        )}
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL CONFIRM */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header confirm">
                <CheckCircle2 size={40} />
                <h3>Xác nhận thanh toán</h3>
              </div>
              <p>Bạn xác nhận đã nhận đủ tiền cho đơn hàng?</p>
              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => setModalOpen(false)}>Hủy</button>
                <button className="btn-confirm" onClick={confirmOrderPayment}>Đồng ý</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}