import Orders from "../models/order.model.js";
import { ServicePackage } from "../models/index.js";
import crypto from "crypto";
import axios from "axios"; 

const generateOrderId = () => {
  return "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();
};

const BUSY_STATUSES = ["pending_payment", "pending", "confirmed", "in_progress"];

// ✅ DANH SÁCH TRẠNG THÁI HỢP LỆ
const VALID_STATUSES = [
  ...BUSY_STATUSES, 
  "completed", 
  "cancelled", 
  "refund_pending" // ✅ Thêm trạng thái chờ hoàn tiền
];

// --- HELPER FUNCTIONS ---

const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

const getDrivingDistance = async (origin, dest) => {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=false`;
    const response = await axios.get(url, { timeout: 3000 });
    if (response.data.routes && response.data.routes.length > 0) {
      const distanceMeters = response.data.routes[0].distance;
      return parseFloat((distanceMeters / 1000).toFixed(2));
    }
  } catch (error) {
    console.warn("⚠️ OSRM Error:", error.message);
  }
  return calculateHaversineDistance(origin.lat, origin.lng, dest.lat, dest.lng);
};

// =================================================================
// 📦 ORDER SERVICES
// =================================================================

export const calculateTravelFeePreview = async (packageId, customerCoords) => {
  const servicePackage = await ServicePackage.findById(packageId);
  if (!servicePackage) {
    const err = new Error("Không tìm thấy gói dịch vụ");
    err.status = 404;
    throw err;
  }

  const config = servicePackage.travelFeeConfig;
  if (!config?.enabled) {
    return { enabled: false, message: "Gói dịch vụ này không tính phí di chuyển" };
  }

  const baseCoords = servicePackage.baseLocation?.coordinates; 
  let origin = null;

  if (Array.isArray(baseCoords) && baseCoords.length === 2) {
      origin = { lng: baseCoords[0], lat: baseCoords[1] }; 
  } else if (baseCoords?.lat && baseCoords?.lng) {
      origin = baseCoords;
  }

  if (!origin) {
    return { enabled: true, error: "Photographer chưa cập nhật vị trí cơ sở" };
  }

  if (!customerCoords?.lat || !customerCoords?.lng) {
    return { enabled: true, error: "Vui lòng cung cấp tọa độ địa điểm chụp" };
  }

  const distance = await getDrivingDistance(origin, customerCoords);

  let fee = 0;
  let breakdown = "";

  if (distance <= config.freeDistanceKm) {
    fee = 0;
    breakdown = `Miễn phí trong phạm vi ${config.freeDistanceKm}km (Quãng đường: ${distance}km)`;
  } else {
    const extraKm = distance - config.freeDistanceKm;
    fee = extraKm * config.feePerKm;
    if (config.maxFee && fee > config.maxFee) fee = config.maxFee;
    breakdown = `${distance}km (Trừ ${config.freeDistanceKm}km đầu, tính phí ${extraKm.toFixed(1)}km)`;
  }

  return {
    enabled: true,
    distance_km: distance,
    fee: Math.round(fee),
    extra_km: Math.max(0, distance - config.freeDistanceKm),
    free_distance_km: config.freeDistanceKm,
    breakdown,
    note: config.note,
    photographer_location: origin 
  };
};

export const createOrder = async (params) => {
  console.log("🔥 PARAMS RECEIVED:", JSON.stringify(params, null, 2));

  const {
    customer_id, photographer_id, service_package_id,
    booking_date, start_time, completion_date, estimated_duration_days,
    guest_times = [], location = {}, notes = "", special_requests = "", selected_services = [],
    service_amount = 0, discount_amount = 0,
  } = params;

  if (!customer_id || !service_package_id || !booking_date || !start_time) {
    const err = new Error("Thiếu thông tin bắt buộc");
    err.status = 400;
    throw err;
  }

  const servicePackage = await ServicePackage.findById(service_package_id);
  if (!servicePackage) {
    const err = new Error("Không tìm thấy gói dịch vụ");
    err.status = 404;
    throw err;
  }

  const finalPhotographerId = photographer_id || servicePackage.PhotographerId;

  // Check trùng lịch
  const startDateTime = new Date(booking_date);
  const [hours, minutes] = start_time.split(':').map(Number);
  startDateTime.setHours(hours, minutes, 0, 0);

  let durationMs = 4 * 60 * 60 * 1000; 
  if (estimated_duration_days && Number(estimated_duration_days) > 0) {
    durationMs = Number(estimated_duration_days) * 24 * 60 * 60 * 1000;
  }
  const endDateTime = new Date(startDateTime.getTime() + durationMs);

  const conflictOrder = await Orders.findOne({
    photographer_id: finalPhotographerId,
    status: { $in: BUSY_STATUSES },
    $or: [
      { booking_start: { $lt: endDateTime }, booking_end: { $gt: startDateTime } }
    ]
  });

  if (conflictOrder) {
    const err = new Error(`Photographer bận trong khung giờ này`);
    err.status = 409;
    throw err;
  }

  // Tính phí di chuyển (Server-side)
  let travelFeeData = { enabled: false, distance_km: 0, fee: 0, breakdown: "", note: "" };
  const config = servicePackage.travelFeeConfig;
  let baseOrigin = null;
  
  if (servicePackage.baseLocation?.coordinates) {
      if (Array.isArray(servicePackage.baseLocation.coordinates)) {
          baseOrigin = { lng: servicePackage.baseLocation.coordinates[0], lat: servicePackage.baseLocation.coordinates[1] };
      } else {
          baseOrigin = servicePackage.baseLocation.coordinates;
      }
  }
  
  const destCoords = location?.coordinates;

  if (config?.enabled && baseOrigin && destCoords?.lat && destCoords?.lng) {
    const distance = await getDrivingDistance(baseOrigin, destCoords);
    let fee = 0;
    let breakdown = "";
    if (distance <= config.freeDistanceKm) {
        fee = 0;
        breakdown = "Miễn phí";
    } else {
        const extra = distance - config.freeDistanceKm;
        fee = extra * config.feePerKm;
        if (config.maxFee && fee > config.maxFee) fee = config.maxFee;
        breakdown = `Tính phí ${extra.toFixed(1)}km`;
    }
    travelFeeData = {
      enabled: true,
      distance_km: distance,
      extra_km: Math.max(0, distance - config.freeDistanceKm),
      free_distance_km: config.freeDistanceKm,
      fee: Math.round(fee),
      breakdown: breakdown,
      note: config.note || ""
    };
  }

  const calculatedServiceAmount = Number(service_amount) || 0;
  const travelFeeAmount = travelFeeData.fee || 0;
  const totalAmount = calculatedServiceAmount + travelFeeAmount;
  const finalAmount = totalAmount - (Number(discount_amount) || 0);
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
    booking_start: startDateTime,
    booking_end: endDateTime,
    guest_times: guest_times.filter(t => t),
    guest_count: guest_times.length || 1,
    location: {
      name: location.name || "",
      address: location.address || "",
      city: location.city || "",
      district: location.district || "",
      map_link: location.map_link || "",
      coordinates: {
        lat: destCoords?.lat || null,
        lng: destCoords?.lng || null
      }
    },
    notes,
    special_requests,
    selected_services,
    travel_fee: travelFeeData,
    service_amount: calculatedServiceAmount,
    travel_fee_amount: travelFeeAmount,
    total_amount: totalAmount,
    discount_amount: discount_amount || 0,
    final_amount: finalAmount,
    deposit_required: Math.round(finalAmount * 0.3),
    payment_info: {
      transfer_code: transferCode,
      transfer_image: null,
      transfer_date: null,
      verified: false
    },
    status: "pending_payment"
  };

  const newOrder = await Orders.create(orderData);
  return newOrder;
};

export const getOrdersByCustomer = async (customer_id) => {
  return await Orders.find({ customer_id }).populate("service_package_id").sort({ createdAt: -1 }).exec();
};

// ✅ UPDATE STATUS - Logic quan trọng
export const updateOrderStatus = async (orderId, status, userId = null, note = "") => {
  if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Trạng thái không hợp lệ: ${status}`);
  }

  let order = await Orders.findOne({ order_id: orderId });
  if (!order) order = await Orders.findById(orderId);
  if (!order) throw new Error("Order not found");

  // Logic bổ sung: Nếu admin chuyển trạng thái
  if (status === 'cancelled') {
      // Có thể thêm logic hoàn lại slot nếu cần (bỏ qua vì đã check BUSY_STATUSES)
  }

  order.updateStatus(status, userId, note);
  await order.save();
  return order;
};

export const getOrderByOrderId = async (orderId) => {
  let order = await Orders.findOne({ order_id: orderId }).populate("service_package_id").populate("payment_info.payment_method_id").exec();
  if (!order) order = await Orders.findById(orderId).populate("service_package_id").exec();
  if (!order) throw new Error("Order not found");
  return order;
};

export default {
  createOrder,
  calculateTravelFeePreview,
  getOrdersByCustomer,
  updateOrderStatus,
  getOrderByOrderId,
};