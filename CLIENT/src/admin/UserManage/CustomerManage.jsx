import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SidebarAdmin from "../AdminPage/SidebarAdmin";
import HeaderAdmin from "../AdminPage/HeaderAdmin";
import { Search, Trash2, User } from "lucide-react";
import "./UserManage.css"; // Dùng chung CSS
import adminUserService from "../../apis/adminUserService";

// URL ảnh mặc định hoặc từ server
const API_URL = "http://localhost:5000"; 

export default function CustomerManage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await adminUserService.getCustomers();
      setCustomers(res.data?.data || []);
    } catch (error) {
      toast.error("Lỗi tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
      try {
        await adminUserService.deleteUser(id);
        setCustomers(prev => prev.filter(u => u._id !== id));
        toast.success("Đã xóa thành công!");
      } catch (error) {
        toast.error("Lỗi khi xóa");
      }
    }
  };

  const filteredData = customers.filter(u => 
    (u.HoTen || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.Email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />
        
        <div className="page-header">
          <h2>Quản lý Khách hàng</h2>
          <div className="stats-badge">Tổng: {customers.length}</div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <div className="section-title">Danh sách tài khoản</div>
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Tìm theo tên, email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Số điện thoại</th>
                  <th>Ngày tham gia</th>
                  <th>Địa chỉ</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan="5" style={{textAlign:"center", padding: "30px"}}>Đang tải...</td></tr>
                ) : filteredData.length === 0 ? (
                   <tr><td colSpan="5" style={{textAlign:"center", padding: "30px"}}>Không tìm thấy dữ liệu</td></tr>
                ) : (
                  filteredData.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          {user.Avatar ? (
                             <img src={`${API_URL}/${user.Avatar}`} alt="" className="user-avatar" />
                          ) : (
                             <div className="user-avatar">{user.HoTen?.charAt(0)}</div>
                          )}
                          <div className="user-info">
                            <span className="user-name">{user.HoTen}</span>
                            <span className="user-email">{user.Email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{user.SoDienThoai || "---"}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>{user.DiaChi || "Chưa cập nhật"}</td>
                      <td>
                        <button className="btn-delete" onClick={() => handleDelete(user._id)} title="Xóa tài khoản">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}