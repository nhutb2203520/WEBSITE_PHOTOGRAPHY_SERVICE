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
  Wallet // ✅ Icon Wallet
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
    "final_payment_pending": "purple",  // Khách đã chuyển khoản cuối -> Chờ duyệt
    "processing": "blue",               // ✅ MỚI: Đã thanh toán đủ -> Đang hậu kỳ
    "completed": "success",             // Hoàn thành
    "cancelled": "danger"
  };

  const statusLabels = {
    "pending_payment": "Chờ cọc",
    "pending": "Chờ duyệt cọc",
    "confirmed": "Đã cọc (Chờ chụp)",
    "final_payment_pending": "Chờ duyệt TT cuối",
    "processing": "Đang xử lý (Hậu kỳ)", // ✅ MỚI
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

      // 2. Orders
      const ordersRes = await adminOrderService.getAllOrders();
      const rawOrders = ordersRes.data?.data || ordersRes.data || [];

      const formattedOrders = rawOrders.map((order) => {
        const customerName = order.customer_id?.HoTen || order.customer_id?.full_name || "Khách hàng";
        
        const deposit = order.deposit_required || 0;
        const total = order.final_amount || 0;
        const remaining = total - deposit;

        let amountToCollect = 0;
        let paymentPhase = "-";

        if (order.status === 'pending' || order.status === 'pending_payment') {
            amountToCollect = deposit;
            paymentPhase = "Tiền Cọc (30%)";
        } else if (order.status === 'final_payment_pending' || order.status === 'confirmed') {
            amountToCollect = remaining;
            paymentPhase = "Thanh toán nốt (70%)";
        }

        return {
          id: order._id,
          displayId: order.order_id,
          customer: customerName,
          
          totalAmount: formatCurrency(total),
          depositAmount: formatCurrency(deposit),
          
          amountToCollectStr: formatCurrency(amountToCollect),
          paymentPhase: paymentPhase,
          
          date: formatDate(order.createdAt),
          status: order.status,
          rawStatus: order.status
        };
      });

      // Sắp xếp ưu tiên các đơn cần duyệt lên đầu
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

  // --- LOGIC XÁC NHẬN (ĐÃ FIX) ---
  const openConfirmModal = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedOrder) return;

    try {
      let nextStatus = "";
      let message = "";

      if (selectedOrder.rawStatus === "pending") {
         nextStatus = "confirmed";
         message = "Đã xác nhận tiền cọc thành công!";
      } else if (selectedOrder.rawStatus === "final_payment_pending") {
         // ✅ FIX: Chuyển sang 'processing' để hệ thống tính deadline và cho thợ làm ảnh
         nextStatus = "processing"; 
         message = "Đã xác nhận thanh toán đủ. Đơn hàng chuyển sang giai đoạn hậu kỳ!";
      } else {
         toast.warning("Trạng thái không hợp lệ.");
         return;
      }

      await adminOrderService.updateOrderStatus(selectedOrder.id, nextStatus, "Admin xác nhận thanh toán");
      
      setPayments((prev) =>
        prev.map((p) =>
          p.id === selectedOrder.id ? { ...p, status: nextStatus, rawStatus: nextStatus } : p
        )
      );
      
      toast.success(message);
      setModalOpen(false);
      
      // Refresh lại data để đảm bảo đồng bộ
      fetchData(); 

    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  // --- PAYMENT METHODS CRUD ---
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
        const payload = { 
            fullName: method.fullName, 
            accountNumber: method.accountNumber, 
            bank: method.bank, 
            branch: method.branch || "", 
            isActive: method.isActive 
        };
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
    return (
      p.displayId?.toLowerCase().includes(term) ||
      p.customer?.toLowerCase().includes(term)
    );
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

        {/* PHẦN 1: QUẢN LÝ TÀI KHOẢN NGÂN HÀNG */}
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
                    <label>Hiển thị:</label>
                    <label className="switch">
                      <input type="checkbox" checked={m.isActive} disabled={!m.editing} onChange={(e) => handleMethodChange(m.id, "isActive", e.target.checked)} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Chủ tài khoản *</label>
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

        {/* PHẦN 2: DANH SÁCH DUYỆT TIỀN */}
        <div className="orders-section">
          <div className="orders-header">
            <h3 className="section-title">Duyệt tiền khách chuyển</h3>
            <div className="search-container">
                <div className="search-box">
                    <input 
                        type="text" 
                        placeholder="Tìm mã đơn..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
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
                  <th>Tiền Cọc (30%)</th>
                  <th>Tổng Tiền</th>
                  <th>Loại thanh toán</th>
                  <th>Số tiền còn lại</th>
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

                    {/* Thông tin thanh toán hiện tại */}
                    <td><span className="text-muted" style={{fontSize: '13px'}}>{p.paymentPhase}</span></td>
                    <td className="price-text" style={{fontSize: '15px'}}>{p.amountToCollectStr}</td>

                    <td>
                      <span className={`status-badge ${statusColors[p.rawStatus] || 'default'}`}>
                        {statusLabels[p.rawStatus] || p.status}
                      </span>
                    </td>

                    <td>
                      {(p.rawStatus === "pending") ? (
                        <button className="btn-verify" onClick={() => openConfirmModal(p)}>
                          <CheckCircle2 size={16} /> Duyệt Cọc
                        </button>
                      ) : (p.rawStatus === "final_payment_pending") ? (
                        <button className="btn-verify" style={{backgroundColor: '#059669'}} onClick={() => openConfirmModal(p)}>
                          <DollarSign size={16} /> Duyệt TT Cuối
                        </button>
                      ) : (
                        <span className="text-muted text-xs italic">
                            {p.rawStatus === 'completed' ? 'Đã hoàn tất' : 
                             p.rawStatus === 'processing' ? 'Đang hậu kỳ' : '-'}
                        </span>
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

        {/* MODAL XÁC NHẬN */}
        {modalOpen && selectedOrder && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header confirm">
                <DollarSign size={40} />
                <h3>Xác nhận thu tiền</h3>
              </div>
              
              <div className="modal-body text-center mb-4">
                  <p>Xác nhận thanh toán cho đơn: <strong>#{selectedOrder.displayId}</strong></p>
                  <p className="text-muted text-sm mb-2">Khách hàng: {selectedOrder.customer}</p>
                  
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

                  {/* ✅ FIX: Hiển thị đúng trạng thái sẽ chuyển đến */}
                  <p className="text-sm text-gray-500 italic">
                      Hành động này sẽ chuyển trạng thái sang: <br/>
                      <strong> 
                        {selectedOrder.rawStatus === 'pending' 
                            ? '"Đã cọc" (Sẵn sàng chụp)' 
                            : '"Đang xử lý" (Bắt đầu hậu kỳ & Giao hàng)'} 
                      </strong>
                  </p>
              </div>

              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => setModalOpen(false)}>Hủy</button>
                <button className="btn-confirm" onClick={handleConfirm}>Xác nhận</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}