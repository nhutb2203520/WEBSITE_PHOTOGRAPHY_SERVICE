import Orders from "../models/order.model.js";
import { ServicePackage } from "../models/index.js";
import crypto from "crypto";

const generateOrderId = () => {
  return "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();
};

// Các trạng thái được coi là "đã kín lịch"
const BUSY_STATUSES = ["pending_payment", "pending", "confirmed", "in_progress"];

const VALID_STATUSES = [...BUSY_STATUSES, "completed", "cancelled"];

/**
 * Tính khoảng cách Haversine (km)
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

/**
 * Tạo đơn hàng mới - CÓ TÍNH PHÍ DI CHUYỂN & CHECK TRÙNG LỊCH
 */
export const createOrder = async (params) => {
  console.log("🔥 PARAMS RECEIVED:", JSON.stringify(params, null, 2));

  const {
    customer_id,
    photographer_id, // Có thể null nếu lấy từ package
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
    service_amount = 0,
    discount_amount = 0,
  } = params;

  // 1. Validation cơ bản
  const missingFields = [];
  if (!customer_id) missingFields.push("customer_id");
  if (!service_package_id) missingFields.push("service_package_id");
  if (!booking_date) missingFields.push("booking_date");
  if (!start_time) missingFields.push("start_time");

  if (missingFields.length > 0) {
    const err = new Error(`Thiếu thông tin bắt buộc: ${missingFields.join(", ")}`);
    err.status = 400;
    throw err;
  }

  // 2. 🔥 LẤY THÔNG TIN GÓI ĐỂ XÁC ĐỊNH PHOTOGRAPHER
  const servicePackage = await ServicePackage.findById(service_package_id);
  if (!servicePackage) {
    const err = new Error("Không tìm thấy gói dịch vụ");
    err.status = 404;
    throw err;
  }

  const finalPhotographerId = photographer_id || servicePackage.PhotographerId;

  // ==================================================================
  // 🔥 BẮT ĐẦU LOGIC CHECK TRÙNG LỊCH (QUAN TRỌNG)
  // ==================================================================
  
  // B1: Xác định thời gian Bắt đầu (Date Object)
  const startDateTime = new Date(booking_date);
  const [hours, minutes] = start_time.split(':').map(Number);
  startDateTime.setHours(hours, minutes, 0, 0);

  // B2: Xác định thời gian Kết thúc (Date Object)
  // Mặc định chụp 4 tiếng nếu không có estimated_duration_days
  let durationMs = 4 * 60 * 60 * 1000; 
  
  if (estimated_duration_days && Number(estimated_duration_days) > 0) {
    // Nếu là gói chụp dài ngày
    durationMs = Number(estimated_duration_days) * 24 * 60 * 60 * 1000;
  } else if (servicePackage.ThoiGianThucHien) {
    // Nếu gói có ghi "2-3 giờ", ta parse lấy số lớn nhất để an toàn, hoặc mặc định
    // Ở đây tạm thời fallback về 4 tiếng cho an toàn
  }

  const endDateTime = new Date(startDateTime.getTime() + durationMs);

  console.log(`Checking schedule for Photographer: ${finalPhotographerId}`);
  console.log(`Time slot: ${startDateTime.toISOString()} - ${endDateTime.toISOString()}`);

  // B3: Query Database xem có đơn nào chèn vào khung giờ này không
  // Điều kiện trùng: (StartA < EndB) và (EndA > StartB)
  const conflictOrder = await Orders.findOne({
    photographer_id: finalPhotographerId,
    status: { $in: BUSY_STATUSES }, // Chỉ check các đơn đang hoạt động
    $or: [
      {
        // Đơn mới bắt đầu nằm trong khoảng thời gian đơn cũ
        booking_start: { $lt: endDateTime }, 
        booking_end: { $gt: startDateTime }
      }
    ]
  });

  if (conflictOrder) {
    const err = new Error(`Rất tiếc, Photographer đã có lịch bận trong khung giờ này (${startDateTime.toLocaleString('vi-VN')}). Vui lòng chọn giờ khác!`);
    err.status = 409; // Conflict
    throw err;
  }
  // ==================================================================
  // 🔥 KẾT THÚC CHECK TRÙNG LỊCH
  // ==================================================================


  // 3. 🔥 TÍNH PHÍ DI CHUYỂN
  let travelFeeData = {
    enabled: false,
    distance_km: 0,
    extra_km: 0,
    free_distance_km: 0,
    fee: 0,
    breakdown: "",
    note: ""
  };

  const config = servicePackage.travelFeeConfig;
  const baseCoords = servicePackage.baseLocation?.coordinates;
  const customerCoords = location?.coordinates;

  if (
    config?.enabled &&
    baseCoords?.lat && baseCoords?.lng &&
    customerCoords?.lat && customerCoords?.lng
  ) {
    const distance = calculateDistance(
      baseCoords.lat,
      baseCoords.lng,
      customerCoords.lat,
      customerCoords.lng
    );

    console.log(`📍 Distance calculated: ${distance}km`);

    const feeResult = servicePackage.calculateTravelFee(distance);
    
    travelFeeData = {
      enabled: true,
      distance_km: distance,
      extra_km: feeResult.extraKm || 0,
      free_distance_km: feeResult.freeDistanceKm || config.freeDistanceKm || 0,
      fee: feeResult.fee,
      breakdown: feeResult.breakdown,
      note: feeResult.note || config.note || ""
    };

    console.log("💰 Travel fee calculated:", travelFeeData);
  }

  // 4. 🔥 TÍNH TOÁN TỔNG TIỀN
  const calculatedServiceAmount = service_amount || 0;
  const travelFeeAmount = travelFeeData.fee || 0;
  const totalAmount = calculatedServiceAmount + travelFeeAmount;
  const finalAmount = totalAmount - (discount_amount || 0);

  // Tạo mã chuyển khoản
  const transferCode = 'CK' + crypto.randomBytes(4).toString('hex').toUpperCase();

  const orderData = {
    order_id: generateOrderId(),
    customer_id,
    photographer_id: finalPhotographerId,
    service_package_id,
    booking_date,
    booking_time: start_time,
    start_time,
    completion_date,
    estimated_duration_days,
    
    // ✅ LƯU THÊM START/END ĐỂ DỄ QUERY LẦN SAU
    booking_start: startDateTime,
    booking_end: endDateTime,

    guest_times: guest_times.filter(t => t),
    guest_count: guest_times.filter(t => t).length || 1,
    location: {
      name: location.name || "",
      address: location.address || "",
      city: location.city || "",
      district: location.district || "",
      map_link: location.map_link || "",
      coordinates: {
        lat: customerCoords?.lat || null,
        lng: customerCoords?.lng || null
      }
    },
    notes,
    special_requests,
    selected_services,
    
    // 💰 Phí di chuyển
    travel_fee: travelFeeData,
    
    // 💰 Thanh toán
    service_amount: calculatedServiceAmount,
    travel_fee_amount: travelFeeAmount,
    total_amount: totalAmount,
    discount_amount: discount_amount || 0,
    final_amount: finalAmount,
    deposit_required: Math.round(finalAmount * 0.3),
    
    // Mã chuyển khoản
    payment_info: {
      transfer_code: transferCode,
      transfer_image: null,
      transfer_date: null,
      verified: false
    },
    
    status: "pending_payment"
  };

  console.log("💾 Creating order with data:", JSON.stringify(orderData, null, 2));

  const newOrder = await Orders.create(orderData);
  console.log("✅ Order created:", newOrder.order_id);

  return newOrder;
};

/**
 * API tính phí di chuyển (preview, không tạo đơn)
 */
export const calculateTravelFeePreview = async (packageId, customerCoords) => {
  const servicePackage = await ServicePackage.findById(packageId);
  
  if (!servicePackage) {
    const err = new Error("Không tìm thấy gói dịch vụ");
    err.status = 404;
    throw err;
  }

  const config = servicePackage.travelFeeConfig;
  const baseCoords = servicePackage.baseLocation?.coordinates;

  // Nếu không bật hoặc thiếu tọa độ
  if (!config?.enabled) {
    return {
      enabled: false,
      message: "Gói dịch vụ này không tính phí di chuyển"
    };
  }

  if (!baseCoords?.lat || !baseCoords?.lng) {
    return {
      enabled: true,
      error: "Photographer chưa cập nhật vị trí cơ sở"
    };
  }

  if (!customerCoords?.lat || !customerCoords?.lng) {
    return {
      enabled: true,
      error: "Vui lòng cung cấp tọa độ địa điểm chụp"
    };
  }

  const distance = calculateDistance(
    baseCoords.lat,
    baseCoords.lng,
    customerCoords.lat,
    customerCoords.lng
  );

  const feeResult = servicePackage.calculateTravelFee(distance);

  return {
    enabled: true,
    distance_km: distance,
    ...feeResult,
    photographer_location: servicePackage.baseLocation
  };
};

// ==================== CÁC HÀM KHÁC GIỮ NGUYÊN ====================

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
    query = query.populate("service_package_id");
  }

  if (options.sort) query = query.sort(options.sort);
  if (options.limit) query = query.limit(options.limit);

  return await query.exec();
};

export const updateOrderStatus = async (orderId, status, userId = null, note = "") => {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error("Trạng thái không hợp lệ.");
    err.status = 400;
    throw err;
  }

  const order = await Orders.findOne({ order_id: orderId });
  if (!order) {
    const err = new Error("Không tìm thấy đơn hàng.");
    err.status = 404;
    throw err;
  }

  order.updateStatus(status, userId, note);
  await order.save();

  return order;
};

export const getOrderByOrderId = async (orderId) => {
  if (!orderId) {
    const err = new Error("orderId bắt buộc.");
    err.status = 400;
    throw err;
  }

  const order = await Orders.findOne({ order_id: orderId })
    .populate("service_package_id")
    .populate("payment_info.payment_method_id")
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
  calculateTravelFeePreview,
  getOrdersByCustomer,
  updateOrderStatus,
  getOrderByOrderId,
};