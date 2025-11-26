import { useState } from "react";
import { Link, useLocation } from "react-router-dom"; 
import "./SidebarAdmin.css";

export default function SidebarAdmin() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation(); 

  // Hàm kiểm tra active: so sánh chính xác đường dẫn
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
        
        {/* ✅ ĐÃ CẬP NHẬT: Quản lý Khách hàng */}
        <Link to="/admin/customer-manage" className={`sidebar-item ${isActive("/admin/customer-manage")}`}>
          <span className="material-icons">group</span>
          {!collapsed && <span className="sidebar-text">Khách hàng</span>}
        </Link>

        {/* ✅ ĐÃ CẬP NHẬT: Quản lý Nhiếp ảnh gia */}
        <Link to="/admin/photographer-manage" className={`sidebar-item ${isActive("/admin/photographer-manage")}`}>
          <span className="material-icons">photo_camera</span>
          {!collapsed && <span className="sidebar-text">Nhiếp ảnh gia</span>}
        </Link>

        {/* Quản lý Đơn hàng */}
        <Link to="/admin/order-manage" className={`sidebar-item ${isActive("/admin/order-manage")}`}>
          <span className="material-icons">receipt_long</span>
          {!collapsed && <span className="sidebar-text">Quản lý đơn hàng</span>}
        </Link>

        {/* Khiếu nại */}
        <Link to="/admin/complaint-manage" className={`sidebar-item ${isActive("/admin/complaint-manage")}`}>
          <span className="material-icons">report</span>
          {!collapsed && <span className="sidebar-text">Khiếu nại</span>}
        </Link>

        {/* Gói dung lượng (Giữ nguyên nếu chưa đổi route) */}
        <Link to="/admin/packages" className={`sidebar-item ${isActive("/admin/packages")}`}>
          <span className="material-icons">inventory</span>
          {!collapsed && <span className="sidebar-text">Gói dung lượng</span>}
        </Link>

        {/* Chi phí dịch vụ */}
        <Link to="/admin/service-fee" className={`sidebar-item ${isActive("/admin/service-fee")}`}>
          <span className="material-icons">payments</span>
          {!collapsed && <span className="sidebar-text">Chi phí dịch vụ</span>}
        </Link>

        {/* Thanh toán */}
        <Link to="/admin/payment-manage" className={`sidebar-item ${isActive("/admin/payment-manage")}`}>
          <span className="material-icons">account_balance_wallet</span>
          {!collapsed && <span className="sidebar-text">Thanh toán</span>}
        </Link>

        {/* Thông báo */}
        <Link to="/admin/notifications" className={`sidebar-item ${isActive("/admin/notifications")}`}>
          <span className="material-icons">notifications</span>
          {!collapsed && <span className="sidebar-text">Thông báo</span>}
        </Link>

        {/* Tin nhắn */}
        <Link to="/admin/messages" className={`sidebar-item ${isActive("/admin/messages")}`}>
          <span className="material-icons">forum</span>
          {!collapsed && <span className="sidebar-text">Tin nhắn</span>}
        </Link>
      </nav>
    </aside>
  );
}