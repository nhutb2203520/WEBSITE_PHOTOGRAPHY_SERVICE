import mongoose from "mongoose";

const notificationAdminSchema = new mongoose.Schema(
  {
    adminId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Admin", // Hoặc "User" nếu bạn dùng chung bảng User cho admin
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['ORDER', 'PAYMENT', 'COMPLAINT', 'SYSTEM', 'USER'], 
      default: 'SYSTEM' 
    },
    link: { type: String, default: "" }, // Link để Admin click vào xử lý nhanh
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("NotificationAdmin", notificationAdminSchema);