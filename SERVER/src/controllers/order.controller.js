import orderService from "../services/order.service.js";
import Orders from "../models/order.model.js"; 

// 📦 Tạo đơn hàng mới
export const createOrder = async (req, res) => {
  try {
    const customer_id = req.user.id;
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

// 📋 Lấy danh sách đơn hàng của tôi
export const getMyOrders = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const orders = await orderService.getOrdersByCustomer(customer_id);
    res.json({ message: "Danh sách đơn hàng của bạn", data: orders });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
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

// ✅ XÁC NHẬN THANH TOÁN (CỌC HOẶC PHẦN CÒN LẠI)
export const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params; 
    
    const { method, amount, transaction_code } = req.body;

    // 1. Kiểm tra file (Bắt buộc nếu là Banking)
    if (method === 'banking' && !req.file) {
      return res.status(400).json({ message: "Vui lòng tải lên ảnh xác thực chuyển khoản!" });
    }

    // 2. Tạo đường dẫn file ảnh
    let fileUrl = null;
    if (req.file) {
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/orders/${req.file.filename}`;
    }

    // 3. Tìm đơn hàng
    const order = await Orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // 4. Phân loại thanh toán
    // Trường hợp 1: Thanh toán Cọc (Lần đầu)
    if (order.status === 'pending_payment') {
      order.payment_info.transfer_image = fileUrl;
      order.payment_info.transfer_date = new Date();
      order.payment_info.transaction_code = transaction_code;
      order.payment_info.deposit_amount = Number(amount);
      
      // Chuyển trạng thái sang "Chờ xác nhận cọc"
      order.status = 'pending';
      
      order.status_history.push({
        status: 'pending',
        changed_by: req.user.id,
        note: `Khách hàng đã gửi ảnh cọc (Mã GD: ${transaction_code || 'N/A'})`
      });
    } 
    // Trường hợp 2: Thanh toán Phần còn lại (Sau khi chụp/Trước khi giao ảnh)
    else {
      order.payment_info.remaining_transfer_image = fileUrl;
      order.payment_info.remaining_status = 'pending'; // Chờ duyệt
      order.payment_info.remaining_paid_at = new Date(); // Tạm lưu thời gian gửi

      // Chuyển trạng thái sang "Chờ duyệt thanh toán cuối"
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

// 📢 Gửi khiếu nại (Khách hàng)
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

// ⭐ Gửi đánh giá (Khách hàng)
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
    const { status, response } = req.body; // status: 'resolved' | 'rejected'
    const adminId = req.user.id;

    const result = await orderService.resolveComplaint(orderId, status, response, adminId);
    
    res.json({ 
        success: true, 
        message: status === 'resolved' ? "Đã chấp nhận khiếu nại (Cộng lỗi vào gói)" : "Đã từ chối khiếu nại",
        data: result 
    });
  } catch (error) {
    console.error("Resolve complaint error:", error);
    res.status(500).json({ message: error.message });
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
  resolveComplaint
};