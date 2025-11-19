import { useState } from "react";
import "./SidebarAdmin.css";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />

      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? ">" : "<"}
      </button>

      {!collapsed && <h2 className="sidebar-title">ADMIN</h2>}

      <nav className="sidebar-menu">
        <div className="sidebar-item">
          <span className="material-icons">group</span>
          <span className="sidebar-text">Khách hàng</span>
        </div>

        <div className="sidebar-item">
          <span className="material-icons">photo_camera</span>
          <span className="sidebar-text">Nhiếp ảnh gia</span>
        </div>

        <div className="sidebar-item">
          <span className="material-icons">report</span>
          <span className="sidebar-text">Khiếu nại</span>
        </div>

        <div className="sidebar-item">
          <span className="material-icons">inventory</span>
          <span className="sidebar-text">Gói dung lượng</span>
        </div>

        <div className="sidebar-item">
          <span className="material-icons">payments</span>
          <span className="sidebar-text">Chi phí dịch vụ</span>
        </div>

        <div className="sidebar-item">
          <span className="material-icons">account_balance_wallet</span>
          <span className="sidebar-text">Thanh toán</span>
        </div>

        <div className="sidebar-item">
          <span className="material-icons">notifications</span>
          <span className="sidebar-text">Thông báo</span>
        </div>

        <div className="sidebar-item">
          <span className="material-icons">forum</span>
          <span className="sidebar-text">Tin nhắn</span>
        </div>
      </nav>
    </aside>
  );
}
