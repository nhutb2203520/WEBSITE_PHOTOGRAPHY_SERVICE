import { useState } from "react";
import { Link } from "react-router-dom";
import "./SidebarAdmin.css";

export default function SidebarAdmin() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />

      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? ">" : "<"}
      </button>

      <div className="sidebar-title">
        {!collapsed && "ADMIN"}
      </div>

      <nav className="sidebar-menu">
        <Link to="/admin/customers" className="sidebar-item">
          <span className="material-icons">group</span>
          {!collapsed && <span className="sidebar-text">Khách hàng</span>}
        </Link>

        <Link to="/admin/photographers" className="sidebar-item">
          <span className="material-icons">photo_camera</span>
          {!collapsed && <span className="sidebar-text">Nhiếp ảnh gia</span>}
        </Link>

        <Link to="/admin/complaints" className="sidebar-item">
          <span className="material-icons">report</span>
          {!collapsed && <span className="sidebar-text">Khiếu nại</span>}
        </Link>

        <Link to="/admin/packages" className="sidebar-item">
          <span className="material-icons">inventory</span>
          {!collapsed && <span className="sidebar-text">Gói dung lượng</span>}
        </Link>

        <Link to="/admin/service-costs" className="sidebar-item">
          <span className="material-icons">payments</span>
          {!collapsed && <span className="sidebar-text">Chi phí dịch vụ</span>}
        </Link>

        <Link to="/admin/payment-manage" className="sidebar-item">
          <span className="material-icons">account_balance_wallet</span>
          {!collapsed && <span className="sidebar-text">Thanh toán</span>}
        </Link>

        <Link to="/admin/notifications" className="sidebar-item">
          <span className="material-icons">notifications</span>
          {!collapsed && <span className="sidebar-text">Thông báo</span>}
        </Link>

        <Link to="/admin/messages" className="sidebar-item">
          <span className="material-icons">forum</span>
          {!collapsed && <span className="sidebar-text">Tin nhắn</span>}
        </Link>
      </nav>
    </aside>
  );
}
