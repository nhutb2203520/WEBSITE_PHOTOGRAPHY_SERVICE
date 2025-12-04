import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  User, Images, Bell, MessageCircle, Menu, X, 
  ShoppingBag, Heart, Package, CalendarCheck, CalendarDays 
} from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { io } from "socket.io-client";
import chatApi from '../../apis/chatApi'; 
import './Sidebar.css';

const ENDPOINT = "http://localhost:5000"; 

export default function Sidebar({ isOpen: propsIsOpen, toggleSidebar: propsToggleSidebar }) {
  const location = useLocation();
  const { user } = useSelector(state => state.user);
  
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [unreadMessageCount, setUnreadMessageCount] = useState(0); 

  const socket = useRef();

  const isControlled = propsIsOpen !== undefined && propsToggleSidebar !== undefined;
  const isOpen = isControlled ? propsIsOpen : internalIsOpen;
  
  const handleToggle = () => {
    if (isControlled) propsToggleSidebar(); 
    else setInternalIsOpen(!internalIsOpen); 
  };

  const isPhotographer = user?.isPhotographer;
  const storageUsed = user?.storageUsed || 0; 
  const storageTotal = user?.storageTotal || 30; 
  const storagePercent = Math.min((storageUsed / storageTotal) * 100, 100);

  // 1. Thông báo hệ thống
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:5000/api/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) setUnreadCount(res.data.unreadCount || 0);
      } catch (error) { console.error(error); }
    };
    fetchNotifications();
  }, []);

  // 2. Chat Realtime & Badge
  useEffect(() => {
    if (!user) return;
    const userId = user._id || user.id;

    // A. Lấy số lượng tin chưa đọc từ DB (Fix F5)
    const fetchChatUnread = async () => {
        try {
            const res = await axios.get(`${ENDPOINT}/api/chat/unread/${userId}`);
            if (res.data) setUnreadMessageCount(res.data.count || 0);
        } catch (error) {
            console.error("Lỗi lấy badge tin nhắn:", error);
        }
    };
    fetchChatUnread();

    // B. Socket
    if (!socket.current) {
        socket.current = io(ENDPOINT);
        socket.current.emit("add_user", userId);
    }

    const handleReceiveMessage = (data) => {
        // Chỉ tăng nếu tin nhắn KHÔNG phải của mình
        if (data.senderId !== userId) {
            // Nếu đang ở trang tin nhắn thì có thể không cần tăng (tùy logic), 
            // nhưng ở Sidebar tổng quát thì cứ tăng để báo hiệu
            setUnreadMessageCount(prev => prev + 1);
        }
    };

    const setupSocket = async () => {
        try {
            const res = await chatApi.getUserConversations(userId);
            const conversations = res.data || res;
            if (Array.isArray(conversations)) {
                conversations.forEach(c => socket.current.emit("join_room", c._id));
            }
            
            // Xóa listener cũ trước khi thêm mới
            socket.current.off("receive_message"); 
            socket.current.on("receive_message", handleReceiveMessage);
        } catch (e) { console.error(e); }
    };
    setupSocket();

    return () => {
        if (socket.current) {
            socket.current.off("receive_message", handleReceiveMessage);
            socket.current.disconnect();
            socket.current = null;
        }
    };
  }, [user]);

  const baseMenuItems = [
    { path: '/my-account', icon: <User size={24} />, label: 'Tài khoản', badge: null },
    { path: '/my-orders', icon: <ShoppingBag size={24} />, label: 'Đơn hàng', badge: null },
    { path: '/favorites', icon: <Heart size={24} />, label: 'Yêu thích', badge: null },
    { path: '/albums', icon: <Images size={24} />, label: 'Album', badge: null },
    { path: '/notifications', icon: <Bell size={24} />, label: 'Thông báo', badge: unreadCount > 0 ? unreadCount : null },
    { 
        path: '/messages', 
        icon: <MessageCircle size={24} />, 
        label: 'Tin nhắn', 
        // Badge tin nhắn
        badge: unreadMessageCount > 0 ? (unreadMessageCount > 99 ? '99+' : unreadMessageCount) : null 
    }
  ];

  const photographerMenuItems = [
    { path: '/photographer/orders-manage', icon: <CalendarCheck size={24} />, label: 'Quản lý đơn', badge: null },
    { path: '/photographer/schedule', icon: <CalendarDays size={24} />, label: 'Lịch trình', badge: null },
    { path: '/photographer/my-services', icon: <Package size={24} />, label: 'Gói dịch vụ', badge: null },
  ];

  const menuItems = isPhotographer ? [...baseMenuItems, ...photographerMenuItems] : baseMenuItems;

  return (
    <>
      <button className="sidebar-toggle-mobile" onClick={handleToggle}><Menu size={24} /></button>
      {isOpen && <div className="sidebar-overlay" onClick={handleToggle}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={handleToggle}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => {
                // Khi click vào tin nhắn -> Giả định là đã xem hết -> Reset badge
                if (item.path === '/messages') setUnreadMessageCount(0);
                if (window.innerWidth <= 768) {
                    if (isControlled) propsToggleSidebar();
                    else setInternalIsOpen(false);
                }
              }}
            >
              <div className="sidebar-item-content">
                <span className="sidebar-icon">{item.icon}</span>
                {isOpen && (
                  <>
                    <span className="sidebar-label">{item.label}</span>
                    {item.badge && <span className={`sidebar-badge ${item.badge === 'NEW' ? 'new' : ''}`}>{item.badge}</span>}
                  </>
                )}
                {!isOpen && item.badge && <span className="sidebar-badge-dot"></span>}
              </div>
            </Link>
          ))}
          {isPhotographer && isOpen && (
            <div className="sidebar-storage">
              <div className="storage-text">Dung lượng</div>
              <div className="storage-bar"><div className="storage-bar-fill" style={{ width: `${storagePercent}%` }}></div></div>
              <div className="storage-info">{storageUsed.toFixed(1)} / {storageTotal} GB</div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}