import Complaint from "../models/complaint.model.js";
import Order from "../models/order.model.js"; 
import "../models/khachhang.model.js"; 
import "../models/servicePackage.model.js"; 
import fs from "fs";

// ✅ Import 2 hệ thống thông báo
import { notifyAllAdmins } from "./notificationAdmin.controller.js"; // Báo cho Admin
import { createNotification } from "./notification.controller.js";      // Báo cho Khách/Thợ

// [POST] Khách hàng tạo khiếu nại
export const createComplaint = async (req, res) => {
  try {
    const { order_id, reason } = req.body;
    const userId = req.user._id || req.user.id;

    // 1. Tìm đơn hàng
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });

    // 2. Check quyền sở hữu
    if (order.customer_id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Không có quyền khiếu nại đơn này." });
    }

    // 3. Check trùng
    const existingComplaint = await Complaint.findOne({ order_id });
    if (existingComplaint) return res.status(400).json({ message: "Đơn hàng này đã có khiếu nại." });

    // 4. Xử lý upload ảnh bằng chứng
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => `/uploads/complaints/${file.filename}`);
    }

    // 5. Tạo khiếu nại
    const newComplaint = new Complaint({
      order_id,
      customer_id: userId,
      photographer_id: order.photographer_id,
      reason,
      images: imagePaths,
      status: 'pending'
    });

    await newComplaint.save();

    // 6. Update Order Status
    order.status = 'complaint';
    if (!order.complaint) order.complaint = {};
    order.complaint.is_complained = true;
    order.complaint.status = 'pending';
    order.complaint.reason = reason;
    order.complaint.created_at = new Date();
    await order.save();

    // ✅ 1. THÔNG BÁO CHO TẤT CẢ ADMIN
    await notifyAllAdmins({
        title: "⚠️ Có khiếu nại mới!",
        message: `Đơn hàng #${order.order_id} bị khiếu nại: "${reason}". Vui lòng kiểm tra và xử lý.`,
        type: "COMPLAINT",
        link: "/admin/complaint-manage"
    });

    // ✅ 2. THÔNG BÁO CHO KHÁCH HÀNG (Xác nhận đã gửi)
    await createNotification({
        userId: userId,
        title: "Đã gửi khiếu nại thành công",
        message: `Hệ thống đã ghi nhận khiếu nại cho đơn #${order.order_id}. Admin sẽ xem xét và phản hồi sớm nhất.`,
        type: "COMPLAINT",
        link: "/my-orders"
    });

    // ✅ 3. THÔNG BÁO CHO NHIẾP ẢNH GIA (Cảnh báo)
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

// [PUT] ADMIN Xử lý khiếu nại
export const processComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_response } = req.body;
        const adminId = req.user._id || req.user.id;

        if (!['resolved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ." });
        }

        const complaint = await Complaint.findById(id);
        if (!complaint) return res.status(404).json({ message: "Không tìm thấy khiếu nại." });

        // Cập nhật trạng thái khiếu nại
        complaint.status = status;
        complaint.admin_response = admin_response || (status === 'resolved' ? "Chấp thuận" : "Từ chối");
        complaint.resolved_by = adminId;
        await complaint.save();

        // Cập nhật trạng thái đơn hàng & Gửi thông báo
        const order = await Order.findById(complaint.order_id);
        if (order) {
            order.complaint.status = status;
            order.complaint.admin_response = complaint.admin_response;
            order.complaint.resolved_at = new Date();

            let notiMessageUser = "";
            let notiMessagePhoto = "";
            let notiTitle = "Kết quả xử lý khiếu nại";

            if (status === 'resolved') {
                // Khiếu nại thành công (Khách thắng)
                order.status = 'refund_pending'; 
                order.status_history.push({
                    status: 'refund_pending',
                    note: `Khiếu nại thành công: ${complaint.admin_response}`,
                    changed_by: adminId
                });
                notiMessageUser = `Khiếu nại cho đơn #${order.order_id} đã được CHẤP THUẬN. Chúng tôi sẽ tiến hành hoàn tiền/xử lý.`;
                notiMessagePhoto = `Khiếu nại đơn #${order.order_id} đã được CHẤP THUẬN (Khách thắng). Vui lòng liên hệ Admin để biết thêm chi tiết.`;
            } else {
                // Khiếu nại thất bại (Khách thua)
                order.status = 'completed';
                order.status_history.push({
                    status: 'completed',
                    note: `Khiếu nại bị từ chối: ${complaint.admin_response}`,
                    changed_by: adminId
                });
                notiMessageUser = `Khiếu nại cho đơn #${order.order_id} đã bị TỪ CHỐI. Lý do: ${complaint.admin_response}`;
                notiMessagePhoto = `Khiếu nại đơn #${order.order_id} đã bị TỪ CHỐI (Bạn thắng). Đơn hàng được đánh dấu hoàn thành.`;
            }
            await order.save();

            // ✅ 1. THÔNG BÁO KẾT QUẢ CHO KHÁCH HÀNG
            await createNotification({
                userId: order.customer_id,
                title: notiTitle,
                message: notiMessageUser,
                type: "COMPLAINT",
                link: `/my-orders`
            });

            // ✅ 2. THÔNG BÁO KẾT QUẢ CHO NHIẾP ẢNH GIA
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

// [GET] Lấy danh sách khiếu nại của User
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

// [GET] ADMIN: Lấy TẤT CẢ khiếu nại
export const getAllComplaints = async (req, res) => {
  try {
    // Populate sâu để lấy thông tin hiển thị trên bảng Admin
    const complaints = await Complaint.find()
      .populate({
          path: "customer_id",
          select: "HoTen Email SoDienThoai Avatar",
          model: "bangKhachHang"
      })
      .populate({
          path: "order_id",
          select: "order_id final_amount booking_date package_name",
          model: "Orders"
      })
      .populate({
          path: "photographer_id",
          select: "HoTen", 
          model: "bangKhachHang", 
          strictPopulate: false 
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: complaints });
  } catch (error) {
    console.error("Get All Complaints Error:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách khiếu nại.", error: error.message });
  }
};