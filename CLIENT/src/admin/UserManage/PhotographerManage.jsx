import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SidebarAdmin from "../AdminPage/SidebarAdmin.jsx"; 
import HeaderAdmin from "../AdminPage/HeaderAdmin.jsx"; 
import { Search, Lock, Unlock, Camera } from "lucide-react"; // Import icon Lock/Unlock
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

  // ✅ Hàm thay đổi trạng thái (Thay vì xóa)
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus; // Đảo ngược trạng thái
    const actionText = newStatus ? "Mở khóa" : "Khóa";
    
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này không?`)) {
      try {
        // Giả sử API updateStatusUser nhận vào { isActive: boolean }
        // Cần đảm bảo backend có API này, nếu chưa có hãy báo tôi để bổ sung service
        await adminUserService.updateUserStatus(id, { isActive: newStatus });
        
        // Cập nhật state local
        setPhotographers(prev => prev.map(u => 
            u._id === id ? { ...u, isActive: newStatus } : u
        ));
        
        toast.success(`Đã ${actionText} thành công!`);
      } catch (error) {
        console.error(error);
        toast.error(`Lỗi khi ${actionText} tài khoản`);
      }
    }
  };

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/\\/g, "/");
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
                  <th>Trạng thái</th> {/* Cột mới hiển thị trạng thái */}
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
                    <tr key={user._id} className={!user.isActive ? "row-disabled" : ""}>
                      <td>
                        <div className="user-cell">
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
                      {/* Cột hiển thị trạng thái */}
                      <td>
                        <span 
                          className={`status-badge ${user.isActive ? 'success' : 'danger'}`}
                          style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: user.isActive ? '#dcfce7' : '#fee2e2',
                              color: user.isActive ? '#10e910ff' : '#043f02ff'
                          }}
                        >
                          {user.isActive ? "Đã khóa" : "Hoạt động" }
                        </span>
                      </td>
                      <td>
                        {/* Nút Khóa/Mở khóa */}
                        <button 
                            className={`btn-action ${user.isActive ? 'btn-lock' : 'btn-unlock'}`} 
                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                            title={user.isActive ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: user.isActive ? '#ef4444' : '#10b981',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {user.isActive ? <Lock size={18} /> : <Unlock size={18} />}
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