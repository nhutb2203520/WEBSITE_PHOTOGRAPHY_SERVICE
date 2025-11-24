import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema(
  {
    photographerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KhachHang", // Lưu ý: Đảm bảo model User/Photographer của bạn tên là "KhachHang"
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["order", "personal", "busy"], 
      default: "personal",
    },
    isRemind: {
      type: Boolean,
      default: false
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      // ✅ QUAN TRỌNG: Phải khớp chính xác với tên trong mongoose.model("Orders", ...) bên file order.model.js
      ref: "Orders", 
      default: null, 
    },
  },
  { timestamps: true }
);

ScheduleSchema.index({ photographerId: 1, date: 1 });

const Schedule = mongoose.model("Schedule", ScheduleSchema);
export default Schedule;