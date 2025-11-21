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
  X,
  Upload,
  Eye,
  EyeOff,
  Power // Icon nút nguồn/active
} from "lucide-react";

import paymentMethodService from "../../apis/paymentMethodService";
import adminAuthService from "../../apis/adminAuthService";
// import orderService from "../../apis/orderService"; // Import service đơn hàng của bạn ở đây

export default function PaymentManage() {
  // --- STATE ---
  const [payments, setPayments] = useState([]); // Danh sách đơn hàng
  const [paymentMethods, setPaymentMethods] = useState([]); // Danh sách phương thức TT
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [selectedQRCode, setSelectedQRCode] = useState(null);

  const statusColors = {
    "pending_payment": "warning", // Chưa thanh toán
    "pending": "info",            // Chờ xác nhận (Khách đã up ảnh)
    "confirmed": "success",       // Đã xác nhận
    "completed": "success",
    "cancelled": "danger"
  };

  const statusLabels = {
    "pending_payment": "Chưa thanh toán",
    "pending": "Chờ duyệt",
    "confirmed": "Đã thanh toán",
    "completed": "Hoàn thành",
    "cancelled": "Đã hủy"
  };

  // --- INITIAL FETCH ---
  useEffect(() => {
    adminAuthService.initAutoRefresh();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Payment Methods
      const methodsRes = await paymentMethodService.getAllPaymentMethods();
      const formattedMethods = methodsRes.data.map((method) => ({
        id: method._id,
        fullName: method.fullName,
        accountNumber: method.accountNumber,
        bank: method.bank,
        branch: method.branch || "",
        qrCode: method.qrCode, // URL từ server
        qrFile: null,          // File mới (nếu có upload)
        isActive: method.isActive,
        editing: false,
      }));
      setPaymentMethods(formattedMethods);

      // 2. Fetch Orders (Giả lập - Bạn hãy thay bằng API thật)
      // const ordersRes = await orderService.getAllOrders(); 
      // setPayments(ordersRes.data);
      
      // Dữ liệu giả lập để test giao diện
      setPayments([
        { id: "ORD-001", customer: "Nguyễn Văn A", service: "Chụp Cưới", amount: "2,500,000₫", date: "2023-11-20", status: "pending" },
        { id: "ORD-002", customer: "Trần Thị B", service: "Kỷ yếu", amount: "1,200,000₫", date: "2023-11-21", status: "confirmed" },
        { id: "ORD-003", customer: "Lê Văn C", service: "Sự kiện", amount: "5,000,000₫", date: "2023-11-22", status: "pending_payment" },
      ]);

    } catch (error) {
      console.error("Fetch error:", error);
      setError(error?.message || "Lỗi tải dữ liệu");
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // --- PAYMENT METHODS LOGIC ---

  const addPaymentMethod = () => {
    const newId = `temp-${Date.now()}`;
    setPaymentMethods((prev) => [
      ...prev,
      {
        id: newId,
        fullName: "",
        accountNumber: "",
        bank: "",
        branch: "",
        qrCode: null,
        qrFile: null,
        isActive: true,
        editing: true,
        isNew: true,
      },
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

  // Xử lý upload ảnh QR (Lưu vào state để preview và gửi đi)
  const handleQrChange = (id, file) => {
    if (!file) return;
    
    // Validate basic
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("File quá lớn (Max 5MB)");
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPaymentMethods((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, qrCode: reader.result, qrFile: file } // qrCode để preview, qrFile để upload
            : m
        )
      );
      toast.success("Đã chọn ảnh QR");
    };
    reader.readAsDataURL(file);
  };

  const handleMethodChange = (id, field, value) => {
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // SAVE / UPDATE FUNCTION (Quan trọng: Dùng FormData)
  const toggleEdit = async (id) => {
    const method = paymentMethods.find((m) => m.id === id);
    if (!method) return;

    if (method.editing) {
      // --- SAVE MODE ---
      if (!method.fullName || !method.accountNumber || !method.bank) {
        return toast.error("Vui lòng nhập: Tên, Số TK, Ngân hàng");
      }

      try {
        // Tạo FormData để gửi file
        const formData = new FormData();
        formData.append("fullName", method.fullName);
        formData.append("accountNumber", method.accountNumber);
        formData.append("bank", method.bank);
        formData.append("branch", method.branch || "");
        formData.append("isActive", method.isActive);
        
        // Chỉ gửi ảnh nếu user có chọn file mới
        if (method.qrFile) {
          formData.append("qrCode", method.qrFile);
        }

        let res;
        if (method.isNew) {
          res = await paymentMethodService.createPaymentMethod(formData);
          toast.success("Đã tạo phương thức mới");
        } else {
          res = await paymentMethodService.updatePaymentMethod(id, formData);
          toast.success("Đã cập nhật thành công");
        }

        // Update state với dữ liệu từ server trả về (để có URL ảnh thật)
        const updatedData = res.data || res; // Tùy cấu trúc response của bạn
        
        setPaymentMethods((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  id: updatedData._id || m.id, // Update ID thật nếu là mới
                  qrCode: updatedData.qrCode || m.qrCode, // Update URL ảnh từ server
                  qrFile: null, // Reset file upload
                  editing: false,
                  isNew: false,
                }
              : m
          )
        );

      } catch (error) {
        console.error("Save error:", error);
        toast.error(error.response?.data?.message || "Lỗi khi lưu dữ liệu");
      }
    } else {
      // --- EDIT MODE ---
      setPaymentMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, editing: true } : m))
      );
    }
  };

  // --- ORDERS LOGIC ---

  const openConfirmModal = (id) => {
    setSelectedPaymentId(id);
    setModalOpen(true);
  };

  const confirmOrderPayment = async () => {
    try {
      // Gọi API cập nhật trạng thái (Bỏ comment khi có API thật)
      // await orderService.updateOrderStatus(selectedPaymentId, "confirmed");

      setPayments((prev) =>
        prev.map((p) =>
          p.id === selectedPaymentId ? { ...p, status: "confirmed" } : p
        )
      );
      toast.success("Đã xác nhận thanh toán đơn hàng");
      setModalOpen(false);
    } catch (error) {
      toast.error("Lỗi khi cập nhật đơn hàng");
    }
  };

  // --- HELPER ---
  const getQRCodeUrl = (qr) => {
    if (!qr) return null;
    if (qr.startsWith("data:")) return qr; // Base64 preview
    if (qr.startsWith("http")) return qr;  // Full URL
    return `http://localhost:5000${qr}`;   // Relative path từ server
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />

        <div className="page-header">
          <h2>Quản lý Thanh toán</h2>
          <input type="text" placeholder="Tìm kiếm..." className="search-input" />
        </div>

        {/* --- ERROR --- */}
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={fetchData}>Thử lại</button>
          </div>
        )}

        {/* --- PAYMENT METHODS --- */}
        <button className="btn add-method" onClick={addPaymentMethod}>
          <PlusCircle size={20} /> Thêm phương thức thanh toán
        </button>

        <div className="payment-methods-section">
          <h3 className="section-title">Phương thức thanh toán ({paymentMethods.length})</h3>
          
          <div className="cards-container">
            {paymentMethods.map((m) => (
              <div key={m.id} className={`payment-card ${!m.isActive ? "inactive-mode" : ""}`}>
                
                {/* Card Header */}
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

                {/* Card Body */}
                <div className="card-body">
                  {/* Toggle Active */}
                  <div className="form-toggle">
                    <label>Trạng thái hoạt động:</label>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={m.isActive} 
                        disabled={!m.editing}
                        onChange={(e) => handleMethodChange(m.id, "isActive", e.target.checked)} 
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label>Họ tên chủ thẻ *</label>
                    <input type="text" value={m.fullName} readOnly={!m.editing} 
                      onChange={(e) => handleMethodChange(m.id, "fullName", e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>Số tài khoản *</label>
                    <input type="text" value={m.accountNumber} readOnly={!m.editing} 
                      onChange={(e) => handleMethodChange(m.id, "accountNumber", e.target.value)} />
                  </div>

                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Ngân hàng *</label>
                      <input type="text" value={m.bank} readOnly={!m.editing} 
                        onChange={(e) => handleMethodChange(m.id, "bank", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Chi nhánh</label>
                      <input type="text" value={m.branch} readOnly={!m.editing} 
                        onChange={(e) => handleMethodChange(m.id, "branch", e.target.value)} />
                    </div>
                  </div>

                  {/* QR Upload Section */}
                  <div className="qr-section">
                    <label>Mã QR</label>
                    {m.editing && (
                      <div className="upload-btn-wrapper">
                        <input 
                          type="file" 
                          id={`qr-upload-${m.id}`} 
                          accept="image/*" 
                          onChange={(e) => handleQrChange(m.id, e.target.files[0])} 
                          hidden 
                        />
                        <label htmlFor={`qr-upload-${m.id}`} className="btn-upload-qr">
                          <Upload size={14} /> {m.qrCode ? "Thay đổi ảnh" : "Tải ảnh lên"}
                        </label>
                      </div>
                    )}

                    {m.qrCode ? (
                      <div className="qr-preview-box">
                        <img 
                          src={getQRCodeUrl(m.qrCode)} 
                          alt="QR" 
                          className="qr-thumb" 
                          onClick={() => { setSelectedQRCode(m.qrCode); setQrModalOpen(true); }}
                        />
                        <span className="view-text" onClick={() => { setSelectedQRCode(m.qrCode); setQrModalOpen(true); }}>
                          <Eye size={12} /> Xem
                        </span>
                      </div>
                    ) : (
                      <div className="qr-placeholder">Chưa có QR</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- ORDERS LIST --- */}
        <div className="orders-section">
          <h3 className="section-title">Duyệt thanh toán đơn hàng</h3>
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
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
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
                      {p.status === "pending" ? (
                        <button className="btn-verify" onClick={() => openConfirmModal(p.id)}>
                          <CheckCircle2 size={16} /> Xác nhận
                        </button>
                      ) : p.status === "pending_payment" ? (
                         <span className="text-muted">Chờ khách CK...</span>
                      ) : (
                        <span className="text-success">✓ Đã duyệt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL XÁC NHẬN */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header confirm">
                <CheckCircle2 size={40} />
                <h3>Xác nhận thanh toán</h3>
              </div>
              <p>Bạn xác nhận đã nhận đủ tiền cho đơn hàng <strong>#{selectedPaymentId}</strong>?</p>
              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => setModalOpen(false)}>Hủy</button>
                <button className="btn-confirm" onClick={confirmOrderPayment}>Đồng ý</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL QR ZOOM */}
        {qrModalOpen && (
          <div className="modal-overlay" onClick={() => setQrModalOpen(false)}>
            <div className="modal-content qr-view" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setQrModalOpen(false)}><X /></button>
              <h3>Mã QR</h3>
              <img src={getQRCodeUrl(selectedQRCode)} alt="Full QR" className="qr-full-img" />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}