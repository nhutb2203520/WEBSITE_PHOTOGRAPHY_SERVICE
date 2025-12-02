import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  User, Images, Bell, MessageCircle, Menu, X, 
  ShoppingBag, Heart, Package, CalendarCheck, CalendarDays 
} from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import './Sidebar.css';

export default function Sidebar({ isOpen: propsIsOpen, toggleSidebar: propsToggleSidebar }) {
  const location = useLocation();
  const { user } = useSelector(state => state.user);
  
  // ✅ 1. State nội bộ (Dùng làm fallback nếu trang cha không truyền props)
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ 2. Kiểm tra xem Component có đang được điều khiển bởi cha không
  // (Chỉ khi có đủ cả isOpen và toggleSidebar thì mới coi là Controlled)
  const isControlled = propsIsOpen !== undefined && propsToggleSidebar !== undefined;
  
  // ✅ 3. Xác định trạng thái thực tế
  const isOpen = isControlled ? propsIsOpen : internalIsOpen;
  
  // ✅ 4. Hàm xử lý toggle đa năng
  const handleToggle = () => {
    if (isControlled) {
      propsToggleSidebar(); // Gọi hàm của cha (để đẩy trang)
    } else {
      setInternalIsOpen(!internalIsOpen); // Tự đóng mở (không đẩy trang)
    }
  };

  const isPhotographer = user?.isPhotographer;
  
  // Stats mẫu
  const storageUsed = user?.storageUsed || 0; 
  const storageTotal = user?.storageTotal || 30; 
  const storagePercent = Math.min((storageUsed / storageTotal) * 100, 100);

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
      {/* Nút toggle mobile - Sử dụng handleToggle thay vì props trực tiếp */}
      <button className="sidebar-toggle-mobile" onClick={handleToggle}>
        <Menu size={24} />
      </button>

      {/* Overlay cho mobile */}
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
                // Tự động đóng sidebar trên mobile khi click vào link
                if (window.innerWidth <= 768) {
                    if (isControlled && propsToggleSidebar) {
                        propsToggleSidebar();
                    } else {
                        setInternalIsOpen(false);
                    }
                }
              }}
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