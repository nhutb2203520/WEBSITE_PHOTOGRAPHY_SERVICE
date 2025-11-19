import Orders from "../models/order.model.js";
import crypto from "crypto";

/**
 * Tạo mã order ngẫu nhiên kiểu "ORD-XXXXXXX"
 */
const generateOrderId = () => {
  return "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();
};

const VALID_STATUSES = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

/**
 * Tạo đơn hàng mới - UPDATED VERSION
 */
export const createOrder = async (params) => {
  // 🔥 DEBUG: Log toàn bộ params nhận được
  console.log("🔥 PARAMS RECEIVED:", JSON.stringify(params, null, 2));

  // Destructure sau khi log
  const {
    customer_id,
    photographer_id,
    service_package_id,
    booking_date,
    start_time,
    completion_date,
    estimated_duration_days,
    guest_times = [],
    location = {},
    notes = "",
    special_requests = "",
    selected_services = [],
    total_amount,
    discount_amount = 0,
  } = params;

  // 🔍 Validation chi tiết
  console.log("🔍 Validating order data:");
  console.log("  customer_id:", customer_id);
  console.log("  service_package_id:", service_package_id);
  console.log("  booking_date:", booking_date);
  console.log("  start_time:", start_time);

  const missingFields = [];
  if (!customer_id) missingFields.push("customer_id");
  if (!service_package_id) missingFields.push("service_package_id");
  if (!booking_date) missingFields.push("booking_date");
  if (!start_time) missingFields.push("start_time");

  if (missingFields.length > 0) {
    const err = new Error(`Thiếu thông tin bắt buộc: ${missingFields.join(", ")}`);
    err.status = 400;
    console.error("❌ Validation failed. Missing fields:", missingFields);
    throw err;
  }

  console.log("✅ Validation passed!");

  // Tính toán giá trị
  const calculatedTotal = total_amount || 0;
  const final_amount = Number(calculatedTotal) - Number(discount_amount || 0);

  // Chuẩn bị dữ liệu để lưu vào DB
  const orderData = {
    order_id: generateOrderId(),
    customer_id,
    photographer_id: photographer_id || null,
    service_package_id,
    booking_date,
    booking_time: start_time, // ✅ Map start_time -> booking_time
    start_time,
    completion_date,
    estimated_duration_days,
    guest_times: guest_times.filter(t => t), // Lọc bỏ giá trị rỗng
    guest_count: guest_times.filter(t => t).length || 1,
    location,
    notes,
    special_requests,
    selected_services,
    total_amount: calculatedTotal,
    discount_amount: discount_amount || 0,
    final_amount,
  };

  console.log("💾 Creating order with data:", JSON.stringify(orderData, null, 2));

  const newOrder = await Orders.create(orderData);

  console.log("✅ Order created successfully:", newOrder.order_id);

  return newOrder;
};

/**
 * Lấy danh sách order của một customer
 */
export const getOrdersByCustomer = async (
  customer_id,
  options = { populate: true, sort: { createdAt: -1 } }
) => {
  if (!customer_id) {
    const err = new Error("customer_id không được để trống.");
    err.status = 400;
    throw err;
  }

  let query = Orders.find({ customer_id });

  if (options.populate) {
    query = query.populate("service_package_id").populate("photographer_id");
  }

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const orders = await query.exec();
  return orders;
};

/**
 * Cập nhật trạng thái order theo order_id
 */
export const updateOrderStatus = async (orderId, status) => {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error("Trạng thái không hợp lệ.");
    err.status = 400;
    throw err;
  }

  const updated = await Orders.findOneAndUpdate(
    { order_id: orderId },
    { status },
    { new: true }
  );

  if (!updated) {
    const err = new Error("Không tìm thấy đơn hàng với order_id cung cấp.");
    err.status = 404;
    throw err;
  }

  return updated;
};

/**
 * Lấy order theo order_id
 */
export const getOrderByOrderId = async (orderId) => {
  if (!orderId) {
    const err = new Error("orderId bắt buộc.");
    err.status = 400;
    throw err;
  }

  const order = await Orders.findOne({ order_id: orderId })
    .populate("service_package_id")
    .populate("photographer_id")
    .exec();

  if (!order) {
    const err = new Error("Không tìm thấy đơn hàng.");
    err.status = 404;
    throw err;
  }

  return order;
};

export default {
  createOrder,
  getOrdersByCustomer,
  updateOrderStatus,
  getOrderByOrderId,
};