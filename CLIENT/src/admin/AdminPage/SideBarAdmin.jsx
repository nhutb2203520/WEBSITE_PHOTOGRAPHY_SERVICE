import { useState } from "react";
import { Link, useLocation } from "react-router-dom"; // Thêm useLocation để active menu
import "./SidebarAdmin.css";

export default function SidebarAdmin() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation(); // Lấy đường dẫn hiện tại

  // Hàm kiểm tra active
  const isActive = (path) => location.pathname === path ? "active" : "";

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
        <Link to="/admin/customers" className={`sidebar-item ${isActive("/admin/customers")}`}>
          <span className="material-icons">group</span>
          {!collapsed && <span className="sidebar-text">Khách hàng</span>}
        </Link>

        <Link to="/admin/photographers" className={`sidebar-item ${isActive("/admin/photographers")}`}>
          <span className="material-icons">photo_camera</span>
          {!collapsed && <span className="sidebar-text">Nhiếp ảnh gia</span>}
        </Link>

        {/* ✅ MỚI: QUẢN LÝ ĐƠN HÀNG */}
        <Link to="/admin/order-manage" className={`sidebar-item ${isActive("/admin/order-manage")}`}>
          <span className="material-icons">receipt_long</span>
          {!collapsed && <span className="sidebar-text">Quản lý đơn hàng</span>}
        </Link>

        <Link to="/admin/complaints" className={`sidebar-item ${isActive("/admin/complaints")}`}>
          <span className="material-icons">report</span>
          {!collapsed && <span className="sidebar-text">Khiếu nại</span>}
        </Link>

        <Link to="/admin/packages" className={`sidebar-item ${isActive("/admin/packages")}`}>
          <span className="material-icons">inventory</span>
          {!collapsed && <span className="sidebar-text">Gói dung lượng</span>}
        </Link>

        <Link to="/admin/service-fee" className={`sidebar-item ${isActive("/admin/service-fee")}`}>
          <span className="material-icons">payments</span>
          {!collapsed && <span className="sidebar-text">Chi phí dịch vụ</span>}
        </Link>

        <Link to="/admin/payment-manage" className={`sidebar-item ${isActive("/admin/payment-manage")}`}>
          <span className="material-icons">account_balance_wallet</span>
          {!collapsed && <span className="sidebar-text">Thanh toán</span>}
        </Link>

        <Link to="/admin/notifications" className={`sidebar-item ${isActive("/admin/notifications")}`}>
          <span className="material-icons">notifications</span>
          {!collapsed && <span className="sidebar-text">Thông báo</span>}
        </Link>

        <Link to="/admin/messages" className={`sidebar-item ${isActive("/admin/messages")}`}>
          <span className="material-icons">forum</span>
          {!collapsed && <span className="sidebar-text">Tin nhắn</span>}
        </Link>
      </nav>
    </aside>
  );
}