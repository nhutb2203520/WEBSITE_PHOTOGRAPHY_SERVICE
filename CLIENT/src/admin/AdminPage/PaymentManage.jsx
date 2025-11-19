import { useState } from "react";
import SidebarAdmin from "./SidebarAdmin";
import HeaderAdmin from "./HeaderAdmin";
import "./PaymentManage.css";
import { CheckCircle2, PlusCircle, Trash2, Edit2, Save } from "lucide-react";

export default function PaymentManage() {
  const [payments, setPayments] = useState([
    { id: 1, customer: "Nguyễn Minh", service: "Chụp cưới", amount: "2,500,000₫", date: "2025-11-18", status: "Chưa thanh toán" },
    { id: 2, customer: "Trần Duy", service: "Chụp studio", amount: "1,200,000₫", date: "2025-11-17", status: "Chưa thanh toán" },
    { id: 3, customer: "Lê Thảo", service: "Gói VIP", amount: "5,000,000₫", date: "2025-11-16", status: "Chưa thanh toán" }
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, fullName: "Nguyễn Văn A", accountNumber: "0123456789", bank: "Vietcombank", branch: "TP.HCM", qrCode: null, editing: false },
    { id: 2, fullName: "Trần Thị B", accountNumber: "9876543210", bank: "Techcombank", branch: "Hà Nội", qrCode: null, editing: false }
  ]);

  const statusColors = { "Chưa thanh toán": "warning", "Đã thanh toán": "success" };

  const openConfirmModal = (id) => {
    setSelectedPaymentId(id);
    setModalOpen(true);
  };

  const confirmPayment = () => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === selectedPaymentId ? { ...p, status: "Đã thanh toán" } : p
      )
    );
    setModalOpen(false);
    setSelectedPaymentId(null);
  };

  const handleMethodChange = (id, field, value) => {
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleQrChange = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleMethodChange(id, "qrCode", reader.result);
    reader.readAsDataURL(file);
  };

  const addPaymentMethod = () => {
    const newId = Math.max(...paymentMethods.map((m) => m.id), 0) + 1;
    setPaymentMethods([
      ...paymentMethods,
      { id: newId, fullName: "", accountNumber: "", bank: "", branch: "", qrCode: null, editing: true }
    ]);
  };

  const removePaymentMethod = (id) => {
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleEdit = (id) => {
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, editing: !m.editing } : m))
    );
  };

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />

        <div className="page-header">
          <h2>Quản lý Thanh toán</h2>
          <input type="text" placeholder="Tìm kiếm khách hàng hoặc dịch vụ..." className="search-input" />
        </div>

        {/* BUTTON ADD METHOD */}
        <button className="btn add-method" onClick={addPaymentMethod}>
          <PlusCircle size={20} /> Thêm phương thức
        </button>

        {/* PHƯƠNG THỨC THANH TOÁN */}
        <div className="payment-methods-container">
          <h3 className="section-title">Phương thức thanh toán</h3>

          <div className="cards-container">
            {paymentMethods.map((m) => (
              <div key={m.id} className="payment-card">

                <div className="card-header">
                  <strong className="card-title">
                    {m.fullName || "Tên chủ tài khoản"}
                  </strong>

                  <div className="card-icons">
                    {!m.editing && <Edit2 size={18} className="edit-icon" onClick={() => toggleEdit(m.id)} />}
                    {m.editing && <Save size={18} className="save-icon" onClick={() => toggleEdit(m.id)} />}
                    <Trash2 size={18} className="remove-icon" onClick={() => removePaymentMethod(m.id)} />
                  </div>
                </div>

                <div className="card-body">
                  <label>Họ tên chủ tài khoản</label>
                  <input type="text" value={m.fullName} readOnly={!m.editing}
                    onChange={(e) => handleMethodChange(m.id, "fullName", e.target.value)} />

                  <label>Số tài khoản</label>
                  <input type="text" value={m.accountNumber} readOnly={!m.editing}
                    onChange={(e) => handleMethodChange(m.id, "accountNumber", e.target.value)} />

                  <label>Ngân hàng</label>
                  <input type="text" value={m.bank} readOnly={!m.editing}
                    onChange={(e) => handleMethodChange(m.id, "bank", e.target.value)} />

                  <label>Chi nhánh</label>
                  <input type="text" value={m.branch} readOnly={!m.editing}
                    onChange={(e) => handleMethodChange(m.id, "branch", e.target.value)} />

                  <label>Mã QR thanh toán</label>
                  {m.editing && (
                    <input type="file" accept="image/*"
                      onChange={(e) => handleQrChange(m.id, e.target.files[0])} />
                  )}

                  {m.qrCode && (
                    <img src={m.qrCode} alt="QR Code" className="qr-preview" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="table-box">
          <table>
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Dịch vụ</th>
                <th>Số tiền</th>
                <th>Ngày</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.customer}</td>
                  <td>{p.service}</td>
                  <td>{p.amount}</td>
                  <td>{p.date}</td>
                  <td>
                    <span className={`badge ${statusColors[p.status]}`}>{p.status}</span>
                  </td>
                  <td>
                    {p.status === "Chưa thanh toán" && (
                      <button className="btn-update" onClick={() => openConfirmModal(p.id)}>
                        Đánh dấu đã thanh toán
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-box modal-animate">
              <CheckCircle2 size={40} className="modal-icon" />
              <h3>Xác nhận thanh toán</h3>
              <p>Bạn có chắc chắn đánh dấu đơn hàng này là <strong>Đã thanh toán</strong>?</p>
              <div className="modal-actions">
                <button className="btn confirm" onClick={confirmPayment}>Xác nhận</button>
                <button className="btn cancel" onClick={() => setModalOpen(false)}>Hủy</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
