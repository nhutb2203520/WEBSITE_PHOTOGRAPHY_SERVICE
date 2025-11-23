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
  XCircle,
  DollarSign,
  Clock
} from "lucide-react";

import paymentMethodService from "../../apis/paymentMethodService";
import adminAuthService from "../../apis/adminAuthService";
import adminOrderService from "../../apis/adminOrderService";

export default function PaymentManage() {
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State cho modal xác nhận
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Map màu sắc trạng thái
  const statusColors = {
    "pending_payment": "warning",       // Chờ khách chuyển cọc
    "pending": "info",                  // Khách đã chuyển cọc -> Cần Admin duyệt
    "confirmed": "success",             // Đã cọc -> Chờ chụp/Thanh toán nốt
    "final_payment_pending": "warning", // Khách đã chuyển nốt -> Cần Admin duyệt
    "completed": "success",             // Hoàn thành
    "cancelled": "danger"
  };

  const statusLabels = {
    "pending_payment": "Chờ cọc",
    "pending": "Chờ duyệt cọc",
    "confirmed": "Đã cọc (Chờ chụp)",
    "final_payment_pending": "Chờ duyệt TT cuối",
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
        // ✅ FIX: Lấy tên khách hàng & gói dịch vụ (Ưu tiên các trường thường dùng)
        const customerName = 
            order.customer_id?.HoTen || 
            order.customer_id?.full_name || 
            order.customer_id?.TenDangNhap || 
            "Khách hàng";
            
        const serviceName = 
            order.service_package_id?.TenGoi || 
            order.service_package_id?.name || 
            "Gói dịch vụ";

        // Tính toán tiền
        const deposit = order.deposit_required || 0;
        const total = order.final_amount || 0;
        const remaining = total - deposit;

        return {
          id: order._id,
          displayId: order.order_id,
          customer: customerName,
          service: serviceName,
          
          totalAmount: formatCurrency(total),
          depositAmount: formatCurrency(deposit),
          remainingAmount: formatCurrency(remaining),
          
          date: formatDate(order.createdAt),
          status: order.status,
          rawStatus: order.status // Lưu trạng thái gốc để xử lý logic
        };
      });

      // Sắp xếp: Đưa các đơn cần duyệt lên đầu (pending, final_payment_pending)
      const sortedOrders = formattedOrders.sort((a, b) => {
         const priority = { 'pending': 1, 'final_payment_pending': 1, 'confirmed': 2, 'completed': 3 };
         const scoreA = priority[a.rawStatus] || 99;
         const scoreB = priority[b.rawStatus] || 99;
         return scoreA - scoreB;
      });

      setPayments(sortedOrders);

    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Lỗi khi tải dữ liệu đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC XÁC NHẬN THANH TOÁN ---
  const openConfirmModal = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const confirmOrderPayment = async () => {
    if (!selectedOrder) return;

    try {
      let nextStatus = "";
      let successMessage = "";

      // Logic chuyển trạng thái
      if (selectedOrder.rawStatus === "pending") {
         // Đang chờ duyệt cọc -> Chuyển thành ĐÃ CỌC
         nextStatus = "confirmed";
         successMessage = "Đã xác nhận tiền cọc. Đơn hàng chuyển sang 'Đã cọc'.";
      } else if (selectedOrder.rawStatus === "final_payment_pending") {
         // Đang chờ duyệt cuối -> Chuyển thành HOÀN THÀNH
         nextStatus = "completed";
         successMessage = "Đã xác nhận thanh toán đủ. Đơn hàng hoàn thành!";
      } else {
         toast.warning("Trạng thái đơn hàng không hợp lệ để xác nhận.");
         return;
      }

      // Gọi API cập nhật (Sử dụng hàm approveOrderManually hoặc updateOrderStatus)
      // Ở đây dùng updateOrderStatus để linh hoạt status
      await adminOrderService.updateOrderStatus(selectedOrder.id, nextStatus, "Admin xác nhận thanh toán");
      
      // Cập nhật UI
      setPayments((prev) =>
        prev.map((p) =>
          p.id === selectedOrder.id ? { ...p, status: nextStatus, rawStatus: nextStatus } : p
        )
      );
      
      toast.success(successMessage);
      setModalOpen(false);
      
      // Reload lại để cập nhật đầy đủ dữ liệu nếu cần
      fetchData();

    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật đơn hàng: " + (error.response?.data?.message || "Lỗi Server"));
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

  // Logic lọc danh sách
  const filteredPayments = payments.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.displayId?.toLowerCase().includes(term) ||
      p.customer?.toLowerCase().includes(term) ||
      p.service?.toLowerCase().includes(term)
    );
  });

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />

        <div className="page-header">
          <h2>Quản lý Thanh toán</h2>
        </div>

        {/* --- PHẦN PAYMENT METHODS --- */}
        <button className="btn add-method" onClick={addPaymentMethod}>
          <PlusCircle size={20} /> Thêm phương thức thanh toán
        </button>

        <div className="payment-methods-section">
          <h3 className="section-title">Phương thức thanh toán ({paymentMethods.length})</h3>
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
                    <label>Trạng thái:</label>
                    <label className="switch">
                      <input type="checkbox" checked={m.isActive} disabled={!m.editing} onChange={(e) => handleMethodChange(m.id, "isActive", e.target.checked)} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Chủ thẻ *</label>
                    <input type="text" value={m.fullName} readOnly={!m.editing} placeholder="VD: NGUYEN VAN A" onChange={(e) => handleMethodChange(m.id, "fullName", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Số tài khoản *</label>
                    <input type="text" value={m.accountNumber} readOnly={!m.editing} placeholder="VD: 0123456789" onChange={(e) => handleMethodChange(m.id, "accountNumber", e.target.value)} />
                  </div>
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Ngân hàng *</label>
                      <input type="text" value={m.bank} readOnly={!m.editing} placeholder="VD: MB, VCB" onChange={(e) => handleMethodChange(m.id, "bank", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Chi nhánh</label>
                      <input type="text" value={m.branch} readOnly={!m.editing} placeholder="Tùy chọn" onChange={(e) => handleMethodChange(m.id, "branch", e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- ORDERS LIST --- */}
        <div className="orders-section">
          <div className="orders-header">
            <h3 className="section-title">Duyệt thanh toán đơn hàng</h3>
            <div className="search-container">
                <div className="search-box">
                    <input type="text" placeholder="Tìm mã đơn, khách hàng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <Search size={18} className="search-icon" />
                    {searchTerm && <XCircle size={16} className="clear-icon" onClick={() => setSearchTerm("")} />}
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
                  <th>Gói dịch vụ</th>
                  <th>Tiền cọc (30%)</th>
                  <th>Tổng tiền</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.displayId}</td>
                    <td>{p.customer}</td>
                    <td>{p.service}</td>
                    <td className="font-bold text-blue-600">{p.depositAmount}</td>
                    <td className="price-text">{p.totalAmount}</td>
                    <td>{p.date}</td>
                    <td>
                      <span className={`status-badge ${statusColors[p.rawStatus] || 'default'}`}>
                        {statusLabels[p.rawStatus] || p.status}
                      </span>
                    </td>
                    <td>
                      {/* Nút Xác nhận cho 2 trường hợp: Duyệt cọc & Duyệt thanh toán cuối */}
                      {(p.rawStatus === "pending") ? (
                        <button className="btn-verify" onClick={() => openConfirmModal(p)}>
                          <CheckCircle2 size={16} /> Duyệt cọc
                        </button>
                      ) : (p.rawStatus === "final_payment_pending") ? (
                        <button className="btn-verify" style={{backgroundColor: '#059669'}} onClick={() => openConfirmModal(p)}>
                          <DollarSign size={16} /> Duyệt TT cuối
                        </button>
                      ) : (
                        <span className="text-muted text-xs">{p.rawStatus === 'completed' ? 'Đã hoàn tất' : '-'}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                    <tr><td colSpan="8" className="text-center">Không tìm thấy dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL CONFIRM */}
        {modalOpen && selectedOrder && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header confirm">
                <CheckCircle2 size={40} />
                <h3>Xác nhận thanh toán</h3>
              </div>
              
              <div className="modal-body text-center mb-4">
                  <p>Bạn đang xác nhận thanh toán cho đơn hàng <strong>#{selectedOrder.displayId}</strong></p>
                  
                  {selectedOrder.rawStatus === 'pending' && (
                      <div className="alert-box info mt-2 p-2 bg-blue-50 text-blue-700 rounded">
                          Đang duyệt: <strong>Tiền Cọc ({selectedOrder.depositAmount})</strong>
                          <br/>Trạng thái sau duyệt: <strong>Đã cọc</strong>
                      </div>
                  )}

                  {selectedOrder.rawStatus === 'final_payment_pending' && (
                      <div className="alert-box success mt-2 p-2 bg-green-50 text-green-700 rounded">
                          Đang duyệt: <strong>Thanh toán còn lại ({selectedOrder.remainingAmount})</strong>
                          <br/>Trạng thái sau duyệt: <strong>Hoàn thành</strong>
                      </div>
                  )}
              </div>

              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => setModalOpen(false)}>Hủy</button>
                <button className="btn-confirm" onClick={handleConfirm}>Đồng ý</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}