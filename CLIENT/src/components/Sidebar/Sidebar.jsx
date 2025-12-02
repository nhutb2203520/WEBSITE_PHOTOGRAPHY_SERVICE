import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  User, Images, Bell, MessageCircle, Menu, X, 
  ShoppingBag, Heart, Package, CalendarCheck, CalendarDays 
} from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import './Sidebar.css';

// ✅ Nhận props: isOpen và toggleSidebar từ cha (HomePageCustomer)
export default function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();
  const { user } = useSelector(state => state.user);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const isPhotographer = user?.isPhotographer;
  
  // Fake stats dung lượng (hoặc lấy từ user redux nếu có)
  const storageUsed = user?.storageUsed || 0; 
  const storageTotal = user?.storageTotal || 30; 
  const storagePercent = Math.min((storageUsed / storageTotal) * 100, 100);

  // Lấy thông báo (Giữ nguyên logic cũ của bạn)
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:5000/api/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Lỗi thông báo:", error);
      }
    };
    fetchUnreadCount();
  }, []);

  const baseMenuItems = [
    { path: '/my-account', icon: <User size={24} />, label: 'Tài khoản', badge: null },
    { path: '/my-orders', icon: <ShoppingBag size={24} />, label: 'Đơn hàng', badge: null },
    { path: '/favorites', icon: <Heart size={24} />, label: 'Yêu thích', badge: null },
    { path: '/albums', icon: <Images size={24} />, label: 'Album', badge: null },
    { path: '/notifications', icon: <Bell size={24} />, label: 'Thông báo', badge: unreadCount > 0 ? unreadCount : null },
    { path: '/messages', icon: <MessageCircle size={24} />, label: 'Tin nhắn', badge: null }
  ];

  const photographerMenuItems = [
    { path: '/photographer/orders-manage', icon: <CalendarCheck size={24} />, label: 'Quản lý đơn', badge: null },
    { path: '/photographer/schedule', icon: <CalendarDays size={24} />, label: 'Lịch trình', badge: null },
    { path: '/photographer/my-services', icon: <Package size={24} />, label: 'Gói dịch vụ', badge: null },
  ];

  const menuItems = isPhotographer ? [...baseMenuItems, ...photographerMenuItems] : baseMenuItems;

  return (
    <>
      {/* Nút toggle mobile */}
      <button className="sidebar-toggle-mobile" onClick={toggleSidebar}>
        <Menu size={24} />
      </button>

      {/* Overlay cho mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              // Trên mobile, bấm vào link thì đóng sidebar
              onClick={() => window.innerWidth <= 768 && toggleSidebar()}
            >
              <div className="sidebar-item-content">
                <span className="sidebar-icon">{item.icon}</span>
                {isOpen && (
                  <>
                    <span className="sidebar-label">{item.label}</span>
                    {item.badge && (
                      <span className={`sidebar-badge ${item.badge === 'NEW' ? 'new' : ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {/* Dấu chấm đỏ khi đóng sidebar */}
                {!isOpen && item.badge && <span className="sidebar-badge-dot"></span>}
              </div>
            </Link>
          ))}
          
          {isPhotographer && isOpen && (
            <div className="sidebar-storage">
              <div className="storage-text">Dung lượng</div>
              <div className="storage-bar">
                <div className="storage-bar-fill" style={{ width: `${storagePercent}%` }}></div>
              </div>
              <div className="storage-info">{storageUsed.toFixed(1)} / {storageTotal} GB</div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}