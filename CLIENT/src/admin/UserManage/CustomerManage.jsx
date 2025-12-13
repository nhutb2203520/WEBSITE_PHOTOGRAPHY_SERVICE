import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SidebarAdmin from "../AdminPage/SidebarAdmin.jsx"; 
import HeaderAdmin from "../AdminPage/HeaderAdmin.jsx"; 
import { Search, Lock, Unlock, Camera, User } from "lucide-react"; 
import "./UserManage.css"; // Sử dụng chung CSS với UserManage
import adminUserService from "../../apis/adminUserService";

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
      // ✅ Gọi API lấy danh sách Khách hàng (không phải Photographer)
      const res = await adminUserService.getCustomers();
      
      // ✅ Xử lý dữ liệu: Mapping trạng thái từ Backend (MaTT) sang Boolean (isActive)
      const formattedData = (res.data || []).map(user => ({
        ...user,
        // Logic mapping giống hệt PhotographerManage
        isActive: user.MaTT?.TenTT === 'active' || user.MaTT === 'active' 
      }));

      setCustomers(formattedData);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Hàm thay đổi trạng thái (Dùng chung logic với Photographer)
  const handleToggleStatus = async (id, currentIsActive) => {
    const newStatusString = currentIsActive ? "locked" : "active"; 
    const actionText = currentIsActive ? "Khóa" : "Mở khóa"; 
    
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản khách hàng này không?`)) {
      try {
        await adminUserService.updateUserStatus(id, newStatusString);
        
        // Cập nhật State Local
        setCustomers(prev => prev.map(u => 
           u._id === id ? { ...u, isActive: !currentIsActive } : u
        ));
        
        toast.success(`Đã ${actionText} tài khoản thành công!`);
      } catch (error) {
        console.error(error);
        toast.error(`Lỗi khi ${actionText} tài khoản. Kiểm tra lại Server.`);
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

  const filteredData = customers.filter(u => 
    (u.HoTen || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.TenDangNhap || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <SidebarAdmin />
      <main className="admin-main">
        <HeaderAdmin />
        
        <div className="page-header">
          <h2>Quản lý Khách hàng</h2>
          <div className="stats-badge" style={{background:'#e0e7ff', color:'#4f46e5', padding:'5px 10px', borderRadius:'8px', fontWeight:'600'}}>
             Tổng: {customers.length}
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <div className="search-box">
        
              <input 
                type="text" 
                placeholder="Tìm tên, tài khoản..." 
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
                  <th>Liên hệ</th>
                  <th>Thông tin ngân hàng</th>
                  <th style={{textAlign: 'center'}}>Trạng thái</th>
                  <th style={{textAlign: 'center'}}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan="5" style={{textAlign:"center", padding: "30px"}}>Đang tải dữ liệu...</td></tr>
                ) : filteredData.length === 0 ? (
                   <tr><td colSpan="5" style={{textAlign:"center", padding: "30px"}}>Không tìm thấy dữ liệu</td></tr>
                ) : (
                  filteredData.map((user) => (
                    <tr key={user._id} className={!user.isActive ? "row-disabled" : ""}>
                      {/* Cột 1: Thông tin User */}
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
                                    <User size={20}/>
                                </div>
                             </>
                          ) : (
                             <div className="user-avatar"><User size={20}/></div>
                          )}
                          <div className="user-info">
                            <span className="user-name">{user.HoTen}</span>
                            <span className="user-email" style={{color: '#6366f1'}}>@{user.TenDangNhap}</span>
                            {/* Hiển thị thêm mã khách hàng nếu có */}
                            {user.MaKhachHang && <span style={{fontSize:'11px', color:'#9ca3af'}}>{user.MaKhachHang}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Liên hệ */}
                      <td>
                        <div style={{fontSize:'13px', display:'flex', flexDirection:'column', gap:'4px'}}>
                            <span style={{fontWeight:'500'}}>{user.SoDienThoai || "---"}</span>
                            <span style={{color:'#6b7280'}}>{user.Email}</span>
                            {/* Khách hàng thường có địa chỉ, hiển thị ở đây */}
                            {user.DiaChi && <span style={{fontSize:'11px', color:'#4b5563', fontStyle:'italic'}}>{user.DiaChi}</span>}
                        </div>
                      </td>

                      {/* Cột 3: Ngân hàng (Nếu khách hàng có nhập) */}
                      <td>
                        {user.TenNganHang && user.SoTaiKhoan ? (
                            <div style={{fontSize:'13px'}}>
                                <div style={{fontWeight:'600', color:'#2563eb'}}>{user.TenNganHang}</div>
                                <div style={{fontFamily:'monospace', background:'#f3f4f6', padding:'2px 6px', borderRadius:'4px', width:'fit-content'}}>
                                  {user.SoTaiKhoan}
                                </div>
                            </div>
                        ) : (
                            <span style={{fontSize:'12px', color:'#9ca3af', fontStyle:'italic'}}>Chưa cập nhật</span>
                        )}
                      </td>

                      {/* Cột 4: Hiển thị trạng thái (Badge) */}
                      <td style={{textAlign: 'center'}}>
                        <span 
                          style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: user.isActive ? '#dcfce7' : '#fee2e2',
                              color: user.isActive ? '#166534' : '#991b1b',
                              border: `1px solid ${user.isActive ? '#bbf7d0' : '#fecaca'}`,
                              display: 'inline-block',
                              minWidth: '80px'
                          }}
                        >
                          {user.isActive ? "Hoạt động" : "Đã khóa" }
                        </span>
                      </td>

                      {/* Cột 5: Nút hành động */}
                      <td style={{textAlign: 'center'}}>
                        <button 
                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                            title={user.isActive ? "Khóa tài khoản này" : "Mở khóa tài khoản này"}
                            style={{
                                border: 'none',
                                background: user.isActive ? '#fee2e2' : '#dcfce7', 
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: user.isActive ? '#ef4444' : '#10b981',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.filter = 'brightness(0.95)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.filter = 'brightness(1)';
                            }}
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