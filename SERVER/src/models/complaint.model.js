import mongoose from "mongoose";

const ComplaintSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Orders", // Đảm bảo khớp với tên model Order của bạn
      required: true,
      unique: true 
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangKhachHang",
      required: true
    },
    photographer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangKhachHang" 
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    images: [{
      type: String
    }],

    // --- TRẠNG THÁI KHIẾU NẠI ---
    status: {
      type: String,
      enum: [
        'pending',  // Đang chờ xử lý
        'resolved', // Đã giải quyết xong (Thỏa thuận thành công)
        'rejected'  // Bị từ chối
      ],
      default: 'pending'
    },

    // Phản hồi của Admin
    admin_response: {
      type: String,
      default: ""
    },
    
    // Người giải quyết (Admin ID)
    resolved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Hoặc "User" tùy hệ thống Auth của bạn
      default: null
    },

    // --- [NEW] CHI TIẾT GIẢI QUYẾT TÀI CHÍNH (THỦ CÔNG) ---
    resolution_details: {
        refund_amount: { type: Number, default: 0 },       // Tiền đã hoàn lại cho khách
        photographer_amount: { type: Number, default: 0 }, // Tiền đã trả cho thợ
        system_fee: { type: Number, default: 0 },          // Phí sàn giữ lại
        
        // Ảnh biên lai Admin đã banking (Bằng chứng thanh toán)
        refund_proof_image: { type: String, default: "" }, 
        payout_proof_image: { type: String, default: "" }
    }
  },
  {
    timestamps: true,
    collection: 'complaints'
  }
);

export default mongoose.model("Complaint", ComplaintSchema);