import Notification from "../models/notification.model.js";

// ==============================================================================
// 🔔 HÀM TẠO THÔNG BÁO (Dùng nội bộ trong Server)
// ==============================================================================
export const createNotification = async ({ userId, title, message, type, link }) => {
  try {
    const newNoti = new Notification({
      userId,
      title,
      message,
      type,
      link
    });
    await newNoti.save();
    console.log(`🔔 [Notification] Đã tạo thông báo cho User [${userId}]: ${title}`);
    return newNoti;
  } catch (error) {
    console.error("❌ [Notification] Lỗi tạo thông báo:", error);
  }
};

// ==============================================================================
// 📋 LẤY DANH SÁCH THÔNG BÁO CỦA TÔI
// ==============================================================================
export const getMyNotifications = async (req, res) => {
  try {
    // ✅ FIX: Lấy ID an toàn hơn (chấp nhận cả id và _id từ token)
    const userId = req.user.id || req.user._id;
    
    if (!userId) {
      console.log("❌ [GetNoti] Không tìm thấy User ID trong token");
      return res.status(400).json({ message: "Token lỗi, không tìm thấy ID" });
    }

    // console.log(`📥 [GetNoti] Đang lấy thông báo cho User: ${userId}`);

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 }) // Mới nhất lên đầu
      .limit(50); // Giới hạn 50 thông báo gần nhất

    // Đếm số lượng chưa đọc
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error("❌ [GetNoti] Lỗi:", error);
    res.status(500).json({ message: "Lỗi lấy thông báo" });
  }
};

// ==============================================================================
// ✅ ĐÁNH DẤU ĐÃ ĐỌC (MỘT CÁI)
// ==============================================================================
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ success: true, message: "Đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái" });
  }
};

// ==============================================================================
// ✅ ĐÁNH DẤU ĐÃ ĐỌC TẤT CẢ
// ==============================================================================
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: "Đã đọc tất cả" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật tất cả" });
  }
};

export default {
  createNotification, 
  getMyNotifications,
  markAsRead,
  markAllAsRead
};