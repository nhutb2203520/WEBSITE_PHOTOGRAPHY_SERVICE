import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "bangKhachHang" }], 
    
    type: { 
        type: String, 
        enum: ['private', 'group', 'complaint'], 
        default: 'private' 
    },
    complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", default: null }, 
    
    title: { type: String, default: "" },

    lastMessage: {
      text: { type: String },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "bangKhachHang" },
      images: [{ type: String }],
      //QUAN TRỌNG: Mảng chứa ID những người đã xem tin nhắn cuối cùng
      readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "bangKhachHang" }],
      createdAt: { type: Date, default: Date.now }
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);