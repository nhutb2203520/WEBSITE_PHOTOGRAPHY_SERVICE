import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    order_id: { type: String, required: true, unique: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "bangKhachHang", required: true },
    photographer_id: { type: mongoose.Schema.Types.ObjectId, ref: "bangThoChupAnh", default: null },
    service_package_id: { type: mongoose.Schema.Types.ObjectId, ref: "ServicePackage", required: true },

    // ==================== THÔNG TIN ĐẶT LỊCH ====================
    booking_date: { type: Date, required: true },
    booking_time: { type: String, required: true },
    start_time: { type: String, required: true },
    completion_date: { type: Date, default: null },
    estimated_duration_days: { type: Number, default: null },

    // Check trùng lịch
    booking_start: { type: Date },
    booking_end: { type: Date },

    // ==================== KHÁCH HÀNG & DỊCH VỤ ====================
    guest_count: { type: Number, default: 1 },
    guest_times: { type: [String], default: [] },
    selected_services: { type: [Number], default: [] },

    // ==================== ĐỊA ĐIỂM ====================
    location: {
      name: { type: String, default: "" },
      address: { type: String, required: true },
      city: { type: String, default: "" },
      district: { type: String, default: "" },
      map_link: { type: String, default: "" },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
      }
    },

    // ==================== GHI CHÚ ====================
    notes: { type: String, default: "" },
    special_requests: { type: String, default: "" },

    // ==================== PHÍ DI CHUYỂN ====================
    travel_fee: {
      enabled: { type: Boolean, default: false },
      distance_km: { type: Number, default: 0 },
      extra_km: { type: Number, default: 0 },
      free_distance_km: { type: Number, default: 0 },
      fee: { type: Number, default: 0 },
      breakdown: { type: String, default: "" },
      note: { type: String, default: "" }
    },

    // ==================== TÀI CHÍNH & THANH TOÁN ====================
    service_amount: { type: Number, required: true },
    travel_fee_amount: { type: Number, default: 0 },
    total_amount: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    final_amount: { type: Number, required: true },
    
    // Tiền cọc (30%)
    deposit_required: {
      type: Number,
      required: true,
      default: function() {
        return Math.round(this.final_amount * 0.3);
      }
    },

    deposit_paid: { type: Boolean, default: false },
    deposit_amount: { type: Number, default: 0 },

    payment_info: {
      // --- Giai đoạn 1: Đặt cọc ---
      transfer_code: { type: String, default: null },
      transfer_image: { type: String, default: null },
      transfer_date: { type: Date, default: null },
      transaction_code: { type: String, default: null },
      deposit_amount: { type: Number, default: 0 },
      deposit_status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
      
      payment_method_id: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMethod", default: null },
      verified: { type: Boolean, default: false },
      verified_by: { type: mongoose.Schema.Types.ObjectId, ref: "bangKhachHang", default: null },
      verified_at: { type: Date, default: null },

      // --- Giai đoạn 2: Thanh toán phần còn lại (Sau khi chụp) ---
      remaining_amount: { type: Number, default: 0 }, // Số tiền còn lại phải trả
      remaining_status: { type: String, enum: ['unpaid', 'pending', 'paid'], default: 'unpaid' },
      remaining_transfer_image: { type: String, default: null }, // Ảnh bill đợt 2
      remaining_paid_at: { type: Date, default: null } // Ngày Admin xác nhận đã trả đủ
    },

    // ==================== QUYẾT TOÁN CHO THỢ ẢNH (MỚI) ====================
    settlement_status: { 
        type: String, 
        default: 'pending', 
        enum: ['pending', 'paid'] // pending: Chưa trả, paid: Đã trả lương thợ
    },
    settlement_date: { 
        type: Date, 
        default: null 
    },

    // ==================== GIAO HÀNG (ALBUM ẢNH) ====================
    delivery_info: {
      deadline: { type: Date, default: null }, // Hạn chót giao ảnh (Ngày thanh toán đủ + 7 ngày)
      product_link: { type: String, default: "" }, // Link Google Drive/Flickr
      delivered_at: { type: Date, default: null }, // Ngày giao thực tế
      status: { type: String, enum: ['pending', 'delivered', 'late'], default: 'pending' }
    },

    // ==================== KHIẾU NẠI ====================
    complaint: {
      is_complained: { type: Boolean, default: false },
      reason: { type: String, default: "" },
      created_at: { type: Date, default: null },
      status: { type: String, enum: ['pending', 'resolved', 'rejected'], default: 'pending' },
      admin_response: { type: String, default: "" },
      resolved_at: { type: Date, default: null }
    },

    // ==================== ĐÁNH GIÁ ====================
    review: {
      is_reviewed: { type: Boolean, default: false },
      rating: { type: Number, default: 0 }, // 1-5 sao
      comment: { type: String, default: "" },
      created_at: { type: Date, default: null }
    },

    // ==================== TRẠNG THÁI ĐƠN HÀNG ====================
    status: {
      type: String,
      enum: [
        // Giai đoạn 1: Đặt lịch & Cọc
        "pending_payment",      // Chờ thanh toán cọc
        "pending",              // Đã cọc, chờ Admin xác nhận
        "refund_pending",       // Đã hủy khi chưa confirm -> Chờ hoàn tiền cọc
        "cancelled",            // Đã hủy (Mất cọc hoặc đã hoàn tiền xong)
        
        // Giai đoạn 2: Thực hiện
        "confirmed",            // Đã xác nhận lịch (Đã giữ chỗ)
        "in_progress",          // Đang thực hiện chụp (Đến ngày chụp)
        "waiting_final_payment",// Đã chụp xong -> Chờ khách thanh toán phần còn lại
        "final_payment_pending",// Khách đã CK phần còn lại -> Chờ Admin duyệt
        
        // Giai đoạn 3: Hậu kỳ & Giao hàng
        "processing",           // Đã thanh toán đủ -> Đang xử lý ảnh (Bắt đầu tính 7 ngày)
        "delivered",            // Photographer đã giao ảnh
        "complaint",            // Khách hàng đang khiếu nại
        "completed"             // Hoàn tất đơn hàng (Hài lòng/Hết hạn khiếu nại)
      ],
      default: "pending_payment",
    },

    // ==================== LỊCH SỬ TRẠNG THÁI ====================
    status_history: [{
      status: String,
      changed_at: { type: Date, default: Date.now },
      changed_by: { type: mongoose.Schema.Types.ObjectId, ref: "bangKhachHang" },
      note: String
    }]
  },
  { timestamps: true }
);

// ==================== INDEXES ====================
orderSchema.index({ order_id: 1 });
orderSchema.index({ customer_id: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "payment_info.transfer_code": 1 });

// ==================== METHODS ====================
orderSchema.methods.generateTransferCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CK';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.payment_info.transfer_code = code;
  return code;
};

orderSchema.methods.updateStatus = function(newStatus, userId, note = '') {
  this.status = newStatus;
  this.status_history.push({
    status: newStatus,
    changed_by: userId,
    note: note
  });
};

// ==================== HOOKS ====================
orderSchema.pre('save', function(next) {
  if (this.isModified('final_amount')) {
    // Tự động tính tiền cọc 30%
    this.deposit_required = Math.round(this.final_amount * 0.3);
    // Tự động tính số tiền còn lại cần thanh toán sau
    this.payment_info.remaining_amount = this.final_amount - this.deposit_required;
  }
  next();
});

export default mongoose.model("Orders", orderSchema);