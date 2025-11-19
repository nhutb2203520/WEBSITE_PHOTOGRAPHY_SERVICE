import { useState } from "react";
import "./HeaderAdmin.css";

export default function HeaderAdmin() {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <header className="admin-header">
      <div className="header-left">
        <h1 className="header-title">Trang quản trị</h1>
      </div>

      <div className="header-center">
        <div className="search-box">
          <span className="material-icons search-icon">search</span>
          <input type="text" placeholder="Tìm kiếm..." />
        </div>
      </div>

      <div className="header-right">
        <span className="material-icons header-icon">chat</span>
        <span className="material-icons header-icon">settings</span>
        <span className="material-icons header-icon">notifications</span>

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
            <span className="user-name">Admin</span>
            <span className="user-role">Quản trị viên</span>
          </div>
          <span className="material-icons dropdown-icon">expand_more</span>
        </div>

        {openMenu && (
          <div className="user-menu">
            <div className="menu-item">
              <span className="material-icons">person</span>
              <p>Thông tin cá nhân</p>
            </div>
            <div className="menu-item">
              <span className="material-icons">lock</span>
              <p>Đổi mật khẩu</p>
            </div>
            <div className="menu-item logout">
              <span className="material-icons">logout</span>
              <p>Đăng xuất</p>
            </div>
          </div>
        )}

        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </div>
    </header>
  );
}
