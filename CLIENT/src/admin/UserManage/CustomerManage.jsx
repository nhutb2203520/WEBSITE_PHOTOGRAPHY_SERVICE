import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SidebarAdmin from "../AdminPage/SidebarAdmin.jsx"; 
import HeaderAdmin from "../AdminPage/HeaderAdmin.jsx"; 
import { Search, Trash2, User } from "lucide-react";
import "./UserManage.css"; 
import adminUserService from "../../apis/adminUserService.js";

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
      setCustomers(res.data || []); 
    } catch (error) {
      console.error(error);
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

  // ✅ Hàm xử lý URL ảnh: Fix lỗi đường dẫn Windows (\) và đảm bảo URL chuẩn
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path; // Ảnh online (Google/Facebook)
    
    // Thay thế dấu backslash (\) thành slash (/) cho đúng chuẩn URL
    const cleanPath = path.replace(/\\/g, "/");
    
    // Loại bỏ dấu / ở đầu nếu có để tránh double slash
    const finalPath = cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath;
    
    return `${API_URL}/${finalPath}`;
  };

  // ✅ Xử lý khi ảnh bị lỗi (404) -> Ẩn ảnh đi để hiện Avatar chữ cái
  const handleImageError = (e) => {
    e.target.style.display = 'none'; // Ẩn thẻ img
    e.target.nextSibling.style.display = 'flex'; // Hiện thẻ div avatar chữ (nếu cấu trúc HTML cho phép)
    // Tuy nhiên, cách đơn giản hơn là set lại src null ở cấp state, nhưng ở đây ta thao tác DOM trực tiếp cho nhanh
    e.target.parentElement.classList.add('image-error'); 
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
                          {/* Logic hiển thị Avatar thông minh */}
                          {user.Avatar ? (
                             <>
                               <img 
                                 src={getAvatarUrl(user.Avatar)} 
                                 alt="" 
                                 className="user-avatar" 
                                 onError={(e) => {
                                    e.target.style.display = 'none'; // Ẩn ảnh lỗi
                                    // Tìm element kế tiếp (placeholder) để hiển thị nó
                                    const placeholder = e.target.parentElement.querySelector('.avatar-placeholder');
                                    if(placeholder) placeholder.style.display = 'flex';
                                 }}
                               />
                               {/* Placeholder ẩn sẵn, chỉ hiện khi ảnh lỗi */}
                               <div className="user-avatar avatar-placeholder" style={{display: 'none'}}>
                                  {user.HoTen?.charAt(0)?.toUpperCase()}
                               </div>
                             </>
                          ) : (
                             <div className="user-avatar">{user.HoTen?.charAt(0)?.toUpperCase()}</div>
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