import Orders from "../models/order.model.js";
import ServicePackage from "../models/servicePackage.model.js"; 
import crypto from "crypto";
import axios from "axios"; 

const generateOrderId = () => "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();

const BUSY_STATUSES = ["pending_payment", "pending", "confirmed", "in_progress", "waiting_final_payment", "final_payment_pending", "processing"];

const VALID_STATUSES = [
  ...BUSY_STATUSES, 
  "completed", "cancelled", "refund_pending", 
  "delivered", "complaint"
];

// --- Helper tính khoảng cách ---
const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
};

const getDrivingDistance = async (origin, dest) => {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=false`;
    const response = await axios.get(url, { timeout: 3000 });
    if (response.data.routes?.length > 0) return parseFloat((response.data.routes[0].distance / 1000).toFixed(2));
  } catch (e) {}
  return calculateHaversineDistance(origin.lat, origin.lng, dest.lat, dest.lng);
};

// --- SERVICE METHODS ---

export const calculateTravelFeePreview = async (packageId, customerCoords) => {
  const pkg = await ServicePackage.findById(packageId);
  if (!pkg) throw new Error("Không tìm thấy gói dịch vụ");
  
  const config = pkg.travelFeeConfig;
  if (!config?.enabled) return { enabled: false, message: "Miễn phí di chuyển" };

  const baseCoords = pkg.baseLocation?.coordinates;
  let origin = null;
  if (Array.isArray(baseCoords) && baseCoords.length === 2) origin = { lng: baseCoords[0], lat: baseCoords[1] };
  else if (baseCoords?.lat) origin = baseCoords;

  if (!origin || !customerCoords?.lat) return { enabled: true, error: "Thiếu thông tin vị trí" };

  const distance = await getDrivingDistance(origin, customerCoords);
  let fee = 0, breakdown = "";

  if (distance <= config.freeDistanceKm) {
    breakdown = `Miễn phí ${config.freeDistanceKm}km đầu`;
  } else {
    const extra = distance - config.freeDistanceKm;
    fee = extra * config.feePerKm;
    if (config.maxFee && fee > config.maxFee) fee = config.maxFee;
    breakdown = `Tính phí ${extra.toFixed(1)}km`;
  }

  return {
    enabled: true, distance_km: distance, fee: Math.round(fee),
    extra_km: Math.max(0, distance - config.freeDistanceKm),
    free_distance_km: config.freeDistanceKm, breakdown, note: config.note,
    photographer_location: origin
  };
};

export const createOrder = async (params) => {
  console.log("🔥 Creating Order:", params.customer_id);
  const { customer_id, photographer_id, service_package_id, booking_date, start_time, booking_time, estimated_duration_days, location = {}, service_amount, discount_amount } = params;

  const pkg = await ServicePackage.findById(service_package_id);
  if (!pkg) throw new Error("Gói dịch vụ không tồn tại");

  const finalBookingTime = booking_time || start_time;
  if (!finalBookingTime) throw new Error("Thiếu thông tin giờ bắt đầu (booking_time)");

  // Check trùng lịch
  const startDateTime = new Date(booking_date);
  const [h, m] = finalBookingTime.split(':').map(Number);
  startDateTime.setHours(h, m, 0, 0);
  
  let durationMs = 4 * 3600000; 
  if (estimated_duration_days > 0) durationMs = estimated_duration_days * 24 * 3600000;
  const endDateTime = new Date(startDateTime.getTime() + durationMs);

  const conflict = await Orders.findOne({
    photographer_id: photographer_id || pkg.PhotographerId,
    status: { $in: ["pending", "confirmed", "in_progress", "waiting_final_payment", "processing"] },
    $or: [{ booking_start: { $lt: endDateTime }, booking_end: { $gt: startDateTime } }]
  });
  if (conflict) throw new Error("Photographer bận vào khung giờ này");

  const travelFeeAmount = params.travel_fee_amount || 0; 
  const totalAmount = Number(service_amount) + Number(travelFeeAmount);
  const finalAmount = totalAmount - (Number(discount_amount) || 0);
  const depositRequired = Math.round(finalAmount * 0.3);

  const newOrder = await Orders.create({
    ...params,
    booking_time: finalBookingTime, 
    start_time: finalBookingTime,   
    order_id: generateOrderId(),
    photographer_id: photographer_id || pkg.PhotographerId,
    booking_start: startDateTime,
    booking_end: endDateTime,
    total_amount: totalAmount,
    final_amount: finalAmount,
    deposit_required: depositRequired,
    
    payment_info: { 
        transfer_code: 'CK' + crypto.randomBytes(4).toString('hex').toUpperCase(),
        deposit_amount: 0,
        remaining_amount: finalAmount - depositRequired
    },
    
    status: "pending_payment"
  });
  
  // ❌ ĐÃ XÓA: Không tăng lượt đặt ở đây nữa
  // await pkg.incrementBooking(); 

  return newOrder;
};

// ✅ HÀM CẬP NHẬT TRẠNG THÁI & LOGIC TỰ ĐỘNG
export const updateOrderStatus = async (orderId, status, userId = null, note = "") => {
  if (!VALID_STATUSES.includes(status)) throw new Error(`Trạng thái không hợp lệ: ${status}`);
  
  let order = await Orders.findOne({ order_id: orderId });
  if (!order) order = await Orders.findById(orderId);
  if (!order) throw new Error("Order not found");

  // --- LOGIC TỰ ĐỘNG ---

  // 1. Admin xác nhận đơn hàng (confirmed) -> Tăng lượt đặt cho gói dịch vụ
  if (status === 'confirmed' && order.status !== 'confirmed') {
      // ✅ MỚI: Chỉ tăng khi đơn được xác nhận
      await ServicePackage.findByIdAndUpdate(
          order.service_package_id, 
          { $inc: { SoLuongDaDat: 1 } }
      );
      note = note || "Admin đã xác nhận đơn hàng.";
  }

  // 2. Admin xác nhận thanh toán đợt 2 (đủ tiền) -> Chuyển sang 'processing'
  //    => Tự động tính Deadline giao hàng là 7 ngày sau
  if (status === 'processing') {
      order.payment_info.remaining_status = 'paid';
      order.payment_info.remaining_paid_at = new Date();
      
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7); // Cộng 7 ngày
      order.delivery_info.deadline = deadline;
      
      note = note || `Đã thanh toán đủ. Hạn chót giao ảnh: ${deadline.toLocaleDateString('vi-VN')}`;
  }

  // 3. Photographer giao hàng (delivered) -> Check trễ hạn
  if (status === 'delivered') {
      order.delivery_info.delivered_at = new Date();
      
      // Nếu ngày giao > deadline -> Đánh dấu trễ
      if (order.delivery_info.deadline && new Date() > order.delivery_info.deadline) {
          order.delivery_info.status = 'late';
          note += " (Giao trễ hạn - Khách có quyền khiếu nại)";
      } else {
          order.delivery_info.status = 'delivered';
      }
  }

  // 4. Hoàn tất đơn hàng
  if (status === 'completed') {
      order.completion_date = new Date();
  }
  
  // 5. Hủy đơn -> Giảm lượt đặt nếu đơn đã từng được confirm
  if (status === 'cancelled' && order.status === 'confirmed') {
       await ServicePackage.findByIdAndUpdate(
          order.service_package_id, 
          { $inc: { SoLuongDaDat: -1 } }
      );
  }

  order.updateStatus(status, userId, note);
  await order.save();
  return order;
};

// 4. KHÁCH HÀNG GỬI KHIẾU NẠI
export const submitComplaint = async (orderId, reason, userId) => {
    const order = await Orders.findOne({ order_id: orderId });
    if (!order) throw new Error("Order not found");

    const isLate = order.delivery_info.deadline && new Date() > order.delivery_info.deadline;
    const isDelivered = order.status === 'delivered';

    if (!isDelivered && !isLate && order.status !== 'processing') {
        throw new Error("Chưa đến thời điểm có thể khiếu nại.");
    }

    order.complaint = { 
        is_complained: true, 
        reason: reason, 
        created_at: new Date(), 
        status: 'pending' 
    };
    
    order.updateStatus('complaint', userId, `Khách hàng khiếu nại: ${reason}`);
    await order.save();
    return order;
};

// 5. ADMIN GIẢI QUYẾT KHIẾU NẠI
export const resolveComplaint = async (orderId, resolution, adminResponse, userId) => {
    const order = await Orders.findOne({ order_id: orderId });
    if (!order) throw new Error("Order not found");

    order.complaint.status = resolution; 
    order.complaint.admin_response = adminResponse;
    order.complaint.resolved_at = new Date();

    if (resolution === 'resolved') {
        await ServicePackage.findByIdAndUpdate(
            order.service_package_id, 
            { $inc: { SoLuongKhieuNai: 1 } }
        );
        order.status = 'completed'; 
        order.status_history.push({ 
            status: 'completed', 
            changed_by: userId, 
            note: "Admin CHẤP NHẬN khiếu nại (Đã ghi nhận lỗi vào uy tín gói)." 
        });
    } else {
        order.status = 'completed'; 
        order.status_history.push({ 
            status: 'completed', 
            changed_by: userId, 
            note: "Admin TỪ CHỐI khiếu nại. Đơn hàng hoàn tất." 
        });
    }

    await order.save();
    return order;
};

// 6. KHÁCH HÀNG ĐÁNH GIÁ
export const submitReview = async (orderId, rating, comment, userId) => {
    const order = await Orders.findOne({ order_id: orderId });
    if (!order) throw new Error("Order not found");

    if (order.status !== 'completed' && order.status !== 'delivered') {
        throw new Error("Chỉ được đánh giá khi đơn hàng đã hoàn thành hoặc đã giao hàng.");
    }

    order.review = { is_reviewed: true, rating, comment, created_at: new Date() };
    if (order.status !== 'completed') order.status = 'completed';
    
    const pkg = await ServicePackage.findById(order.service_package_id);
    if (pkg) {
        await pkg.updateRating(rating); 
    }

    await order.save();
    return order;
};

export const getOrdersByCustomer = async (cid) => Orders.find({ customer_id: cid }).populate("service_package_id").sort({ createdAt: -1 });

export const getOrderByOrderId = async (oid) => {
    let order = await Orders.findOne({ order_id: oid }).populate("service_package_id").populate("payment_info.payment_method_id");
    if(!order) order = await Orders.findById(oid).populate("service_package_id");
    return order;
};

export default {
  createOrder, calculateTravelFeePreview, getOrdersByCustomer, updateOrderStatus,
  getOrderByOrderId, submitComplaint, resolveComplaint, submitReview
};