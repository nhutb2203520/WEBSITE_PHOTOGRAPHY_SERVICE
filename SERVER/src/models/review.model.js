import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    // ✅ Đơn hàng nào được đánh giá
    OrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Orders', // 🔥 [SỬA LẠI] Khớp với tên model trong order.model.js
      required: true,
    },
    
    // ✅ Gói dịch vụ được đánh giá
    PackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServicePackage',
      required: true,
    },
    
    // ✅ Photographer bị đánh giá
    PhotographerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'bangKhachHang', // 🔥 [SỬA LẠI] Khớp với tên model User của bạn
      required: true,
    },
    
    // ✅ Khách hàng đánh giá
    CustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'bangKhachHang', // 🔥 [SỬA LẠI] Khớp với tên model User của bạn
      required: true,
    },
    
    // ✅ Số sao (1-5)
    Rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    
    // ✅ Nội dung đánh giá
    Comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    
    // ✅ Ảnh đính kèm (optional)
    Images: [{
      type: String,
    }],
    
    // ✅ Trạng thái chỉnh sửa
    is_edited: {
        type: Boolean,
        default: false
    },

    // ✅ Trạng thái
    Status: {
      type: String,
      enum: ['pending', 'approved', 'hidden'],
      default: 'approved',
    },
    
    HelpfulCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'reviews',
  }
);

// Index
ReviewSchema.index({ PackageId: 1, Status: 1 });
ReviewSchema.index({ PhotographerId: 1, Status: 1 });
ReviewSchema.index({ CustomerId: 1 });
ReviewSchema.index({ OrderId: 1 }, { unique: true });

// --- MIDDLEWARE TÍNH ĐIỂM ĐÁNH GIÁ TRUNG BÌNH ---
const updatePackageRating = async (packageId, ServicePackage) => {
  try {
      const Review = mongoose.model('Review');
      
      const reviews = await Review.find({
        PackageId: packageId,
        Status: 'approved'
      });
      
      if (reviews.length === 0) {
        await ServicePackage.findByIdAndUpdate(packageId, {
          DanhGia: 0,
          SoLuotDanhGia: 0
        });
        return;
      }
      
      const totalRating = reviews.reduce((sum, r) => sum + r.Rating, 0);
      const avgRating = (totalRating / reviews.length).toFixed(1); // Làm tròn 1 số thập phân
      
      await ServicePackage.findByIdAndUpdate(packageId, {
        DanhGia: parseFloat(avgRating),
        SoLuotDanhGia: reviews.length
      });
  } catch (err) {
      console.error("Lỗi cập nhật rating package:", err);
  }
};

ReviewSchema.post('save', async function() {
  // Cần try-catch để tránh crash nếu model chưa đăng ký
  try {
      const ServicePackage = mongoose.model('ServicePackage');
      await updatePackageRating(this.PackageId, ServicePackage);
  } catch (e) { console.log("ServicePackage model chưa load"); }
});

export default mongoose.model("Review", ReviewSchema);