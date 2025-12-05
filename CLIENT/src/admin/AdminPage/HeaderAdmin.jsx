import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import adminAuthService from "../../apis/adminAuthService";
import "./HeaderAdmin.css";

export default function HeaderAdmin() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = adminAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const admin = adminAuthService.getCurrentAdmin();
        setAdminInfo(admin);
        
        // ✅ Khởi động auto-refresh nếu chưa chạy
        adminAuthService.initAutoRefresh();
      }
    };

    checkAuth();

    // Listen for storage changes (không dùng cho sessionStorage, nhưng giữ lại)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      await adminAuthService.logout();
    }
  };

  const handleLogin = () => {
    navigate("/admin/login");
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        {/* ✅ Cập nhật: Thêm onClick để quay về Dashboard */}
        <h1 
          className="header-title" 
          onClick={() => navigate("/admin-page")} 
          style={{ cursor: "pointer" }} 
          title="Quay lại Dashboard"
        >
          Trang quản trị
        </h1>
      </div>

      <div className="header-center">
        {/* ✅ ĐÃ XÓA THANH TÌM KIẾM THEO YÊU CẦU */}
      </div>

      <div className="header-right">

        {isAuthenticated ? (
          <>
            {/* User đã đăng nhập */}
            <div
              className="header-user"
              onClick={() => setOpenMenu(!openMenu)}
            >
              <img
                src="https://i.pravatar.cc/150?img=12"
                alt="avatar"
                className="user-avatar"
              />
              <div className="user-info">
                <span className="user-name">
                  {adminInfo?.username || "Admin"}
                </span>
                <span className="user-role">Quản trị viên</span>
              </div>
              <span className="material-icons dropdown-icon">expand_more</span>
            </div>

            {openMenu && (
              <div className="user-menu">
                <div
                  className="menu-item logout"
                  onClick={handleLogout}
                  style={{ cursor: "pointer" }}
                >
                  <span className="material-icons">logout</span>
                  <p>Đăng xuất</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* User chưa đăng nhập */}
            <button 
              className="btn-login"
              onClick={handleLogin}
              style={{
                padding: "8px 16px",
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>login</span>
              Đăng nhập
            </button>
          </>
        )}

        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </div>
    </header>
  );
}