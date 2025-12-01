import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  User, Images, Bell, MessageCircle, Menu, X, 
  ShoppingBag, Heart, Package, CalendarCheck, CalendarDays 
} from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios'; // Import axios để gọi API
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useSelector(state => state.user);
  
  // ✅ State lưu số lượng thông báo chưa đọc thật
  const [unreadCount, setUnreadCount] = useState(0);
  
  const isPhotographer = user?.isPhotographer;
  
  // Dữ liệu dung lượng mẫu (Vẫn giữ nguyên hoặc thay bằng API nếu có)
  const storageUsed = user?.storageUsed || 22.16; 
  const storageTotal = user?.storageTotal || 30; 
  const storagePercent = Math.min((storageUsed / storageTotal) * 100, 100);

  // ✅ EFFECT: Lấy số lượng thông báo từ API thật
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        // Gọi API lấy danh sách thông báo (API này trả về unreadCount)
        const res = await axios.get("http://localhost:5000/api/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data && res.data.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Lỗi lấy số lượng thông báo:", error);
      }
    };

    fetchUnreadCount();

    // (Tuỳ chọn) Tự động cập nhật mỗi 30 giây để số nhảy real-time
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Menu cơ bản cho mọi người dùng
  const baseMenuItems = [
    { path: '/my-account', icon: <User size={24} />, label: 'Tài khoản của tôi', badge: null },
    { path: '/my-orders', icon: <ShoppingBag size={24} />, label: 'Đơn hàng của tôi', badge: null },
    { path: '/favorites', icon: <Heart size={24} />, label: 'Yêu thích', badge: null },
    { path: '/albums', icon: <Images size={24} />, label: 'Album', badge: null },
    { 
      path: '/notifications', 
      icon: <Bell size={24} />, 
      label: 'Thông báo', 
      // ✅ Hiển thị số lượng thật (chỉ hiện khi > 0)
      badge: unreadCount > 0 ? unreadCount : null 
    },
    { 
      path: '/messages', 
      icon: <MessageCircle size={24} />, 
      label: 'Tin nhắn', 
      // ❌ Đã xóa số ảo (3), để null chờ tính năng chat
      badge: null 
    }
  ];

  // Menu bổ sung cho Photographer
  const photographerMenuItems = [
    { path: '/photographer/orders-manage', icon: <CalendarCheck size={24} />, label: 'Quản lý đơn đặt', badge: null }, // Có thể thêm logic count đơn mới ở đây sau
    { path: '/photographer/schedule', icon: <CalendarDays size={24} />, label: 'Lịch trình', badge: null },
    { path: '/photographer/my-services', icon: <Package size={24} />, label: 'Quản lý gói chụp', badge: null },
  ];

  const menuItems = isPhotographer 
    ? [...baseMenuItems, ...photographerMenuItems]
    : baseMenuItems;

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Nút toggle cho mobile */}
      <button className="sidebar-toggle-mobile" onClick={toggleSidebar}>
        <Menu size={24} />
      </button>

      {/* Overlay khi sidebar mở trên mobile */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
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
              onClick={() => window.innerWidth <= 768 && setIsOpen(false)}
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
                {!isOpen && item.badge && (
                  <span className="sidebar-badge-dot"></span>
                )}
              </div>
            </Link>
          ))}

          {/* Hiển thị dung lượng cho photographer */}
          {isPhotographer && isOpen && (
            <div className="sidebar-storage">
              <div className="storage-text">Dung lượng đã dùng</div>
              <div className="storage-bar">
                <div 
                  className="storage-bar-fill" 
                  style={{ width: `${storagePercent}%` }}
                ></div>
              </div>
              <div className="storage-info">
                {storageUsed.toFixed(2)} GB / {storageTotal} GB
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}