import Complaint from "../models/complaint.model.js";
import Order from "../models/order.model.js"; 
import "../models/khachhang.model.js"; 
import "../models/servicePackage.model.js"; 
import Album from "../models/album.model.js"; // ✅ Import Model Album để lấy thông tin ảnh
import fs from "fs";

// ✅ Import hệ thống thông báo
import { notifyAllAdmins } from "./notificationAdmin.controller.js"; // Báo cho Admin
import { createNotification } from "./notification.controller.js";      // Báo cho Khách/Thợ

// ==============================================================================
// 1. [POST] KHÁCH HÀNG TẠO KHIẾU NẠI
// ==============================================================================
export const createComplaint = async (req, res) => {
  try {
    const { order_id, reason } = req.body;
    const userId = req.user._id || req.user.id;

    // 1. Tìm đơn hàng
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });

    // 2. Check quyền sở hữu (Chỉ khách hàng của đơn này mới được khiếu nại)
    if (order.customer_id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Không có quyền khiếu nại đơn này." });
    }

    // 3. Check trùng (Mỗi đơn chỉ 1 khiếu nại đang xử lý)
    const existingComplaint = await Complaint.findOne({ order_id });
    if (existingComplaint && existingComplaint.status === 'pending') {
        return res.status(400).json({ message: "Đơn hàng này đang có khiếu nại chờ xử lý." });
    }

    // 4. Xử lý upload ảnh bằng chứng
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => `/uploads/complaints/${file.filename}`);
    }

    // 5. Tạo khiếu nại mới
    const newComplaint = new Complaint({
      order_id,
      customer_id: userId,
      photographer_id: order.photographer_id, // Lưu lại thợ để dễ truy vấn
      reason,
      images: imagePaths,
      status: 'pending'
    });

    await newComplaint.save();

    // 6. Cập nhật trạng thái đơn hàng sang 'complaint'
    order.status = 'complaint';
    if (!order.complaint) order.complaint = {};
    order.complaint.is_complained = true;
    order.complaint.status = 'pending';
    order.complaint.reason = reason;
    order.complaint.created_at = new Date();
    await order.save();

    // --- GỬI THÔNG BÁO ---

    // A. Thông báo cho Admin
    await notifyAllAdmins({
        title: "⚠️ Có khiếu nại mới!",
        message: `Đơn hàng #${order.order_id} bị khiếu nại: "${reason}". Vui lòng kiểm tra và xử lý.`,
        type: "COMPLAINT",
        link: "/admin/complaint-manage"
    });

    // B. Thông báo cho Khách hàng (Xác nhận)
    await createNotification({
        userId: userId,
        title: "Đã gửi khiếu nại thành công",
        message: `Hệ thống đã ghi nhận khiếu nại cho đơn #${order.order_id}. Admin sẽ xem xét và phản hồi sớm nhất.`,
        type: "COMPLAINT",
        link: "/my-orders"
    });

    // C. Thông báo cho Nhiếp ảnh gia (Cảnh báo)
    if (order.photographer_id) {
        await createNotification({
            userId: order.photographer_id,
            title: "⚠️ Đơn hàng bị khiếu nại",
            message: `Khách hàng đã khiếu nại đơn hàng #${order.order_id} với lý do: "${reason}". Vui lòng chờ Admin xử lý.`,
            type: "COMPLAINT",
            link: "/photographer/orders-manage"
        });
    }

    res.status(201).json({
      success: true,
      message: "Gửi khiếu nại thành công. Admin sẽ xem xét sớm nhất.",
      data: newComplaint
    });

  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({ message: "Lỗi server.", error: error.message });
  }
};

// ==============================================================================
// 2. [PUT] ADMIN XỬ LÝ KHIẾU NẠI (DUYỆT HOẶC TỪ CHỐI)
// ==============================================================================
export const processComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_response } = req.body;
        const adminId = req.user._id || req.user.id;

        if (!['resolved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Trạng thái xử lý không hợp lệ." });
        }

        const complaint = await Complaint.findById(id);
        if (!complaint) return res.status(404).json({ message: "Không tìm thấy khiếu nại." });

        // Cập nhật thông tin xử lý vào Complaint
        complaint.status = status;
        complaint.admin_response = admin_response || (status === 'resolved' ? "Chấp thuận" : "Từ chối");
        complaint.resolved_by = adminId;
        await complaint.save();

        // Cập nhật trạng thái Đơn hàng & Gửi thông báo kết quả
        const order = await Order.findById(complaint.order_id);
        if (order) {
            order.complaint.status = status;
            order.complaint.admin_response = complaint.admin_response;
            order.complaint.resolved_at = new Date();

            let notiMessageUser = "";
            let notiMessagePhoto = "";
            let notiTitle = "Kết quả xử lý khiếu nại";

            if (status === 'resolved') {
                // TRƯỜNG HỢP 1: ADMIN CHẤP THUẬN (KHÁCH THẮNG)
                // Chuyển đơn hàng sang trạng thái chờ hoàn tiền
                order.status = 'refund_pending'; 
                order.status_history.push({
                    status: 'refund_pending',
                    note: `Khiếu nại thành công: ${complaint.admin_response}`,
                    changed_by: adminId
                });
                
                notiMessageUser = `Khiếu nại cho đơn #${order.order_id} đã được CHẤP THUẬN. Chúng tôi sẽ tiến hành hoàn tiền/xử lý theo quy định.`;
                notiMessagePhoto = `Khiếu nại đơn #${order.order_id} đã được CHẤP THUẬN (Lỗi thuộc về thợ/dịch vụ). Vui lòng liên hệ Admin để giải quyết.`;
            } else {
                // TRƯỜNG HỢP 2: ADMIN TỪ CHỐI (KHÁCH THUA)
                // Đơn hàng coi như hoàn thành (vì khách đã nhận ảnh nhưng khiếu nại không hợp lý)
                order.status = 'completed';
                order.status_history.push({
                    status: 'completed',
                    note: `Khiếu nại bị từ chối: ${complaint.admin_response}`,
                    changed_by: adminId
                });

                notiMessageUser = `Khiếu nại cho đơn #${order.order_id} đã bị TỪ CHỐI. Lý do: ${complaint.admin_response}. Đơn hàng được đóng lại.`;
                notiMessagePhoto = `Khiếu nại đơn #${order.order_id} đã bị TỪ CHỐI (Bạn không có lỗi). Đơn hàng đã được đánh dấu hoàn thành.`;
            }
            await order.save();

            // Gửi thông báo kết quả
            await createNotification({
                userId: order.customer_id,
                title: notiTitle,
                message: notiMessageUser,
                type: "COMPLAINT",
                link: `/my-orders`
            });

            if (order.photographer_id) {
                await createNotification({
                    userId: order.photographer_id,
                    title: notiTitle,
                    message: notiMessagePhoto,
                    type: "COMPLAINT",
                    link: `/photographer/orders-manage`
                });
            }
        }

        res.json({
            success: true,
            message: "Đã xử lý khiếu nại thành công.",
            data: complaint
        });

    } catch (error) {
        console.error("Process complaint error:", error);
        res.status(500).json({ message: "Lỗi server khi xử lý khiếu nại." });
    }
};

// ==============================================================================
// 3. [GET] LẤY DANH SÁCH KHIẾU NẠI CỦA KHÁCH HÀNG (MY COMPLAINTS)
// ==============================================================================
export const getMyComplaints = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const complaints = await Complaint.find({ customer_id: userId })
      .populate("order_id", "order_id final_amount service_package_id") 
      .sort({ createdAt: -1 });

    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==============================================================================
// 4. [GET] ADMIN: LẤY TẤT CẢ KHIẾU NẠI (KÈM THÔNG TIN ALBUM)
// ==============================================================================
export const getAllComplaints = async (req, res) => {
  try {
    // 1. Lấy danh sách khiếu nại cơ bản và populate các thông tin liên quan
    const complaints = await Complaint.find()
      .populate({
          path: "customer_id",
          select: "HoTen Email SoDienThoai Avatar",
      })
      .populate({
          path: "order_id",
          select: "order_id final_amount booking_date package_name", // Lấy các trường cần thiết của đơn hàng
      })
      .populate({
          path: "photographer_id",
          select: "HoTen", 
          strictPopulate: false 
      })
      .sort({ createdAt: -1 })
      .lean(); // Dùng lean() để trả về Plain Object, giúp ta có thể gán thêm thuộc tính 'album_info'

    // 2. Lấy thêm thông tin Album cho từng khiếu nại
    // Giúp Admin xem được ảnh thợ đã giao (số lượng, link xem) để đánh giá khách quan
    const dataWithAlbum = await Promise.all(complaints.map(async (c) => {
        if (c.order_id) {
            // Tìm Album theo order_id (Lưu ý: trong model Order, _id là khóa chính)
            const album = await Album.findOne({ order_id: c.order_id._id })
                                     .select('status photos edited_photos share_token title createdAt');
            c.album_info = album; 
        }
        return c;
    }));

    res.json({ success: true, data: dataWithAlbum });
  } catch (error) {
    console.error("Get All Complaints Error:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách khiếu nại.", error: error.message });
  }
};

export default {
    createComplaint,
    processComplaint,
    getMyComplaints,
    getAllComplaints
};