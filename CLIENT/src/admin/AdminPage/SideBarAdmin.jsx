import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; 
import notificationAdminApi from "../../apis/notificationAdminService"; 
import "./SidebarAdmin.css";

export default function SidebarAdmin() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation(); 
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // ✅ FIX 1: Dùng đúng key "adminToken"
    const token = sessionStorage.getItem("adminToken");
    if (!token) return;

    const fetchUnread = async () => {
      try {
        const res = await notificationAdminApi.getMyNotifications();
        
        // ✅ FIX 2: Truy cập đúng cấp dữ liệu (res.data.unreadCount)
        if (res.data && res.data.unreadCount !== undefined) {
          setUnreadCount(res.data.unreadCount);
        }
      } catch (error) {
        // console.error("Lỗi badge");
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path) => location.pathname === path ? "active" : "";

  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? ">" : "<"}
      </button>

      <div className="sidebar-title">
        {!collapsed && "ADMIN"}
      </div>

      <nav className="sidebar-menu">
        <Link to="/admin/customer-manage" className={`sidebar-item ${isActive("/admin/customer-manage")}`}>
          <span className="material-icons">group</span>
          {!collapsed && <span className="sidebar-text">Khách hàng</span>}
        </Link>

        <Link to="/admin/photographer-manage" className={`sidebar-item ${isActive("/admin/photographer-manage")}`}>
          <span className="material-icons">photo_camera</span>
          {!collapsed && <span className="sidebar-text">Nhiếp ảnh gia</span>}
        </Link>

        <Link to="/admin/order-manage" className={`sidebar-item ${isActive("/admin/order-manage")}`}>
          <span className="material-icons">receipt_long</span>
          {!collapsed && <span className="sidebar-text">Quản lý đơn hàng</span>}
        </Link>

        <Link to="/admin/complaint-manage" className={`sidebar-item ${isActive("/admin/complaint-manage")}`}>
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

        {/* ✅ Hiển thị Badge */}
        <Link to="/admin/notifications" className={`sidebar-item ${isActive("/admin/notifications")}`}>
          <span className="material-icons">notifications</span>
          {!collapsed && <span className="sidebar-text">Thông báo</span>}
          
          {!collapsed && unreadCount > 0 && (
            <span className="sidebar-badge">{unreadCount}</span>
          )}
        </Link>

        <Link to="/admin/messages" className={`sidebar-item ${isActive("/admin/messages")}`}>
          <span className="material-icons">forum</span>
          {!collapsed && <span className="sidebar-text">Tin nhắn</span>}
        </Link>
      </nav>
    </aside>
  );
}