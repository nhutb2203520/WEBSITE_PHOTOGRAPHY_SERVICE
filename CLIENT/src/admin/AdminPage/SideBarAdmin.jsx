import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom"; 
import { io } from "socket.io-client"; // ✅ Import Socket
import axios from "axios"; // ✅ Import Axios

import notificationAdminApi from "../../apis/notificationAdminService"; 
import adminAuthService from "../../apis/adminAuthService"; // ✅ Import Auth Service để lấy ID Admin
import chatApi from "../../apis/chatApi"; // ✅ Import Chat API để lấy danh sách phòng

import "./SidebarAdmin.css";

const ENDPOINT = "http://localhost:5000"; 

export default function SidebarAdmin() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation(); 
  
  const [unreadCount, setUnreadCount] = useState(0); // Thông báo hệ thống
  const [unreadMessageCount, setUnreadMessageCount] = useState(0); // ✅ Tin nhắn Chat

  const socket = useRef();

  // --- 1. Lấy thông báo hệ thống (Giữ nguyên logic cũ) ---
  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    if (!token) return;

    const fetchUnread = async () => {
      try {
        const res = await notificationAdminApi.getMyNotifications();
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

  // --- 2. LOGIC TIN NHẮN: API + Socket (Tương tự UserSidebar) ---
  useEffect(() => {
    const admin = adminAuthService.getCurrentAdmin();
    if (!admin) return;
    
    const adminId = admin._id || admin.id;

    // A. Gọi API lấy số tin nhắn chưa đọc từ DB (Fix F5 mất số)
    const fetchChatUnread = async () => {
        try {
            const res = await axios.get(`${ENDPOINT}/api/chat/unread/${adminId}`);
            if (res.data) {
                setUnreadMessageCount(res.data.count || 0);
            }
        } catch (error) {
            console.error("Lỗi lấy badge tin nhắn Admin:", error);
        }
    };
    fetchChatUnread();

    // B. Kết nối Socket
    if (!socket.current) {
        socket.current = io(ENDPOINT);
        socket.current.emit("add_user", adminId);
    }

    // C. Hàm xử lý tin nhắn đến
    const handleReceiveMessage = (data) => {
        // Nếu người gửi KHÁC Admin -> Tăng số lượng
        if (data.senderId !== adminId) {
            setUnreadMessageCount(prev => prev + 1);
        }
    };

    // D. Join Room & Đăng ký sự kiện
    const setupSocket = async () => {
        try {
            // Lấy danh sách hội thoại của Admin để Join Room
            // Lưu ý: Admin có thể có rất nhiều chat, cần đảm bảo API này load nhanh
            const res = await chatApi.getConversationsAdmin(adminId);
            const conversations = res.data || res;

            if (Array.isArray(conversations)) {
                conversations.forEach(conv => {
                    socket.current.emit("join_room", conv._id);
                });
            }

            // Hủy listener cũ trước khi thêm mới (Fix Double Count)
            socket.current.off("receive_message"); 
            socket.current.on("receive_message", handleReceiveMessage);

        } catch (error) {
            console.error("Lỗi setup socket Admin:", error);
        }
    };
    setupSocket();

    // Cleanup
    return () => {
        if (socket.current) {
            socket.current.off("receive_message", handleReceiveMessage);
            socket.current.disconnect();
            socket.current = null;
        }
    };
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

        {/* Thông báo hệ thống */}
        <Link to="/admin/notifications" className={`sidebar-item ${isActive("/admin/notifications")}`}>
          <span className="material-icons">notifications</span>
          {!collapsed && <span className="sidebar-text">Thông báo</span>}
          {!collapsed && unreadCount > 0 && (
            <span className="sidebar-badge">{unreadCount}</span>
          )}
        </Link>

        {/* ✅ Tin nhắn Chat (Đã thêm Badge) */}
        <Link 
            to="/admin/messages" 
            className={`sidebar-item ${isActive("/admin/messages")}`}
            onClick={() => setUnreadMessageCount(0)} // Reset khi click
        >
          <span className="material-icons">forum</span>
          {!collapsed && <span className="sidebar-text">Tin nhắn</span>}
          
          {/* Badge Tin nhắn */}
          {!collapsed && unreadMessageCount > 0 && (
            <span className="sidebar-badge red">
                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
            </span>
          )}
        </Link>
      </nav>
    </aside>
  );
}