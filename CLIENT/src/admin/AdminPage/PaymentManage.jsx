import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // ✅ Sử dụng Portal để đưa Modal ra ngoài cùng
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
  Wallet,
  Eye,
  AlertOctagon,
  ArrowLeft,
  MessageSquareWarning
} from "lucide-react";

import paymentMethodService from "../../apis/paymentMethodService";
import adminAuthService from "../../apis/adminAuthService";
import adminOrderService from "../../apis/adminOrderService";

export default function PaymentManage() {
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- STATE MODAL ---
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // --- STATE FORM ---
  const [actionStep, setActionStep] = useState('view');
  const [rejectionReason, setRejectionReason] = useState("");

  const statusColors = { "pending_payment": "warning", "pending": "info", "confirmed": "success", "final_payment_pending": "purple", "processing": "blue", "completed": "success", "cancelled": "danger" };
  const statusLabels = { "pending_payment": "Chờ cọc", "pending": "Chờ duyệt cọc", "confirmed": "Đã cọc (Chờ chụp)", "final_payment_pending": "Chờ duyệt TT cuối", "processing": "Hậu kỳ", "completed": "Hoàn thành", "cancelled": "Đã hủy" };

  useEffect(() => {
    // adminAuthService.initAutoRefresh(); // Tạm tắt nếu Header đã gọi để tránh render thừa
    fetchData();
  }, []);

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  const formatDate = (d) => (!d ? "N/A" : new Date(d).toLocaleDateString('vi-VN'));
  const getImageUrl = (url) => (!url ? null : (url.startsWith("http") ? url : `http://localhost:5000/${url.replace(/^\/+/, "")}`));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [methodsRes, ordersRes] = await Promise.all([
        paymentMethodService.getAllPaymentMethods(),
        adminOrderService.getAllOrders()
      ]);

      const methodsList = Array.isArray(methodsRes) ? methodsRes : (methodsRes?.data || []);
      setPaymentMethods(methodsList.map(m => ({ ...m, id: m._id, editing: false })));

      const rawOrders = ordersRes.data?.data || ordersRes.data || [];

      const formatted = rawOrders.map(o => {
        const deposit = o.deposit_required || 0;
        const total = o.final_amount || 0;
        let amountToCollect = 0, paymentPhase = "-", proofImage = null;

        if (o.status === 'pending' || o.status === 'pending_payment') {
          amountToCollect = deposit; paymentPhase = "Tiền Cọc (30%)"; proofImage = getImageUrl(o.payment_info?.transfer_image);
        } else if (o.status === 'final_payment_pending' || o.status === 'confirmed') {
          amountToCollect = total - deposit; paymentPhase = "Thanh toán nốt"; proofImage = getImageUrl(o.payment_info?.remaining_transfer_image);
        }

        return {
          id: o._id, displayId: o.order_id,
          customer: o.customer_id?.HoTen || "Khách hàng",
          totalAmount: formatCurrency(total),
          depositAmount: formatCurrency(deposit),
          amountToCollectStr: formatCurrency(amountToCollect),
          paymentPhase, proofImage,
          date: formatDate(o.createdAt),
          rawDate: new Date(o.createdAt), // ✅ Lưu date gốc để sort chính xác
          status: o.status, rawStatus: o.status
        };
      });

      // ✅ LOGIC SẮP XẾP MỚI
      // 1. Nhóm cần duyệt (pending, final_payment_pending) lên đầu.
      // 2. Trong nhóm cần duyệt: Cũ nhất lên trước (Ascending) để xử lý tồn đọng.
      // 3. Các nhóm còn lại: Mới nhất lên trước (Descending) để xem lịch sử.
      const pendingStatuses = ['pending', 'final_payment_pending'];

      formatted.sort((a, b) => {
        const isPendingA = pendingStatuses.includes(a.rawStatus);
        const isPendingB = pendingStatuses.includes(b.rawStatus);

        // Nếu khác nhóm: Pending luôn lên trên
        if (isPendingA && !isPendingB) return -1;
        if (!isPendingA && isPendingB) return 1;

        // Nếu cùng là Pending: Lâu nhất lên trên (Ascending Date)
        if (isPendingA && isPendingB) {
          return a.rawDate - b.rawDate;
        }

        // Nếu cùng là Đã duyệt/Khác: Mới nhất lên trên (Descending Date)
        return b.rawDate - a.rawDate;
      });

      setPayments(formatted);

    } catch (e) { console.error(e); toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  };

  const openConfirmModal = (order) => { setSelectedOrder(order); setActionStep('view'); setRejectionReason(""); setModalOpen(true); };
  const startReject = () => setActionStep('rejecting');
  const startConfirm = () => setActionStep('confirming');

  const submitReject = async () => {
    if (!selectedOrder) return;
    try {
      let revertStatus = selectedOrder.rawStatus === "pending" ? "pending_payment" : "waiting_final_payment";
      await adminOrderService.updateOrderStatus(selectedOrder.id, revertStatus, rejectionReason || "Thông tin không khớp");
      toast.info("Đã từ chối"); setModalOpen(false); fetchData();
    } catch (e) { toast.error("Lỗi xử lý"); }
  };

  const submitConfirm = async () => {
    if (!selectedOrder) return;
    try {
      let nextStatus = selectedOrder.rawStatus === "pending" ? "confirmed" : "processing";
      await adminOrderService.updateOrderStatus(selectedOrder.id, nextStatus, "Admin xác nhận");
      toast.success("Đã xác nhận"); setModalOpen(false); fetchData();
    } catch (e) { toast.error("Lỗi xử lý"); }
  };

  const addPaymentMethod = () => {
    setPaymentMethods(prev => [...prev, { id: `temp-${Date.now()}`, fullName: "", accountNumber: "", bank: "", branch: "", isActive: true, editing: true, isNew: true }]);
  };

  const removePaymentMethod = async (id) => {
    const method = paymentMethods.find((m) => m.id === id);
    if (!method) return;
    if (method.isNew) {
      setPaymentMethods(prev => prev.filter(m => m.id !== id));
      return;
    }
    if (!window.confirm("Xóa tài khoản này?")) return;
    try {
      await paymentMethodService.deletePaymentMethod(id);
      setPaymentMethods(prev => prev.filter(m => m.id !== id));
      toast.success("Đã xóa");
    } catch (error) { toast.error("Lỗi xóa"); }
  };

  const toggleEdit = async (id) => {
    const method = paymentMethods.find((m) => m.id === id);
    if (!method) return;
    if (method.editing) {
      if (!method.fullName || !method.accountNumber || !method.bank) return toast.error("Nhập đủ thông tin");
      try {
        const payload = { ...method };
        let res;
        if (method.isNew) {
          res = await paymentMethodService.createPaymentMethod(payload);
          toast.success("Đã thêm");
        } else {
          res = await paymentMethodService.updatePaymentMethod(id, payload);
          toast.success("Đã cập nhật");
        }
        const updatedData = res?.data || res || {};
        setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, id: updatedData._id || m.id, editing: false, isNew: false } : m));
      } catch (error) { toast.error("Lỗi lưu"); }
    } else {
      setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, editing: true } : m));
    }
  };

  const handleMethodChange = (id, field, value) => {
    setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const filtered = payments.filter(p => !searchTerm || p.displayId.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />
        <div className="page-header"><h2>Quản lý Thanh toán</h2></div>

        <div className="payment-methods-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title">Tài khoản nhận tiền ({paymentMethods.length})</h3>
            {/* ✅ Thêm nút Thêm tài khoản nhận tiền */}
            <button className="btn-add-method" onClick={addPaymentMethod}>
              <PlusCircle size={18} /> Thêm tài khoản
            </button>
          </div>
          <div className="cards-container">
            {paymentMethods.map((m) => (
              <div key={m.id} className={`payment-card ${!m.isActive ? "inactive-mode" : ""}`}>
                <div className="card-header">
                  <strong className="card-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wallet size={18} className="text-blue-600" />
                      {m.fullName || "Tài khoản mới"}
                    </div>
                    {!m.isActive && <span className="inactive-tag">(Đã ẩn)</span>}
                  </strong>
                  <div className="card-icons">
                    {m.editing ? <Save size={20} className="icon-save" onClick={() => toggleEdit(m.id)} /> : <Edit2 size={20} className="icon-edit" onClick={() => toggleEdit(m.id)} />}
                    <Trash2 size={20} className="icon-trash" onClick={() => removePaymentMethod(m.id)} />
                  </div>
                </div>
                <div className="card-body">

                  <div className="form-group"><label>Chủ tài khoản *</label><input type="text" value={m.fullName} readOnly={!m.editing} onChange={(e) => handleMethodChange(m.id, "fullName", e.target.value)} /></div>
                  <div className="form-group"><label>Số tài khoản *</label><input type="text" value={m.accountNumber} readOnly={!m.editing} onChange={(e) => handleMethodChange(m.id, "accountNumber", e.target.value)} /></div>
                  <div className="form-group-row">
                    <div className="form-group"><label>Ngân hàng *</label><input type="text" value={m.bank} readOnly={!m.editing} onChange={(e) => handleMethodChange(m.id, "bank", e.target.value)} /></div>
                    <div className="form-group"><label>Chi nhánh</label><input type="text" value={m.branch} readOnly={!m.editing} onChange={(e) => handleMethodChange(m.id, "branch", e.target.value)} /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="orders-section">
          <div className="orders-header">
            <h3>Duyệt tiền vào</h3>
            <div className="search-box">
              <input placeholder="Tìm mã đơn..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <Search className="search-icon" size={18} />
            </div>
          </div>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead><tr><th>Mã</th><th>Ngày</th><th>Tiền Cọc</th><th>Tổng</th><th>Loại</th><th>Cần thu</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td><b>#{p.displayId}</b></td>
                    <td>{p.date}</td>
                    <td className="text-blue-600">{p.depositAmount}</td>
                    <td>{p.totalAmount}</td>
                    <td>{p.paymentPhase}</td>
                    <td className="price-text">{p.amountToCollectStr}</td>
                    <td><span className={`status-badge ${statusColors[p.rawStatus] || 'default'}`}>{statusLabels[p.rawStatus]}</span></td>
                    <td>
                      {(p.rawStatus === 'pending' || p.rawStatus === 'final_payment_pending') ?
                        <button className="btn-verify" onClick={() => openConfirmModal(p)}><Eye size={16} /> Duyệt</button> :
                        <span className="text-muted">-</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ✅ CÔNG NGHỆ PORTAL: Render Modal ra body để tránh bị Sidebar che */}
      {modalOpen && selectedOrder && createPortal(
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setModalOpen(false)}><XCircle size={24} /></button>

            {actionStep === 'view' && (
              <>
                <div className="modal-header confirm"><DollarSign size={40} /><h3>Kiểm tra thanh toán</h3></div>
                <div className="modal-body">
                  <p>Đơn: <strong>#{selectedOrder.displayId}</strong> - {selectedOrder.customer}</p>
                  {selectedOrder.proofImage ?
                    <div className="proof-image-wrapper" onClick={() => setPreviewImage(selectedOrder.proofImage)}>
                      <img src={selectedOrder.proofImage} className="proof-img" alt="Proof" />
                      <div className="proof-overlay"><Eye color="white" /></div>
                    </div> : <div className="no-proof-warning"><p>Chưa có ảnh</p></div>
                  }
                  <div className="amount-info">
                    <p>Số tiền nhận: <span className="price-text">{selectedOrder.amountToCollectStr}</span></p>
                  </div>
                </div>
                <div className="modal-buttons">
                  <button className="btn-cancel" onClick={startReject}>Từ chối</button>
                  <button className="btn-confirm" onClick={startConfirm}>Xác nhận</button>
                </div>
              </>
            )}

            {actionStep === 'confirming' && (
              <>
                <div className="modal-header confirm"><CheckCircle2 size={40} /><h3>Xác nhận duyệt?</h3></div>
                <p>Bạn chắc chắn đã nhận được <strong>{selectedOrder.amountToCollectStr}</strong>?</p>
                <div className="modal-buttons">
                  <button className="btn-cancel" onClick={() => setActionStep('view')}>Quay lại</button>
                  <button className="btn-confirm" onClick={submitConfirm}>Duyệt ngay</button>
                </div>
              </>
            )}

            {actionStep === 'rejecting' && (
              <>
                <div className="modal-header" style={{ color: '#ef4444' }}><MessageSquareWarning size={40} /><h3>Từ chối</h3></div>
                <textarea className="reject-reason-input" rows="3" placeholder="Lý do..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
                <div className="modal-buttons">
                  <button className="btn-cancel" onClick={() => setActionStep('view')}>Quay lại</button>
                  <button className="btn-confirm" style={{ background: '#ef4444' }} onClick={submitReject}>Xác nhận</button>
                </div>
              </>
            )}
          </div>
        </div>, document.body
      )}

      {/* ✅ Modal Zoom (Cũng dùng Portal) */}
      {previewImage && createPortal(
        <div className="image-zoom-overlay" onClick={() => setPreviewImage(null)}>
          <div className="image-zoom-content">
            <img src={previewImage} alt="Zoom" />
            <button className="close-zoom"><XCircle size={32} color="white" /></button>
          </div>
        </div>, document.body
      )}
    </div>
  );
}