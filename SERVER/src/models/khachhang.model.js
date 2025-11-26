import mongoose from "mongoose";
import counterModel from "./counter.js";

const khachHangSchema = new mongoose.Schema(
  {
    MaKhachHang: { type: String, unique: true },
    TenDangNhap: { type: String, required: true },
    HoTen: { type: String, required: true },
    NgaySinh: { type: Date },
    GioiTinh: { type: String },
    DiaChi: { type: String },
    SoDienThoai: { type: String },
    Password: { type: String },
    Email: { type: String, required: true },
    
    // --- Cập nhật: Thông tin ngân hàng ---
    SoTaiKhoan: { type: String, default: "" },
    TenNganHang: { type: String, default: "" },
    TenChuTaiKhoan: { type: String, default: "" },
    ChiNhanhNganHang: { type: String, default: "" },
    // ------------------------------------

    Avatar: {
      type: String,
      default: "",
    },
    CoverImage: {
      type: String,
      default: "",
    },
    RefreshToken: { type: String },
    MaTT: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangTTKhachHang",
      required: true,
    },
    isPhotographer: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    minimize: false,
    collection: "KHACHHANG",
  }
);

khachHangSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await counterModel.findOneAndUpdate(
      { _id: "khachhang" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.MaKhachHang = "KH" + String(counter.seq).padStart(4, "0");
  }
  next();
});

const KhachHang = mongoose.models.bangKhachHang || mongoose.model("bangKhachHang", khachHangSchema);
export default KhachHang;