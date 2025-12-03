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
  Wallet,
  Eye,
  AlertOctagon,
  ArrowLeft, // Icon quay lại
  MessageSquareWarning // Icon cảnh báo
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

  // --- STATE MỚI CHO FORM XÁC NHẬN ---
  // actionStep: 'view' | 'confirming' | 'rejecting'
  const [actionStep, setActionStep] = useState('view'); 
  const [rejectionReason, setRejectionReason] = useState("");

  // Map màu sắc trạng thái
  const statusColors = {
    "pending_payment": "warning",
    "pending": "info",
    "confirmed": "success",
    "final_payment_pending": "purple",
    "processing": "blue",
    "completed": "success",
    "cancelled": "danger"
  };

  const statusLabels = {
    "pending_payment": "Chờ cọc",
    "pending": "Chờ duyệt cọc",
    "confirmed": "Đã cọc (Chờ chụp)",
    "final_payment_pending": "Chờ duyệt TT cuối",
    "processing": "Đang xử lý (Hậu kỳ)",
    "completed": "Hoàn thành",
    "cancelled": "Đã hủy"
  };

  useEffect(() => {
    adminAuthService.initAutoRefresh();
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `http://localhost:5000/${url.replace(/^\/+/, "")}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
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

      const ordersRes = await adminOrderService.getAllOrders();
      const rawOrders = ordersRes.data?.data || ordersRes.data || [];

      const formattedOrders = rawOrders.map((order) => {
        const customerName = order.customer_id?.HoTen || order.customer_id?.full_name || "Khách hàng";
        
        const deposit = order.deposit_required || 0;
        const total = order.final_amount || 0;
        const remaining = total - deposit;

        let amountToCollect = 0;
        let paymentPhase = "-";
        let proofImage = null;

        if (order.status === 'pending' || order.status === 'pending_payment') {
            amountToCollect = deposit;
            paymentPhase = "Tiền Cọc (30%)";
            proofImage = getImageUrl(order.payment_info?.transfer_image);
        } else if (order.status === 'final_payment_pending' || order.status === 'confirmed') {
            amountToCollect = remaining;
            paymentPhase = "Thanh toán nốt (70%)";
            proofImage = getImageUrl(order.payment_info?.remaining_transfer_image);
        }

        return {
          id: order._id,
          displayId: order.order_id,
          customer: customerName,
          totalAmount: formatCurrency(total),
          depositAmount: formatCurrency(deposit),
          amountToCollectStr: formatCurrency(amountToCollect),
          paymentPhase: paymentPhase,
          proofImage: proofImage,
          date: formatDate(order.createdAt),
          status: order.status,
          rawStatus: order.status
        };
      });

      const sortedOrders = formattedOrders.sort((a, b) => {
         const priority = { 'pending': 1, 'final_payment_pending': 1, 'confirmed': 3, 'processing': 4, 'completed': 5, 'cancelled': 6 };
         return (priority[a.rawStatus] || 99) - (priority[b.rawStatus] || 99);
      });

      setPayments(sortedOrders);

    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC MODAL ---
  const openConfirmModal = (order) => {
    setSelectedOrder(order);
    setActionStep('view'); // Reset về xem
    setRejectionReason(""); // Reset lý do
    setModalOpen(true);
  };

  // ✅ CHUYỂN BƯỚC: Sang màn hình Từ chối
  const startRejectProcess = () => {
    setActionStep('rejecting');
  };

  // ✅ CHUYỂN BƯỚC: Sang màn hình Xác nhận
  const startConfirmProcess = () => {
    setActionStep('confirming');
  };

  // ✅ SUBMIT TỪ CHỐI
  const submitReject = async () => {
    if (!selectedOrder) return;
    
    // Nếu chưa nhập lý do thì cảnh báo (hoặc dùng mặc định)
    const finalReason = rejectionReason.trim() || "Ảnh mờ hoặc thông tin không khớp";

    try {
        let revertStatus = "";
        let message = "Đã từ chối thanh toán.";

        if (selectedOrder.rawStatus === "pending") {
            revertStatus = "pending_payment";
        } else if (selectedOrder.rawStatus === "final_payment_pending") {
            revertStatus = "waiting_final_payment";
        } else {
            return;
        }

        // Gọi API với lý do
        await adminOrderService.updateOrderStatus(selectedOrder.id, revertStatus, finalReason);
        
        toast.info(message);
        setModalOpen(false);
        fetchData();

    } catch (error) {
        console.error(error);
        toast.error("Lỗi khi từ chối đơn hàng");
    }
  };

  // ✅ SUBMIT XÁC NHẬN
  const submitConfirm = async () => {
    if (!selectedOrder) return;

    try {
      let nextStatus = "";
      let message = "";

      if (selectedOrder.rawStatus === "pending") {
         nextStatus = "confirmed";
         message = "Đã xác nhận tiền cọc thành công!";
      } else if (selectedOrder.rawStatus === "final_payment_pending") {
         nextStatus = "processing"; 
         message = "Đã xác nhận thanh toán đủ!";
      } else {
         return;
      }

      await adminOrderService.updateOrderStatus(selectedOrder.id, nextStatus, "Admin xác nhận thanh toán");
      
      toast.success(message);
      setModalOpen(false);
      fetchData(); 

    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  // --- Payment Methods CRUD ... (Giữ nguyên code cũ) ---
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
    if (!window.confirm("Xóa tài khoản ngân hàng này?")) return;
    try {
      await paymentMethodService.deletePaymentMethod(id);
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success("Đã xóa tài khoản");
    } catch (error) {
      toast.error("Lỗi khi xóa");
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
        return toast.error("Vui lòng nhập đủ thông tin");
      }
      try {
        const payload = { fullName: method.fullName, accountNumber: method.accountNumber, bank: method.bank, branch: method.branch || "", isActive: method.isActive };
        let res;
        if (method.isNew) {
          res = await paymentMethodService.createPaymentMethod(payload);
          toast.success("Đã thêm mới");
        } else {
          res = await paymentMethodService.updatePaymentMethod(id, payload);
          toast.success("Đã cập nhật");
        }
        const updatedData = res?.data || res || {}; 
        setPaymentMethods((prev) => prev.map((m) => m.id === id ? { ...m, id: updatedData._id || m.id, editing: false, isNew: false } : m));
      } catch (error) {
        toast.error("Lỗi khi lưu");
      }
    } else {
      setPaymentMethods((prev) => prev.map((m) => (m.id === id ? { ...m, editing: true } : m)));
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return p.displayId?.toLowerCase().includes(term) || p.customer?.toLowerCase().includes(term);
  });

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />
        <div className="page-header">
          <h2>Quản lý Thanh toán (Duyệt tiền vào)</h2>
        </div>

        <button className="btn add-method" onClick={addPaymentMethod}>
          <PlusCircle size={20} /> Thêm tài khoản ngân hàng
        </button>

        <div className="payment-methods-section">
          <h3 className="section-title">Tài khoản nhận tiền ({paymentMethods.length})</h3>
          <div className="cards-container">
            {paymentMethods.map((m) => (
              <div key={m.id} className={`payment-card ${!m.isActive ? "inactive-mode" : ""}`}>
                <div className="card-header">
                  <strong className="card-title">
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <Wallet size={18} className="text-blue-600"/>
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
                  <div className="form-toggle">
                    <label>Hiển thị:</label>
                    <label className="switch">
                      <input type="checkbox" checked={m.isActive} disabled={!m.editing} onChange={(e) => handleMethodChange(m.id, "isActive", e.target.checked)} />
                      <span className="slider round"></span>
                    </label>
                  </div>
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
            <h3 className="section-title">Duyệt tiền khách chuyển</h3>
            <div className="search-container">
                <div className="search-box">
                    <input type="text" placeholder="Tìm mã đơn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                  <th>Ngày đặt</th>
                  <th>Tiền Cọc</th>
                  <th>Tổng Tiền</th>
                  <th>Loại thanh toán</th>
                  <th>Số tiền nhận</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td style={{fontWeight: 'bold'}}>#{p.displayId}</td>
                    <td>{p.date}</td>
                    <td className="text-blue-600 font-medium">{p.depositAmount}</td>
                    <td className="text-gray-600">{p.totalAmount}</td>
                    <td><span className="text-muted" style={{fontSize: '13px'}}>{p.paymentPhase}</span></td>
                    <td className="price-text" style={{fontSize: '15px'}}>{p.amountToCollectStr}</td>
                    <td><span className={`status-badge ${statusColors[p.rawStatus] || 'default'}`}>{statusLabels[p.rawStatus] || p.status}</span></td>
                    <td>
                      {(p.rawStatus === "pending") ? (
                        <button className="btn-verify" onClick={() => openConfirmModal(p)}><Eye size={16} style={{marginRight:4}}/> Duyệt Cọc</button>
                      ) : (p.rawStatus === "final_payment_pending") ? (
                        <button className="btn-verify" style={{backgroundColor: '#059669'}} onClick={() => openConfirmModal(p)}><Eye size={16} style={{marginRight:4}}/> Duyệt TT Cuối</button>
                      ) : (
                        <span className="text-muted text-xs italic">{p.rawStatus === 'completed' ? 'Đã hoàn tất' : p.rawStatus === 'processing' ? 'Đang hậu kỳ' : '-'}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && <tr><td colSpan="8" className="text-center">Không tìm thấy dữ liệu</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL ĐA BƯỚC */}
        {modalOpen && selectedOrder && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" style={{maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
              
              {/* === BƯỚC 1: XEM CHI TIẾT === */}
              {actionStep === 'view' && (
                <>
                  <div className="modal-header confirm">
                    <DollarSign size={40} />
                    <h3>Kiểm tra thanh toán</h3>
                  </div>
                  
                  <div className="modal-body mb-4">
                      <div style={{textAlign: 'center', marginBottom: 20}}>
                        <p>Đơn hàng: <strong>#{selectedOrder.displayId}</strong></p>
                        <p className="text-muted text-sm mb-2">Khách hàng: {selectedOrder.customer}</p>
                      </div>
                      
                      {selectedOrder.proofImage ? (
                          <div className="proof-image-section">
                              <p className="section-label">📸 Ảnh chuyển khoản:</p>
                              <div className="proof-image-wrapper" onClick={() => setPreviewImage(selectedOrder.proofImage)}>
                                  <img src={selectedOrder.proofImage} alt="Payment Proof" className="proof-img" />
                                  <div className="proof-overlay"><Eye color="white"/></div>
                              </div>
                              <small className="text-muted italic block text-center mt-1">(Nhấn vào ảnh để phóng to)</small>
                          </div>
                      ) : (
                          <div className="no-proof-warning"><AlertOctagon color="#ef4444" size={24}/><p>Không tìm thấy ảnh bằng chứng!</p></div>
                      )}

                      <div className="bg-gray-50 p-4 rounded-lg my-4 border border-gray-200">
                          <div className="flex justify-between mb-2">
                              <span className="text-gray-500">Loại thanh toán:</span>
                              <span className="font-semibold text-blue-600">{selectedOrder.paymentPhase}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 mt-2">
                              <span className="text-gray-500">Số tiền nhận:</span>
                              <span className="font-bold text-xl text-green-600">{selectedOrder.amountToCollectStr}</span>
                          </div>
                      </div>
                  </div>

                  <div className="modal-buttons" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                    <button className="btn-cancel" style={{borderColor: '#ef4444', color: '#ef4444'}} onClick={startRejectProcess}>
                        <XCircle size={18} style={{marginRight: 5}}/> Từ chối
                    </button>
                    <button className="btn-confirm" onClick={startConfirmProcess}>
                        <CheckCircle2 size={18} style={{marginRight: 5}}/> Xác nhận
                    </button>
                  </div>
                </>
              )}

              {/* === BƯỚC 2: FORM TỪ CHỐI === */}
              {actionStep === 'rejecting' && (
                <>
                  <div className="modal-header" style={{color: '#ef4444'}}>
                    <MessageSquareWarning size={40} />
                    <h3>Từ chối thanh toán</h3>
                  </div>
                  <div className="modal-body mb-4">
                    <p className="text-muted">Vui lòng nhập lý do từ chối. Thông báo này sẽ được gửi cho khách hàng.</p>
                    <textarea 
                      className="reject-reason-input"
                      placeholder="VD: Ảnh mờ không rõ mã giao dịch, số tiền không khớp..."
                      rows="4"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="modal-buttons">
                    <button className="btn-cancel" onClick={() => setActionStep('view')}><ArrowLeft size={16}/> Quay lại</button>
                    <button className="btn-confirm" style={{backgroundColor: '#ef4444'}} onClick={submitReject}>Xác nhận Từ chối</button>
                  </div>
                </>
              )}

              {/* === BƯỚC 3: FORM XÁC NHẬN === */}
              {actionStep === 'confirming' && (
                <>
                  <div className="modal-header confirm">
                    <CheckCircle2 size={40} color="#10b981"/>
                    <h3>Xác nhận duyệt tiền?</h3>
                  </div>
                  <div className="modal-body mb-4">
                    <p>Bạn chắc chắn muốn duyệt khoản thanh toán <strong>{selectedOrder.amountToCollectStr}</strong> cho đơn hàng <strong>#{selectedOrder.displayId}</strong>?</p>
                    <p className="text-sm text-gray-500 italic mt-2">
                      Trạng thái đơn sẽ chuyển sang: 
                      <strong> {selectedOrder.rawStatus === 'pending' ? 'Đã cọc' : 'Đang xử lý (Hậu kỳ)'}</strong>
                    </p>
                  </div>
                  <div className="modal-buttons">
                    <button className="btn-cancel" onClick={() => setActionStep('view')}><ArrowLeft size={16}/> Quay lại</button>
                    <button className="btn-confirm" onClick={submitConfirm}>Duyệt ngay</button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

        {/* MODAL ZOOM ẢNH */}
        {previewImage && (
            <div className="image-zoom-overlay" onClick={() => setPreviewImage(null)}>
                <div className="image-zoom-content">
                    <img src={previewImage} alt="Full Proof" />
                    <button className="close-zoom" onClick={() => setPreviewImage(null)}><XCircle size={32}/></button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}