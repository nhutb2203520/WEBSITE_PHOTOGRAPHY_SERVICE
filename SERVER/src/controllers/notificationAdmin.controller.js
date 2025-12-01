import NotificationAdmin from "../models/notificationAdmin.model.js";
import Admin from "../models/admin.model.js"; 
import mongoose from "mongoose"; // ✅ Import mongoose để ép kiểu ID

// ==============================================================================
// 🔔 HÀM QUAN TRỌNG: GỬI THÔNG BÁO CHO TẤT CẢ ADMIN
// ==============================================================================
export const notifyAllAdmins = async ({ title, message, type, link }) => {
  try {
    const admins = await Admin.find({});
    
    if (!admins || admins.length === 0) {
      console.log("⚠️ [NotiAdmin] Không tìm thấy Admin nào để gửi thông báo!");
      return;
    }

    const notifications = admins.map(admin => ({
      adminId: admin._id,
      title,
      message,
      type,
      link,
      isRead: false
    }));

    await NotificationAdmin.insertMany(notifications);
    console.log(`🔔 [NotiAdmin] Đã gửi thông báo "${title}" tới ${admins.length} Admin.`);
    
  } catch (error) {
    console.error("❌ [NotiAdmin] Lỗi khi gửi thông báo:", error);
  }
};

// ==============================================================================
// 📋 LẤY DANH SÁCH THÔNG BÁO CỦA ADMIN (API)
// ==============================================================================
export const getMyNotifications = async (req, res) => {
  try {
    const rawId = req.user.id || req.user._id;
    
    // ✅ CRITICAL FIX: Ép kiểu sang ObjectId để tìm chính xác trong MongoDB
    const adminId = new mongoose.Types.ObjectId(rawId);

    console.log(`🔍 [GetNotiAdmin] Đang tìm thông báo cho Admin ID: ${adminId}`);

    const notifications = await NotificationAdmin.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log(`✅ [GetNotiAdmin] Tìm thấy ${notifications.length} thông báo.`);

    const unreadCount = await NotificationAdmin.countDocuments({ adminId, isRead: false });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount // Trả về số lượng chưa đọc
    });
  } catch (error) {
    console.error("❌ [GetNotiAdmin] Lỗi:", error);
    res.status(500).json({ message: "Lỗi server lấy thông báo" });
  }
};

// ==============================================================================
// ✅ ĐÁNH DẤU ĐÃ ĐỌC
// ==============================================================================
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await NotificationAdmin.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật" });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.user.id || req.user._id);
    await NotificationAdmin.updateMany({ adminId, isRead: false }, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật" });
  }
};

export default {
  notifyAllAdmins, 
  getMyNotifications,
  markAsRead,
  markAllAsRead
};