// src/models/resettoken.model.js
import mongoose from "mongoose";

const resetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KhachHang", // hoặc "User" nếu bạn đặt tên khác trong model khách hàng
      required: true,
    },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const ResetToken = mongoose.model("ResetToken", resetTokenSchema);

export default ResetToken;
