import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SidebarAdmin from "./SidebarAdmin";
import HeaderAdmin from "./HeaderAdmin";
import "./PaymentManage.css"; // Đảm bảo file CSS này CÓ TỒN TẠI
import { PlusCircle, Edit2, Trash2, X } from "lucide-react";

// ✅ Import service vừa tạo ở Bước 1
import serviceFeeService from "../../apis/serviceFeeService"; 

export default function ServiceFeeManage() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [currentFee, setCurrentFee] = useState({
    id: null, name: "", percentage: 10, description: "", isActive: true
  });

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await serviceFeeService.getAllFees();
      // ✅ Check an toàn để tránh crash nếu API trả về null
      setFees(res.data?.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      // ✅ Convert lỗi sang string để tránh crash toast
      toast.error(String(error.response?.data?.message || "Lỗi tải dữ liệu"));
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const openModal = (fee = null) => {
    if (fee) {
      setCurrentFee({
        id: fee._id,
        name: fee.name,
        percentage: fee.percentage,
        description: fee.description,
        isActive: fee.isActive
      });
    } else {
      setCurrentFee({ id: null, name: "", percentage: 10, description: "", isActive: true });
    }
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa loại phí này?")) return;
    try {
      await serviceFeeService.deleteFee(id);
      setFees(prev => prev.filter(f => f._id !== id));
      toast.success("Đã xóa thành công");
    } catch (error) {
      toast.error("Lỗi khi xóa");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentFee.name || currentFee.percentage < 0) {
      return toast.warning("Vui lòng nhập tên và % hợp lệ");
    }

    try {
      if (currentFee.id) {
        const res = await serviceFeeService.updateFee(currentFee.id, currentFee);
        setFees(prev => prev.map(f => f._id === currentFee.id ? res.data.data : f));
        toast.success("Cập nhật thành công");
      } else {
        const res = await serviceFeeService.createFee(currentFee);
        setFees([res.data.data, ...fees]);
        toast.success("Thêm mới thành công");
      }
      setModalOpen(false);
    } catch (error) {
      // ✅ Xử lý an toàn cho toast
      const msg = error.response?.data?.message || "Lỗi hệ thống";
      toast.error(typeof msg === 'object' ? JSON.stringify(msg) : String(msg));
    }
  };

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />

        <div className="page-header">
          <h2>Quản lý Các Loại Phí</h2>
        </div>

        <button className="btn add-method" onClick={() => openModal(null)}>
          <PlusCircle size={20} /> Thêm loại phí mới
        </button>

        <div className="orders-section">
          <h3 className="section-title">Danh sách phí dịch vụ (Tính theo % gói chụp)</h3>
          
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên loại phí</th>
                  <th>Tỷ lệ (%)</th>
                  <th>Mô tả</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center">Đang tải...</td></tr>
                ) : fees.length === 0 ? (
                    <tr><td colSpan="5" className="text-center">Chưa có loại phí nào</td></tr>
                ) : (
                  fees.map((fee) => (
                    <tr key={fee._id}>
                      <td style={{fontWeight: "600"}}>{fee.name}</td>
                      <td style={{color: "#2563eb", fontWeight: "bold"}}>{fee.percentage}%</td>
                      <td className="text-muted">{fee.description || "-"}</td>
                      <td>
                        <span className={`status-badge ${fee.isActive ? 'success' : 'default'}`}>
                          {fee.isActive ? "Đang áp dụng" : "Tạm ẩn"}
                        </span>
                      </td>
                      <td>
                        <div style={{display: 'flex', gap: '10px'}}>
                           <Edit2 size={18} className="icon-edit" onClick={() => openModal(fee)} />
                           <Trash2 size={18} className="icon-trash" onClick={() => handleDelete(fee._id)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL FORM --- */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{textAlign: "left", width: "450px"}}>
              <div className="modal-header" style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
                <h3 style={{margin: 0}}>{currentFee.id ? "Chỉnh sửa phí" : "Thêm phí mới"}</h3>
                <X size={24} style={{cursor: "pointer"}} onClick={() => setModalOpen(false)} />
              </div>
              
              <form onSubmit={handleSubmit} style={{display: "flex", flexDirection: "column", gap: "15px"}}>
                <div className="form-group">
                  <label>Tên loại phí *</label>
                  <input 
                    type="text" 
                    value={currentFee.name}
                    onChange={(e) => setCurrentFee({...currentFee, name: e.target.value})}
                    required
                    style={{width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd"}}
                  />
                </div>

                <div className="form-group">
                  <label>Tỷ lệ phần trăm (%) *</label>
                  <div style={{position: "relative"}}>
                    <input 
                      type="number" 
                      min="0" max="100"
                      value={currentFee.percentage}
                      onChange={(e) => setCurrentFee({...currentFee, percentage: Number(e.target.value)})}
                      required
                      style={{width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd"}}
                    />
                    <span style={{position: "absolute", right: "10px", top: "10px", fontWeight: "bold", color: "#666"}}>%</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả (Tùy chọn)</label>
                  <textarea 
                    rows="3"
                    value={currentFee.description}
                    onChange={(e) => setCurrentFee({...currentFee, description: e.target.value})}
                    style={{width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd"}}
                  />
                </div>

                <div className="form-toggle">
                  <label style={{fontWeight: "bold"}}>Kích hoạt ngay?</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={currentFee.isActive} 
                      onChange={(e) => setCurrentFee({...currentFee, isActive: e.target.checked})}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="modal-buttons" style={{marginTop: "10px"}}>
                  <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Hủy</button>
                  <button type="submit" className="btn-confirm">
                    {currentFee.id ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}