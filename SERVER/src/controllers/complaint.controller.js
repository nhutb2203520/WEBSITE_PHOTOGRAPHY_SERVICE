import Complaint from "../models/complaint.model.js";
import Order from "../models/order.model.js"; 
import Album from "../models/album.model.js"; 
import "../models/khachhang.model.js"; 
import "../models/servicePackage.model.js"; 

// Import hệ thống thông báo
import { notifyAllAdmins } from "./notificationAdmin.controller.js"; 
import { createNotification } from "./notification.controller.js";

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

    // 2. Check quyền sở hữu
    if (order.customer_id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Không có quyền khiếu nại đơn này." });
    }

    // 3. Check trùng
    const existingComplaint = await Complaint.findOne({ order_id });
    if (existingComplaint && existingComplaint.status === 'pending') {
        return res.status(400).json({ message: "Đơn hàng này đang có khiếu nại chờ xử lý." });
    }

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

    // 6. Cập nhật đơn hàng
    order.status = 'complaint';
    if (!order.complaint) order.complaint = {};
    order.complaint.is_complained = true;
    order.complaint.status = 'pending';
    order.complaint.reason = reason;
    order.complaint.created_at = new Date();
    await order.save();

    // 7. Gửi thông báo
    await notifyAllAdmins({
        title: "⚠️ Có khiếu nại mới!",
        message: `Đơn hàng #${order.order_id} bị khiếu nại: "${reason}".`,
        type: "COMPLAINT",
        link: "/admin/complaint-manage"
    });

    await createNotification({
        userId: userId,
        title: "Đã gửi khiếu nại thành công",
        message: `Hệ thống đã ghi nhận khiếu nại cho đơn #${order.order_id}.`,
        type: "COMPLAINT",
        link: "/my-orders"
    });

    if (order.photographer_id) {
        await createNotification({
            userId: order.photographer_id,
            title: "⚠️ Đơn hàng bị khiếu nại",
            message: `Khách hàng đã khiếu nại đơn hàng #${order.order_id}. Vui lòng chờ Admin xử lý.`,
            type: "COMPLAINT",
            link: "/photographer/orders-manage"
        });
    }

    res.status(201).json({
      success: true,
      message: "Gửi khiếu nại thành công.",
      data: newComplaint
    });

  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({ message: "Lỗi server.", error: error.message });
  }
};

// ==============================================================================
// 2. [PUT] ADMIN XỬ LÝ KHIẾU NẠI (CƠ BẢN: DUYỆT / TỪ CHỐI)
// ==============================================================================
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

        complaint.status = status;
        complaint.admin_response = admin_response || (status === 'resolved' ? "Chấp thuận" : "Từ chối");
        complaint.resolved_by = adminId;
        await complaint.save();

        const order = await Order.findById(complaint.order_id);
        if (order) {
            order.complaint.status = status;
            order.complaint.admin_response = complaint.admin_response;
            order.complaint.resolved_at = new Date();

            let notiMessageUser = "";
            
            if (status === 'resolved') {
                // Nếu chỉ duyệt mà chưa thanh toán -> Chờ hoàn tiền
                order.status = 'refund_pending'; 
                notiMessageUser = `Khiếu nại đơn #${order.order_id} đã được CHẤP THUẬN. Đang chờ xử lý hoàn tiền.`;
            } else {
                // Nếu từ chối -> Đơn hoàn thành
                order.status = 'completed';
                notiMessageUser = `Khiếu nại đơn #${order.order_id} đã bị TỪ CHỐI. Lý do: ${complaint.admin_response}`;
            }
            
            order.status_history.push({
                status: order.status,
                note: `Admin xử lý khiếu nại: ${status}`,
                changed_by: adminId
            });

            await order.save();

            // Thông báo
            await createNotification({
                userId: order.customer_id,
                title: "Kết quả khiếu nại",
                message: notiMessageUser,
                type: "COMPLAINT",
                link: `/my-orders`
            });
        }

        res.json({ success: true, message: "Đã xử lý trạng thái khiếu nại.", data: complaint });

    } catch (error) {
        console.error("Process complaint error:", error);
        res.status(500).json({ message: "Lỗi server." });
    }
};

// ==============================================================================
// 3. [POST] ADMIN GIẢI QUYẾT & UPLOAD BIÊN LAI (MANUAL SETTLEMENT)
// ==============================================================================
export const resolveComplaintManual = async (req, res) => {
    try {
        // Lấy dữ liệu từ Form Data
        const { complaintId, refundPercent, photographerPercent } = req.body;
        const adminId = req.user._id || req.user.id;

        // 1. Validate
        const refundPct = Number(refundPercent);
        const photoPct = Number(photographerPercent);

        if (refundPct + photoPct > 100) {
            return res.status(400).json({ message: "Tổng phần trăm không được vượt quá 100%." });
        }

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) return res.status(404).json({ message: "Không tìm thấy khiếu nại." });

        const order = await Order.findById(complaint.order_id);
        if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại." });

        // 2. Xử lý file ảnh biên lai
        let refundProofUrl = "";
        let payoutProofUrl = "";

        // Kiểm tra xem có file upload lên không
        if (req.files) {
            if (req.files.refundProof && req.files.refundProof[0]) {
                refundProofUrl = `/uploads/complaints/${req.files.refundProof[0].filename}`;
            }
            if (req.files.payoutProof && req.files.payoutProof[0]) {
                payoutProofUrl = `/uploads/complaints/${req.files.payoutProof[0].filename}`;
            }
        }

        // 3. Tính toán tiền
        const totalPaid = order.final_amount; 
        const refundAmount = Math.round((totalPaid * refundPct) / 100);
        const photographerIncome = Math.round((totalPaid * photoPct) / 100);
        const platformFee = totalPaid - refundAmount - photographerIncome;

        // 4. CẬP NHẬT KHIẾU NẠI
        complaint.status = 'resolved';
        complaint.admin_response = `Đã giải quyết thủ công: Hoàn khách ${refundPct}%, Trả thợ ${photoPct}%.`;
        complaint.resolved_by = adminId;
        
        complaint.resolution_details = {
            refund_amount: refundAmount,
            photographer_amount: photographerIncome,
            system_fee: platformFee,
            refund_proof_image: refundProofUrl,
            payout_proof_image: payoutProofUrl
        };
        await complaint.save();

        // 5. CẬP NHẬT ĐƠN HÀNG
        order.status = 'completed'; // Kết thúc đơn hàng
        order.settlement_status = 'paid'; // Đánh dấu tiền nong đã xong
        order.settlement_date = new Date();
        
        order.status_history.push({
            status: 'completed',
            note: `Giải quyết khiếu nại: Khách ${refundAmount}đ, Thợ ${photographerIncome}đ (Đã banking)`,
            changed_by: adminId
        });
        
        if(order.complaint) {
            order.complaint.status = 'resolved';
            order.complaint.resolved_at = new Date();
            order.complaint.admin_response = complaint.admin_response;
        }

        await order.save();

        // 6. GỬI THÔNG BÁO
        await createNotification({
            userId: order.customer_id,
            title: "Khiếu nại đã giải quyết xong",
            message: `Admin đã hoàn tất xử lý. Bạn nhận lại ${refundAmount.toLocaleString()}đ qua tài khoản ngân hàng.`,
            type: "COMPLAINT",
            link: `/my-orders`
        });

        if (order.photographer_id) {
            await createNotification({
                userId: order.photographer_id,
                title: "Quyết toán khiếu nại",
                message: `Đơn hàng #${order.order_id} đã được quyết toán. Thực nhận: ${photographerIncome.toLocaleString()}đ.`,
                type: "COMPLAINT",
                link: `/photographer/orders-manage`
            });
        }

        res.status(200).json({
            success: true,
            message: "Cập nhật giải quyết khiếu nại thành công.",
            data: {
                refundAmount,
                photographerIncome,
                refundProofUrl
            }
        });

    } catch (error) {
        console.error("Resolve Manual Error:", error);
        res.status(500).json({ message: "Lỗi server.", error: error.message });
    }
};

// ==============================================================================
// 4. [GET] LẤY DANH SÁCH KHIẾU NẠI CỦA KHÁCH HÀNG
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
// 5. [GET] ADMIN: LẤY TẤT CẢ KHIẾU NẠI (KÈM ALBUM)
// ==============================================================================
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate({
          path: "customer_id",
          select: "HoTen Email SoDienThoai Avatar",
      })
      .populate({
          path: "order_id",
          select: "order_id final_amount booking_date package_name", 
      })
      .populate({
          path: "photographer_id",
          select: "HoTen", 
          strictPopulate: false 
      })
      .sort({ createdAt: -1 })
      .lean();

    // Lấy thêm thông tin Album cho Admin xem bằng chứng công việc
    const dataWithAlbum = await Promise.all(complaints.map(async (c) => {
        if (c.order_id) {
            const album = await Album.findOne({ order_id: c.order_id._id })
                                     .select('status photos edited_photos share_token title createdAt');
            c.album_info = album; 
        }
        return c;
    }));

    res.json({ success: true, data: dataWithAlbum });
  } catch (error) {
    console.error("Get All Complaints Error:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

export default {
    createComplaint,
    processComplaint,
    resolveComplaintManual,
    getMyComplaints,
    getAllComplaints
};