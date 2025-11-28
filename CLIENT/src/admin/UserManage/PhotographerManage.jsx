import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SidebarAdmin from "../AdminPage/SidebarAdmin.jsx"; 
import HeaderAdmin from "../AdminPage/HeaderAdmin.jsx"; 
import { Search, Trash2, Camera } from "lucide-react";
import "./UserManage.css"; 
import adminUserService from "../../apis/adminUserService";

const API_URL = "http://localhost:5000"; 

export default function PhotographerManage() {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await adminUserService.getPhotographers();
      setPhotographers(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải danh sách nhiếp ảnh gia");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Cảnh báo: Xóa thợ ảnh sẽ ảnh hưởng đến các đơn hàng liên quan. Bạn chắc chắn chứ?")) {
      try {
        await adminUserService.deleteUser(id);
        setPhotographers(prev => prev.filter(u => u._id !== id));
        toast.success("Đã xóa thành công!");
      } catch (error) {
        toast.error("Lỗi khi xóa");
      }
    }
  };

  // ✅ Helper lấy ảnh chuẩn
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/\\/g, "/"); // Sửa lỗi path Windows
    const finalPath = cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath;
    return `${API_URL}/${finalPath}`;
  };

  const filteredData = photographers.filter(u => 
    (u.HoTen || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />
        
        <div className="page-header">
          <h2>Quản lý Nhiếp ảnh gia</h2>
          <div className="stats-badge" style={{background:'#e0e7ff', color:'#4f46e5', padding:'5px 10px', borderRadius:'8px', fontWeight:'600'}}>
             Tổng: {photographers.length}
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <div className="section-title">Danh sách đối tác</div>
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Tìm thợ ảnh..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nhiếp ảnh gia</th>
                  <th>Liên hệ</th>
                  <th>Thông tin ngân hàng</th>
                  <th>Ngày tham gia</th>
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
                          {/* Logic hiển thị Avatar + Fallback */}
                          {user.Avatar ? (
                             <>
                                <img 
                                    src={getAvatarUrl(user.Avatar)} 
                                    alt="" 
                                    className="user-avatar"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        const placeholder = e.target.parentElement.querySelector('.avatar-placeholder');
                                        if(placeholder) placeholder.style.display = 'flex';
                                    }} 
                                />
                                <div className="user-avatar avatar-placeholder" style={{display: 'none'}}>
                                    <Camera size={20}/>
                                </div>
                             </>
                          ) : (
                             <div className="user-avatar"><Camera size={20}/></div>
                          )}
                          <div className="user-info">
                            <span className="user-name">{user.HoTen}</span>
                            <span className="user-email">{user.TenDangNhap}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{fontSize:'13px'}}>
                            <div>{user.SoDienThoai || "---"}</div>
                            <div style={{color:'#6b7280'}}>{user.Email}</div>
                        </div>
                      </td>
                      <td>
                        {user.TenNganHang && user.SoTaiKhoan ? (
                            <div style={{fontSize:'13px'}}>
                                <div style={{fontWeight:'600', color:'#2563eb'}}>{user.TenNganHang}</div>
                                <div style={{fontFamily:'monospace'}}>{user.SoTaiKhoan}</div>
                            </div>
                        ) : (
                            <span style={{fontSize:'12px', color:'#9ca3af', fontStyle:'italic'}}>Chưa cập nhật</span>
                        )}
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <button className="btn-delete" onClick={() => handleDelete(user._id)}>
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