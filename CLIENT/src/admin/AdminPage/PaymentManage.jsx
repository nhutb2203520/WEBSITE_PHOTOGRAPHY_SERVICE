import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
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
} from "lucide-react";

import paymentMethodService from "../../apis/paymentMethodService";

export default function PaymentManage() {
  const { user } = useSelector((state) => state.user);
  const token = user?.token;

  const [payments, setPayments] = useState([
    {
      id: 1,
      customer: "Nguyễn Minh",
      service: "Chụp cưới",
      amount: "2,500,000₫",
      date: "2025-11-18",
      status: "Chưa thanh toán",
    },
    {
      id: 2,
      customer: "Trần Duy",
      service: "Chụp studio",
      amount: "1,200,000₫",
      date: "2025-11-17",
      status: "Chưa thanh toán",
    },
    {
      id: 3,
      customer: "Lê Thảo",
      service: "Gói VIP",
      amount: "5,000,000₫",
      date: "2025-11-16",
      status: "Chưa thanh toán",
    },
  ]);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [selectedQRCode, setSelectedQRCode] = useState(null);

  const statusColors = {
    "Chưa thanh toán": "warning",
    "Đã thanh toán": "success",
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);

      const response = await paymentMethodService.getAllPaymentMethods();
      const formatted = response.data.map((method) => ({
        id: method._id,
        fullName: method.fullName,
        accountNumber: method.accountNumber,
        bank: method.bank,
        branch: method.branch || "",
        qrCode: method.qrCode,
        isActive: method.isActive,
        editing: false,
      }));

      setPaymentMethods(formatted);
    } catch (error) {
      toast.error("Không thể tải danh sách phương thức thanh toán");
    } finally {
      setLoading(false);
    }
  };

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
        isActive: true,
        editing: true,
        isNew: true,
      },
    ]);
  };

  const removePaymentMethod = async (id) => {
    const method = paymentMethods.find((m) => m.id === id);

    if (method?.isNew) {
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success("Đã xóa");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa phương thức này?")) return;

    try {
      await paymentMethodService.deletePaymentMethod(id, token);
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success("Đã xóa phương thức thanh toán");
    } catch (error) {
      toast.error("Không thể xóa phương thức thanh toán");
    }
  };

  const toggleEdit = async (id) => {
    const method = paymentMethods.find((m) => m.id === id);
    if (!method) return;

    // Lưu cập nhật
    if (method.editing) {
      if (!method.fullName || !method.accountNumber || !method.bank) {
        toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
        return;
      }

      try {
        if (method.isNew) {
          const res = await paymentMethodService.createPaymentMethod(
            {
              fullName: method.fullName,
              accountNumber: method.accountNumber,
              bank: method.bank,
              branch: method.branch,
              qrCode: method.qrCode,
            },
            token
          );

          setPaymentMethods((prev) =>
            prev.map((m) =>
              m.id === id
                ? { ...m, id: res.data._id, isNew: false, editing: false }
                : m
            )
          );

          toast.success("Đã thêm phương thức thanh toán");
        } else {
          await paymentMethodService.updatePaymentMethod(
            id,
            {
              fullName: method.fullName,
              accountNumber: method.accountNumber,
              bank: method.bank,
              branch: method.branch,
              qrCode: method.qrCode,
              isActive: method.isActive,
            },
            token
          );

          setPaymentMethods((prev) =>
            prev.map((m) =>
              m.id === id ? { ...m, editing: false } : m
            )
          );

          toast.success("Đã cập nhật");
        }
      } catch (error) {
        toast.error("Không thể lưu phương thức thanh toán");
      }
    } else {
      setPaymentMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, editing: true } : m))
      );
    }
  };

  const handleMethodChange = (id, field, value) => {
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleQrChange = (id, file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File quá lớn (tối đa 5MB)!");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleMethodChange(id, "qrCode", reader.result);
      toast.success("Đã tải QR Code");
    };
    reader.readAsDataURL(file);
  };

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
    toast.success("Đã cập nhật trạng thái thanh toán");
    setModalOpen(false);
  };

  const openQRModal = (qr) => {
    setSelectedQRCode(qr);
    setQrModalOpen(true);
  };

  const getQRCodeUrl = (qr) => {
    if (!qr) return null;
    if (qr.startsWith("data:")) return qr;
    if (qr.startsWith("http")) return qr;
    return `http://localhost:5000${qr}`;
  };

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Đang tải...</p>
      </div>
    );

  return (
    <div className="admin-layout">
      <SidebarAdmin />

      <main className="admin-main">
        <HeaderAdmin />

        {/* HEADER */}
        <div className="page-header">
          <h2>Quản lý Thanh toán</h2>
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng hoặc dịch vụ..."
            className="search-input"
          />
        </div>

        {/* ADD METHOD BUTTON */}
        <button className="btn add-method" onClick={addPaymentMethod}>
          <PlusCircle size={20} /> Thêm phương thức thanh toán
        </button>

        {/* PAYMENT METHOD LIST */}
        <div className="payment-methods-container">
          <h3 className="section-title">
            Phương thức thanh toán ({paymentMethods.length})
          </h3>

          <div className="cards-container">
            {paymentMethods.map((m) => (
              <div
                key={m.id}
                className={`payment-card ${!m.isActive ? "inactive" : ""}`}
              >
                <div className="card-header">
                  <strong className="card-title">
                    {m.fullName || "Tên chủ tài khoản"}
                  </strong>

                  <div className="card-icons">
                    {m.editing ? (
                      <Save size={18} onClick={() => toggleEdit(m.id)} />
                    ) : (
                      <Edit2 size={18} onClick={() => toggleEdit(m.id)} />
                    )}

                    <Trash2
                      size={18}
                      className="remove-icon"
                      onClick={() => removePaymentMethod(m.id)}
                    />
                  </div>
                </div>

                <div className="card-body">
                  <label>Họ tên *</label>
                  <input
                    type="text"
                    value={m.fullName}
                    readOnly={!m.editing}
                    onChange={(e) =>
                      handleMethodChange(m.id, "fullName", e.target.value)
                    }
                  />

                  <label>Số tài khoản *</label>
                  <input
                    type="text"
                    value={m.accountNumber}
                    readOnly={!m.editing}
                    onChange={(e) =>
                      handleMethodChange(m.id, "accountNumber", e.target.value)
                    }
                  />

                  <label>Ngân hàng *</label>
                  <input
                    type="text"
                    value={m.bank}
                    readOnly={!m.editing}
                    onChange={(e) =>
                      handleMethodChange(m.id, "bank", e.target.value)
                    }
                  />

                  <label>Chi nhánh</label>
                  <input
                    type="text"
                    value={m.branch}
                    readOnly={!m.editing}
                    onChange={(e) =>
                      handleMethodChange(m.id, "branch", e.target.value)
                    }
                  />

                  <label>QR Code</label>
                  {m.editing && (
                    <div className="upload-qr-group">
                      <input
                        type="file"
                        id={`qr-${m.id}`}
                        accept="image/*"
                        onChange={(e) =>
                          handleQrChange(m.id, e.target.files[0])
                        }
                        style={{ display: "none" }}
                      />

                      <label htmlFor={`qr-${m.id}`} className="btn-upload-qr">
                        <Upload size={16} />
                        {m.qrCode ? "Đổi QR" : "Tải QR"}
                      </label>
                    </div>
                  )}

                  {m.qrCode && (
                    <div className="qr-preview-container">
                      <img
                        src={getQRCodeUrl(m.qrCode)}
                        className="qr-preview"
                        onClick={() => openQRModal(m.qrCode)}
                      />

                      <button
                        className="btn-view-qr"
                        onClick={() => openQRModal(m.qrCode)}
                      >
                        <Eye size={14} /> Xem lớn
                      </button>
                    </div>
                  )}

                  {!m.isActive && (
                    <div className="inactive-badge">
                      <EyeOff size={14} /> Đã ẩn
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ORDERS */}
        <div className="table-section">
          <h3 className="section-title">Danh sách đơn hàng</h3>

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
                    <td className="amount">{p.amount}</td>
                    <td>{p.date}</td>

                    <td>
                      <span className={`badge ${statusColors[p.status]}`}>
                        {p.status}
                      </span>
                    </td>

                    <td>
                      {p.status === "Chưa thanh toán" ? (
                        <button
                          className="btn-update"
                          onClick={() => openConfirmModal(p.id)}
                        >
                          Đánh dấu đã thanh toán
                        </button>
                      ) : (
                        <span className="text-success">✓ Hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CONFIRM PAYMENT MODAL */}
        {modalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="modal-box"
              onClick={(e) => e.stopPropagation()}
            >
              <CheckCircle2 size={40} className="modal-icon" />
              <h3>Xác nhận thanh toán</h3>
              <p>Bạn chắc chắn muốn đánh dấu đơn hàng đã thanh toán?</p>

              <div className="modal-actions">
                <button className="btn confirm" onClick={confirmPayment}>
                  Xác nhận
                </button>
                <button
                  className="btn cancel"
                  onClick={() => setModalOpen(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR MODAL */}
        {qrModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setQrModalOpen(false)}
          >
            <div
              className="qr-modal-box"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn-close-modal"
                onClick={() => setQrModalOpen(false)}
              >
                <X size={22} />
              </button>

              <h3>Mã QR thanh toán</h3>
              <img
                src={getQRCodeUrl(selectedQRCode)}
                className="qr-full"
                alt="QR"
              />
              <p className="qr-hint">Quét mã QR để thanh toán</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
