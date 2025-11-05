import mongoose from "mongoose";

const trangThaiKhachHangSchema = new mongoose.Schema(
  {
    TenTT: { type: String, required: true },
    MoTa: { type: String, default: "" },
  },
  { timestamps: true }
);

const TrangThaiKhachHang = mongoose.model(
  "bangTTKhachHang",
  trangThaiKhachHangSchema
);

export default TrangThaiKhachHang;