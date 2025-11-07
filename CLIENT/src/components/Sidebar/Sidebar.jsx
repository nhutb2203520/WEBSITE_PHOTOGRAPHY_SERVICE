import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Images, Bell, MessageCircle, Menu, X } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { 
      path: '/my-account', 
      icon: <User size={24} />, 
      label: 'Tài khoản của tôi',
      badge: null
    },
    { 
      path: '/albums', 
      icon: <Images size={24} />, 
      label: 'Album',
      badge: null
    },
    { 
      path: '/notifications', 
      icon: <Bell size={24} />, 
      label: 'Thông báo',
      badge: 5
    },
    { 
      path: '/messages', 
      icon: <MessageCircle size={24} />, 
      label: 'Tin nhắn',
      badge: 3
    }
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

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
                    {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                  </>
                )}
                {!isOpen && item.badge && (
                  <span className="sidebar-badge-dot"></span>
                )}
              </div>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}