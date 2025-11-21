import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      required: true,
      unique: true,
    },

    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangKhachHang",
      required: true,
    },

    photographer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangThoChupAnh",
      required: false,
      default: null,
    },

    service_package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServicePackage",
      required: true,
    },

    // ==================== THÔNG TIN ĐẶT LỊCH ====================
    booking_date: { type: Date, required: true },
    booking_time: { type: String, required: true },
    start_time: { type: String, required: true },
    completion_date: { type: Date, default: null },
    estimated_duration_days: { type: Number, default: null },

    // ==================== KHÁCH HÀNG & DỊCH VỤ ====================
    guest_count: { type: Number, default: 1 },
    guest_times: { type: [String], default: [] },
    selected_services: { type: [Number], default: [] },

    // ==================== ĐỊA ĐIỂM KHÁCH HÀNG ====================
    location: {
      name: { type: String, default: "" },
      address: { type: String, required: true },
      city: { type: String, default: "" },
      district: { type: String, default: "" },
      map_link: { type: String, default: "" },
      // ✅ THÊM TỌA ĐỘ GPS CỦA KHÁCH
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

    // ==================== THANH TOÁN ====================
    // Giá dịch vụ (chưa bao gồm phí di chuyển)
    service_amount: { type: Number, required: true },
    
    // Phí di chuyển
    travel_fee_amount: { type: Number, default: 0 },
    
    // Tổng trước giảm giá (service + travel)
    total_amount: { type: Number, required: true },
    
    discount_amount: { type: Number, default: 0 },
    
    // Tổng sau giảm giá
    final_amount: { type: Number, required: true },

    // ✅ THÔNG TIN CỌC 30%
    deposit_required: {
      type: Number,
      required: true,
      default: function() {
        return Math.round(this.final_amount * 0.3);
      }
    },

    deposit_paid: { type: Boolean, default: false },
    deposit_amount: { type: Number, default: 0 },

    // ✅ THÔNG TIN CHUYỂN KHOẢN
    payment_info: {
      transfer_code: { type: String, default: null },
      transfer_image: { type: String, default: null },
      transfer_date: { type: Date, default: null },
      payment_method_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentMethod",
        default: null
      },
      verified: { type: Boolean, default: false },
      verified_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bangKhachHang",
        default: null
      },
      verified_at: { type: Date, default: null }
    },

    // ==================== TRẠNG THÁI ====================
    status: {
      type: String,
      enum: [
        "pending_payment",
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled"
      ],
      default: "pending_payment",
    },

    // ==================== LỊCH SỬ TRẠNG THÁI ====================
    status_history: [{
      status: String,
      changed_at: { type: Date, default: Date.now },
      changed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bangKhachHang"
      },
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
    this.deposit_required = Math.round(this.final_amount * 0.3);
  }
  next();
});

export default mongoose.model("Orders", orderSchema);