import Order from "../models/order.model.js";
import ServicePackage from "../models/servicePackage.model.js";
import Review from "../models/review.model.js";
import Schedule from "../models/schedule.model.js"; // ✅ QUAN TRỌNG: Để check và tạo lịch
import mongoose from "mongoose";
import orderService from "../services/order.service.js"; 

// ==============================================================================
// 📦 1. TẠO ĐƠN HÀNG MỚI (Đã Fix lỗi trùng lịch Personal/Busy)
// ==============================================================================
export const createOrder = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { booking_date, start_time, photographer_id, service_package_id, package_name } = req.body;

    // --- BƯỚC 1: VALIDATION & CHUẨN HÓA NGÀY ---
    if (!booking_date || !start_time) {
        return res.status(400).json({ message: "Vui lòng chọn ngày và giờ chụp!" });
    }

    // Tạo khoảng thời gian bao trùm cả ngày (00:00 -> 23:59)
    // Để bắt dính mọi lịch cá nhân (thường lưu là 00:00) hoặc lịch bận trong ngày đó
    const searchDate = new Date(booking_date);
    const startOfDay = new Date(searchDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate); endOfDay.setHours(23, 59, 59, 999);

    // --- BƯỚC 2: KIỂM TRA TRÙNG ĐƠN HÀNG ĐÃ CÓ (Order Collection) ---
    const orderQuery = {
        booking_date: { $gte: startOfDay, $lte: endOfDay }, // Trùng ngày
        start_time: start_time, // Trùng giờ
        status: { $nin: ['cancelled', 'refund_pending', 'rejected'] } // Bỏ qua đơn hủy
    };

    if (photographer_id) {
        orderQuery.photographer_id = photographer_id;
        const duplicateOrder = await Order.findOne(orderQuery);
        if (duplicateOrder) {
            return res.status(409).json({ 
                message: `Nhiếp ảnh gia đã có đơn hàng vào lúc ${start_time} ngày này.` 
            });
        }
    } else {
        // Nếu không chọn thợ, check xem khách có tự đặt trùng không
        orderQuery.customer_id = customer_id;
        const duplicateMyOrder = await Order.findOne(orderQuery);
        if (duplicateMyOrder) {
            return res.status(409).json({ 
                message: `Bạn đã có một đơn hàng khác vào khung giờ này rồi!` 
            });
        }
    }

    if (photographer_id) {
        const conflictSchedule = await Schedule.findOne({
            photographerId: photographer_id,
            date: { $gte: startOfDay, $lte: endOfDay }, // Tìm trong ngày đó
            type: { $in: ['busy', 'personal'] } // Chặn cả Báo bận và Lịch cá nhân
        });

        if (conflictSchedule) {
            return res.status(409).json({ 
                message: `Nhiếp ảnh gia có lịch cá nhân/báo bận vào ngày này. Vui lòng chọn ngày khác.` 
            });
        }
    }

    // --- BƯỚC 4: TẠO ĐƠN HÀNG ---
    const payload = { customer_id, ...req.body };
    const newOrder = await orderService.createOrder(payload);
    
    // --- BƯỚC 5: ĐỒNG BỘ VÀO BẢNG SCHEDULE ---
    // Tạo lịch hiển thị cho Khách hàng
    await new Schedule({
        photographerId: customer_id, // Lưu ID khách để hiện trên lịch của họ
        title: `Đơn hàng #${newOrder.order_id}`,
        date: searchDate,
        type: 'order',
        orderId: newOrder._id,
        description: `Gói: ${package_name || 'Dịch vụ chụp ảnh'}`
    }).save();

    // Tạo lịch hiển thị cho Nhiếp ảnh gia (nếu có)
    if (newOrder.photographer_id) {
         await new Schedule({
            photographerId: newOrder.photographer_id,
            title: `Chụp khách: ${req.user.last_name || 'Khách'} (${start_time})`,
            date: searchDate,
            type: 'order',
            orderId: newOrder._id
        }).save();
    }
    
    res.status(201).json({ 
      message: "Tạo đơn hàng thành công!", 
      data: newOrder,
      payment_info: newOrder.payment_info
    });

  } catch (error) {
    console.error("Create order error:", error);
    res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
  }
};

// ==============================================================================
// 📋 2. LẤY DANH SÁCH ĐƠN CỦA TÔI (Kèm Review & Package Info)
// ==============================================================================
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const orders = await Order.aggregate([
      { 
        $match: { customer_id: new mongoose.Types.ObjectId(userId) } 
      },
      {
        $lookup: {
          from: "servicepackages",
          localField: "service_package_id",
          foreignField: "_id",
          as: "package_info"
        }
      },
      { $unwind: { path: "$package_info", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "OrderId",
          as: "review_info"
        }
      },
      {
        $addFields: {
            review: { $arrayElemAt: ["$review_info", 0] },
            service_package_id: "$package_info" 
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({ 
        message: "Danh sách đơn hàng của bạn", 
        data: orders 
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách đơn!" });
  }
};

// ==============================================================================
// 🔄 3. CẬP NHẬT TRẠNG THÁI ĐƠN
// ==============================================================================
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const userId = req.user?.id || null;
    
    const updated = await orderService.updateOrderStatus(
      req.params.orderId, 
      status, 
      userId, 
      note
    );
    
    res.json({ message: "Cập nhật trạng thái thành công", data: updated });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
  }
};

// ==============================================================================
// 🔍 4. LẤY CHI TIẾT ĐƠN HÀNG
// ==============================================================================
export const getOrderDetail = async (req, res) => {
  try {
    const order = await orderService.getOrderByOrderId(req.params.orderId);
    res.json({ data: order });
  } catch (error) {
    console.error("Get order detail error:", error);
    res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
  }
};

// ==============================================================================
// 🚚 5. TÍNH PHÍ DI CHUYỂN (Preview)
// ==============================================================================
export const calculateTravelFee = async (req, res) => {
  try {
    const { packageId, lat, lng } = req.body;
    
    if (!packageId) {
      return res.status(400).json({ message: "Vui lòng cung cấp packageId" });
    }
    
    const result = await orderService.calculateTravelFeePreview(packageId, { lat, lng });
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Calculate travel fee error:", error);
    res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
  }
};

// ==============================================================================
// 💰 6. XÁC NHẬN THANH TOÁN (Upload Bill)
// ==============================================================================
export const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params; 
    const { method, amount, transaction_code } = req.body;

    if (method === 'banking' && !req.file) {
      return res.status(400).json({ message: "Vui lòng tải lên ảnh xác thực chuyển khoản!" });
    }

    let fileUrl = null;
    if (req.file) {
      // Lưu đường dẫn file ảnh upload
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/orders/${req.file.filename}`;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Logic phân loại thanh toán (Cọc vs Còn lại)
    if (order.status === 'pending_payment') {
      // Giai đoạn 1: Đặt cọc
      order.payment_info.transfer_image = fileUrl;
      order.payment_info.transfer_date = new Date();
      order.payment_info.transaction_code = transaction_code;
      order.payment_info.deposit_amount = Number(amount);
      order.status = 'pending'; // Chuyển sang chờ duyệt cọc
      
      order.status_history.push({
        status: 'pending',
        changed_by: req.user.id,
        note: `Khách hàng xác nhận cọc (Mã GD: ${transaction_code})`
      });
    } else {
      // Giai đoạn 2: Thanh toán nốt
      order.payment_info.remaining_transfer_image = fileUrl;
      order.payment_info.remaining_status = 'pending'; 
      order.payment_info.remaining_paid_at = new Date();
      order.status = 'final_payment_pending'; // Chuyển sang chờ duyệt thanh toán cuối
      
      order.status_history.push({
        status: 'final_payment_pending',
        changed_by: req.user.id,
        note: `Khách hàng thanh toán phần còn lại (Mã GD: ${transaction_code})`
      });
    }

    await order.save();

    res.json({
      success: true,
      message: "Đã gửi xác nhận thanh toán. Vui lòng chờ Admin duyệt.",
      data: {
        order_id: order.order_id,
        transfer_image: fileUrl,
        status: order.status
      }
    });

  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({ message: "Lỗi khi xác nhận thanh toán", error: error.message });
  }
};

// ==============================================================================
// 📢 7. GỬI KHIẾU NẠI
// ==============================================================================
export const submitComplaint = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const result = await orderService.submitComplaint(orderId, reason, userId);
    res.json({ success: true, message: "Đã gửi khiếu nại thành công", data: result });
  } catch (error) {
    console.error("Submit complaint error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ==============================================================================
// ⭐ 8. GỬI ĐÁNH GIÁ
// ==============================================================================
export const submitReview = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const result = await orderService.submitReview(orderId, rating, comment, userId);
    res.json({ success: true, message: "Cảm ơn bạn đã đánh giá dịch vụ!", data: result });
  } catch (error) {
    console.error("Submit review error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ==============================================================================
// 👮 9. ADMIN GIẢI QUYẾT KHIẾU NẠI
// ==============================================================================
export const resolveComplaint = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, response } = req.body;
    const adminId = req.user.id;

    const result = await orderService.resolveComplaint(orderId, status, response, adminId);
    
    res.json({ 
        success: true, 
        message: status === 'resolved' ? "Đã chấp nhận khiếu nại" : "Đã từ chối khiếu nại",
        data: result 
    });
  } catch (error) {
    console.error("Resolve complaint error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================================================================
// 📋 10. LẤY TẤT CẢ ĐƠN HÀNG (ADMIN)
// ==============================================================================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer_id", "full_name email phone") 
      .populate("service_package_id", "name price")     
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách đơn!" });
  }
};

export default {
  createOrder,
  getMyOrders,
  updateOrderStatus,
  getOrderDetail,
  calculateTravelFee,
  confirmPayment,
  submitComplaint,
  submitReview,
  resolveComplaint,
  getAllOrders
};