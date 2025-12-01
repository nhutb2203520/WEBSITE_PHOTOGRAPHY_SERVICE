import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "bangKhachHang", 
      required: true 
    }, // Người nhận thông báo
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['ORDER', 'PAYMENT', 'ALBUM', 'SYSTEM', 'PROMOTION'], 
      default: 'SYSTEM' 
    },
    link: { type: String, default: "" }, // Đường dẫn khi click vào (VD: /my-orders)
    isRead: { type: Boolean, default: false }, // Trạng thái đã xem
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);