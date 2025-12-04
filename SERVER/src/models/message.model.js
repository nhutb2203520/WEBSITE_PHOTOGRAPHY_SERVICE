import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "bangKhachHang" },
    text: { type: String },
    images: [{ type: String }], // Mảng url ảnh nếu có
    type: { type: String, enum: ['text', 'image', 'system'], default: 'text' }, // system: thông báo hệ thống
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);