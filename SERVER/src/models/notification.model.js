import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "bangKhachHang", 
      required: true 
    }, 
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['ORDER', 'PAYMENT', 'ALBUM', 'SYSTEM', 'PROMOTION', 'COMPLAINT'], 
      default: 'SYSTEM' 
    },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false }, 
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);