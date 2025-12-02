import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    CustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangKhachHang", // ✅ Phải khớp với tên model Khách Hàng
      required: true,
    },
    Type: {
      type: String,
      enum: ["package", "photographer"],
      required: true,
    },
    // ID gói dịch vụ (nếu type là package)
    ServicePackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServicePackage", // ✅ Phải khớp với tên model ServicePackage
      default: null,
    },
    // ID nhiếp ảnh gia (nếu type là photographer)
    PhotographerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangKhachHang", // ✅ Phải khớp với tên model Khách Hàng
      default: null,
    },
  },
  { timestamps: true }
);

// Index để tránh trùng lặp
favoriteSchema.index({ CustomerId: 1, Type: 1, ServicePackageId: 1, PhotographerId: 1 }, { unique: true });

export default mongoose.model("Favorite", favoriteSchema);