import React, { useEffect, useState } from "react";
import { Bell, CheckCircle, Package, CreditCard, AlertTriangle, UserPlus, Info } from "lucide-react";
import { Link } from "react-router-dom";
import notificationAdminApi from "../../apis/notificationAdminService";
import SidebarAdmin from "../AdminPage/SidebarAdmin"; 
import "./NotificationAdmin.css";

const getIconByType = (type) => {
  switch (type) {
    case "ORDER": return <Package className="icon-admin-order" size={24} />;
    case "PAYMENT": return <CreditCard className="icon-admin-payment" size={24} />;
    case "COMPLAINT": return <AlertTriangle className="icon-admin-alert" size={24} />;
    case "USER": return <UserPlus className="icon-admin-user" size={24} />;
    case "SYSTEM": return <Info className="icon-admin-system" size={24} />;
    default: return <Bell className="icon-admin-default" size={24} />;
  }
};

const NotificationAdmin = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      // ✅ FIX 1: Dùng đúng key "adminToken"
      const token = sessionStorage.getItem("adminToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await notificationAdminApi.getMyNotifications();
      
      // ✅ FIX 2: Truy cập đúng cấp dữ liệu (res.data.data)
      // Vì axiosInstance của Admin trả về full response object
      const notiList = res.data?.data || [];
      
      setNotifications(notiList);
    } catch (error) {
      console.error("Lỗi lấy thông báo Admin:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s cập nhật 1 lần
    return () => clearInterval(interval);
  }, []);

  const handleRead = async (noti) => {
    if (!noti.isRead) {
      try {
        await notificationAdminApi.markAsRead(noti._id);
        setNotifications(prev => prev.map(n => n._id === noti._id ? { ...n, isRead: true } : n));
      } catch (error) {
        console.error("Lỗi đánh dấu đã đọc");
      }
    }
  };

  const handleReadAll = async () => {
    try {
      await notificationAdminApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Lỗi đọc tất cả");
    }
  };

  return (
    <div className="admin-page-wrapper">
      <SidebarAdmin />

      <div className="admin-main-content">
        <div className="admin-noti-container">
          
          <div className="admin-noti-header">
            <h2>🔔 Thông báo hệ thống</h2>
            <button className="admin-mark-all-btn" onClick={handleReadAll}>
              <CheckCircle size={16} /> Đánh dấu tất cả đã đọc
            </button>
          </div>

          {loading ? (
            <div className="admin-loading">
               <div className="spinner"></div> Đang tải dữ liệu...
            </div>
          ) : (
            <div className="admin-noti-list">
              {notifications.length === 0 ? (
                <div className="admin-empty-noti">
                  <Bell size={48} />
                  <p>Hiện chưa có thông báo nào cần xử lý.</p>
                </div>
              ) : (
                notifications.map((item) => (
                  <Link 
                    to={item.link || "#"} 
                    key={item._id} 
                    className={`admin-noti-item ${item.isRead ? "read" : "unread"}`}
                    onClick={() => handleRead(item)}
                  >
                    <div className="admin-noti-icon-wrapper">
                      {getIconByType(item.type)}
                    </div>
                    <div className="admin-noti-content">
                      <div className="admin-noti-top">
                        <h4 className="admin-noti-title">{item.title}</h4>
                        <span className="admin-noti-time">
                          {new Date(item.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <p className="admin-noti-message">{item.message}</p>
                    </div>
                    {!item.isRead && <div className="admin-noti-dot"></div>}
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationAdmin;