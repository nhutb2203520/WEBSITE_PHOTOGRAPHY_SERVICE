import Order from "../models/order.model.js";
import ServicePackage from "../models/servicePackage.model.js";
import Review from "../models/review.model.js";
import mongoose from "mongoose";
import orderService from "../services/order.service.js"; 

// 📦 Tạo đơn hàng mới
export const createOrder = async (req, res) => {
  try {
    const customer_id = req.user.id;
    // Gọi service để xử lý logic tạo đơn phức tạp (nếu có)
    const payload = { customer_id, ...req.body };
    const newOrder = await orderService.createOrder(payload);
    
    res.status(201).json({ 
      message: "Tạo đơn hàng thành công!", 
      data: newOrder,
      payment_info: {
        transfer_code: newOrder.payment_info.transfer_code,
        deposit_required: newOrder.deposit_required,
        final_amount: newOrder.final_amount
      }
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
  }
};

// 📋 Lấy danh sách đơn hàng của tôi (KÈM REVIEW)
// ✅ HÀM ĐÃ ĐƯỢC VIẾT LẠI ĐỂ FIX LỖI REVIEW UNDEFINED
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const orders = await Order.aggregate([
      // 1. Lọc theo User ID
      { 
        $match: { 
            customer_id: new mongoose.Types.ObjectId(userId) 
        } 
      },

      // 2. Join bảng ServicePackage để lấy thông tin gói
      {
        $lookup: {
          from: "servicepackages", // Tên collection trong MongoDB (thường là chữ thường, số nhiều)
          localField: "service_package_id",
          foreignField: "_id",
          as: "package_info"
        }
      },
      { 
        $unwind: { path: "$package_info", preserveNullAndEmptyArrays: true } 
      },

      // 3. Join bảng Reviews để lấy đánh giá (nếu có)
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "OrderId",
          as: "review_info"
        }
      },
      
      // 4. Xử lý dữ liệu trả về
      {
        $addFields: {
            // Lấy phần tử đầu tiên trong mảng review (vì 1 đơn chỉ có 1 review)
            review: { $arrayElemAt: ["$review_info", 0] },
            // Map lại tên trường để khớp với Frontend cũ
            service_package_id: "$package_info" 
        }
      },

      // 5. Sắp xếp mới nhất
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

// 🔄 Cập nhật trạng thái (Admin/Photographer)
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

// 🔍 Lấy chi tiết đơn hàng
export const getOrderDetail = async (req, res) => {
  try {
    const order = await orderService.getOrderByOrderId(req.params.orderId);
    res.json({ data: order });
  } catch (error) {
    console.error("Get order detail error:", error);
    res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
  }
};

// 🚚 Tính phí di chuyển (Preview)
export const calculateTravelFee = async (req, res) => {
  try {
    const { packageId, lat, lng } = req.body;
    
    if (!packageId) {
      return res.status(400).json({ message: "Vui lòng cung cấp packageId" });
    }
    
    const result = await orderService.calculateTravelFeePreview(packageId, { lat, lng });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Calculate travel fee error:", error);
    res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
  }
};

// ✅ XÁC NHẬN THANH TOÁN
export const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params; 
    const { method, amount, transaction_code } = req.body;

    if (method === 'banking' && !req.file) {
      return res.status(400).json({ message: "Vui lòng tải lên ảnh xác thực chuyển khoản!" });
    }

    let fileUrl = null;
    if (req.file) {
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/orders/${req.file.filename}`;
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    if (order.status === 'pending_payment') {
      order.payment_info.transfer_image = fileUrl;
      order.payment_info.transfer_date = new Date();
      order.payment_info.transaction_code = transaction_code;
      order.payment_info.deposit_amount = Number(amount);
      order.status = 'pending';
      
      order.status_history.push({
        status: 'pending',
        changed_by: req.user.id,
        note: `Khách hàng đã gửi ảnh cọc (Mã GD: ${transaction_code || 'N/A'})`
      });
    } else {
      order.payment_info.remaining_transfer_image = fileUrl;
      order.payment_info.remaining_status = 'pending'; 
      order.payment_info.remaining_paid_at = new Date();
      order.status = 'final_payment_pending';
      
      order.status_history.push({
        status: 'final_payment_pending',
        changed_by: req.user.id,
        note: `Khách hàng đã gửi ảnh thanh toán phần còn lại (Mã GD: ${transaction_code || 'N/A'})`
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

// 📢 Gửi khiếu nại
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

// ⭐ Gửi đánh giá (Backward Compatibility)
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

// 👮 Admin giải quyết khiếu nại
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