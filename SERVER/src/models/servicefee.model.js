import mongoose from "mongoose";

const serviceFeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // VD: "Phí quản lý sàn"
    percentage: { type: Number, required: true, min: 0, max: 100 }, // VD: 10 (tức là 10%)
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true }, // Để bật/tắt phí này
  },
  { timestamps: true }
);

export default mongoose.model("ServiceFee", serviceFeeSchema);