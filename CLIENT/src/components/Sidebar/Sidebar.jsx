import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Images, Bell, MessageCircle, Menu, X, ShoppingBag, Heart, Package, Tag } from 'lucide-react';
import { useSelector } from 'react-redux';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useSelector(state => state.user);
  
  const isPhotographer = user?.isPhotographer;
  
  // Dữ liệu dung lượng mẫu - thay bằng dữ liệu thực từ API
  const storageUsed = user?.storageUsed || 22.16; // GB
  const storageTotal = user?.storageTotal || 30; // GB
  const storagePercent = (storageUsed / storageTotal) * 100;

  const baseMenuItems = [
    { path: '/my-account', icon: <User size={24} />, label: 'Tài khoản của tôi', badge: null },
    { path: '/orders', icon: <ShoppingBag size={24} />, label: 'Đơn hàng của tôi', badge: null },
    { path: '/favorites', icon: <Heart size={24} />, label: 'Yêu thích', badge: null },
    { path: '/albums', icon: <Images size={24} />, label: 'Album', badge: null },
    { path: '/notifications', icon: <Bell size={24} />, label: 'Thông báo', badge: 5 },
    { path: '/messages', icon: <MessageCircle size={24} />, label: 'Tin nhắn', badge: 3 }
  ];

  const photographerMenuItems = [
    { path: '/packages', icon: <Package size={24} />, label: 'Gói dung lượng', badge: null },
    { path: '/promotions', icon: <Tag size={24} />, label: 'Khuyến mãi', badge: 'HOT' }
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
                      <span className={`sidebar-badge ${item.badge === 'HOT' ? 'hot' : ''}`}>
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
                {storageUsed.toFixed(2)} GB/{storageTotal} GB
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}