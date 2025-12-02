import React, { useEffect, useState } from "react";
import { Bell, CheckCircle, Package, CreditCard, Image, Info, AlertTriangle } from "lucide-react"; // ✅ Import thêm AlertTriangle
import { Link } from "react-router-dom";
import notificationApi from "../../apis/notificationService"; 
import Header from "../Header/Header"; 
import Footer from "../Footer/Footer"; 
import Sidebar from "../Sidebar/Sidebar"; 
import "./NotificationPage.css";

// Hàm helper để chọn icon theo loại thông báo
const getIconByType = (type) => {
  switch (type) {
    case "ORDER": return <Package className="icon-order" size={24} />;
    case "PAYMENT": return <CreditCard className="icon-payment" size={24} />;
    case "ALBUM": return <Image className="icon-album" size={24} />;
    case "SYSTEM": return <Info className="icon-system" size={24} />;
    // ✅ Thêm case cho khiếu nại (COMPLAINT)
    case "COMPLAINT": return <AlertTriangle className="icon-complaint" size={24} color="#ef4444" />;
    default: return <Bell className="icon-default" size={24} />;
  }
};

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách thông báo
  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
         setLoading(false);
         return;
      }

      const res = await notificationApi.getMyNotifications();
      // Đảm bảo luôn là mảng để tránh lỗi map
      setNotifications(res.data || []); 
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Tự động cập nhật mỗi 30s để nhận tin mới
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Xử lý khi click vào thông báo (Đánh dấu đã đọc)
  const handleRead = async (noti) => {
    if (!noti.isRead) {
      try {
        await notificationApi.markAsRead(noti._id);
        setNotifications(prev => prev.map(n => n._id === noti._id ? { ...n, isRead: true } : n));
      } catch (error) {
        console.error("Lỗi đánh dấu đã đọc");
      }
    }
  };

  // Đánh dấu đọc tất cả
  const handleReadAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Lỗi đọc tất cả");
    }
  };

  return (
    <div className="page-wrapper">
      <Header />

      <div className="main-layout">
        <div className="sidebar-area">
           <Sidebar />
        </div>

        <div className="content-area">
          <div className="notification-container">
            
            <div className="noti-header">
              <h2>Thông báo của bạn</h2>
              <button className="mark-all-btn" onClick={handleReadAll}>
                <CheckCircle size={16} /> Đánh dấu tất cả là đã đọc
              </button>
            </div>

            {loading ? (
              <div className="loading-noti">
                 <div className="spinner"></div> Đang tải thông báo...
              </div>
            ) : (
              <div className="noti-list">
                {notifications.length === 0 ? (
                  <div className="empty-noti">
                    <Bell size={48} />
                    <p>Bạn chưa có thông báo nào.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <Link 
                      to={item.link || "#"} 
                      key={item._id} 
                      className={`noti-item ${item.isRead ? "read" : "unread"}`}
                      onClick={() => handleRead(item)}
                    >
                      <div className="noti-icon-wrapper">
                        {getIconByType(item.type)}
                      </div>
                      <div className="noti-content">
                        <h4 className="noti-title">{item.title}</h4>
                        <p className="noti-message">{item.message}</p>
                        <span className="noti-time">
                          {new Date(item.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      {!item.isRead && <div className="noti-dot"></div>}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotificationPage;