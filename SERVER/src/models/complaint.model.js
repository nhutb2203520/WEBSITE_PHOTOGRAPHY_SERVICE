import mongoose from "mongoose";

const ComplaintSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Orders", 
      required: true,
      unique: true 
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangKhachHang",
      required: true
    },
    // 👇 ĐÃ SỬA: Trỏ về bangKhachHang vì bạn không có bảng thợ riêng
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
        'pending',  // Đang chờ duyệt (Mặc định khi mới tạo)
        'resolved', // Khiếu nại thành công (Admin chấp nhận -> Khách thắng)
        'rejected'  // Khiếu nại thất bại (Admin từ chối -> Khách thua)
      ],
      default: 'pending'
    },

    // Phản hồi của Admin (Lý do chấp nhận hoặc từ chối)
    admin_response: {
      type: String,
      default: ""
    },
    
    // Người giải quyết (Admin ID)
    resolved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Hoặc "User" tùy vào hệ thống admin của bạn
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'complaints'
  }
);

export default mongoose.model("Complaint", ComplaintSchema);