import orderService from "../services/order.service.js";
import Orders from "../models/order.model.js"; // Đảm bảo đường dẫn này đúng với file Model của bạn

// 📦 Tạo đơn hàng
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

// 📋 Lấy đơn hàng của tôi
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

// 🔄 Cập nhật trạng thái
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

// 🔍 Lấy chi tiết
export const getOrderDetail = async (req, res) => {
  try {
    const order = await orderService.getOrderByOrderId(req.params.orderId);
    res.json({ data: order });
  } catch (error) {
    console.error("Get order detail error:", error);
    res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
  }
};

// 🚚 Tính phí di chuyển
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

// ✅ XÁC NHẬN THANH TOÁN (FULL CODE ĐÃ SỬA)
export const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params; // Lấy ID từ URL
    
    // 👇 LOG DEBUG: Xem server nhận được gì
    console.log(`📸 [Payment] OrderID: ${orderId}`);
    console.log("📂 File nhận được:", req.file ? req.file.filename : "Không có file");
    console.log("📝 Body nhận được:", req.body);

    const { method, amount, transaction_code } = req.body;

    // 1. Kiểm tra file (Bắt buộc nếu là Banking)
    if (method === 'banking' && !req.file) {
      return res.status(400).json({ message: "Vui lòng tải lên ảnh xác thực chuyển khoản!" });
    }

    // 2. Tạo đường dẫn file ảnh
    let fileUrl = null;
    if (req.file) {
      // Cần đảm bảo app.js đã cấu hình static folder cho 'uploads'
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/orders/${req.file.filename}`;
    }

    // 3. Tìm đơn hàng (Sử dụng findById vì URL chứa MongoID)
    const order = await Orders.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // 4. Cập nhật thông tin thanh toán
    order.payment_info.transfer_image = fileUrl;
    order.payment_info.transfer_date = new Date();
    
    // Lưu mã giao dịch nếu có (bạn cần đảm bảo model có trường này, hoặc lưu vào transfer_code)
    // order.payment_info.transfer_code = transaction_code; 
    
    order.payment_info.deposit_amount = Number(amount);
    
    // Lưu phương thức thanh toán (nếu schema hỗ trợ)
    if (method) order.payment_method = method; // Hoặc order.payment_info.payment_method

    // 5. Chuyển trạng thái sang "Chờ xác nhận" (pending)
    if (order.status === 'pending_payment') {
      order.status = 'pending';
      
      // Thêm lịch sử
      order.status_history.push({
        status: 'pending',
        changed_by: req.user.id,
        note: `Khách hàng đã gửi ảnh xác thực (Mã GD: ${transaction_code || 'N/A'})`
      });
    }

    await order.save();

    res.json({
      success: true,
      message: "Đã gửi xác nhận thanh toán. Vui lòng chờ duyệt.",
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

export default {
  createOrder,
  getMyOrders,
  updateOrderStatus,
  getOrderDetail,
  calculateTravelFee,
  confirmPayment,
};