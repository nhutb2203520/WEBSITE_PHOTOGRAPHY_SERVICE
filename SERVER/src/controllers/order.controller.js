import orderService from "../services/order.service.js";

export const createOrder = async (req, res) => {
  try {
    const customer_id = req.user.id;
    
    // 🔍 DEBUG: Xem dữ liệu nhận được từ frontend
    console.log("📥 Received request body:", JSON.stringify(req.body, null, 2));
    console.log("👤 Customer ID from token:", customer_id);
    
    const payload = { customer_id, ...req.body };
    
    // 🔍 DEBUG: Xem payload hoàn chỉnh trước khi gửi vào service
    console.log("📦 Full payload to service:", JSON.stringify(payload, null, 2));
    
    const newOrder = await orderService.createOrder(payload);
    res.status(201).json({ message: "Tạo đơn hàng thành công!", data: newOrder });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
  }
};

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

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await orderService.updateOrderStatus(req.params.orderId, status);
    res.json({ message: "Cập nhật trạng thái thành công", data: updated });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(error.status || 500).json({ message: error.message || "Lỗi server!" });
  }
};

// ✅ KHÔNG CẦN export default nếu đã dùng named exports
// Nhưng nếu muốn có cả hai:
export default {
  createOrder,
  getMyOrders,
  updateOrderStatus,
};