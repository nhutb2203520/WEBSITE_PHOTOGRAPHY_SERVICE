import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    OrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Orders', // Đảm bảo khớp với tên model trong order.model.js
      required: true,
    },
    PackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServicePackage',
      required: true,
    },
    // Quan trọng: ref trỏ về 'bangKhachHang' vì hệ thống dùng chung bảng user
    PhotographerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'bangKhachHang', 
      required: true,
    },
    CustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'bangKhachHang',
      required: true,
    },
    Rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    Comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    Images: [{ type: String }],
    is_edited: { type: Boolean, default: false },
    Status: {
      type: String,
      enum: ['pending', 'approved', 'hidden'],
      default: 'approved',
    }
  },
  { timestamps: true }
);

// Index để tìm kiếm nhanh
ReviewSchema.index({ PackageId: 1 });
ReviewSchema.index({ PhotographerId: 1 });
ReviewSchema.index({ OrderId: 1 }, { unique: true }); // Mỗi đơn chỉ 1 review

// Middleware tính điểm trung bình (Xử lý an toàn)
ReviewSchema.post('save', async function() {
  try {
      // Kiểm tra xem model ServicePackage đã được load chưa
      if (mongoose.models.ServicePackage) {
          const ServicePackage = mongoose.model('ServicePackage');
          const Review = mongoose.model('Review');
          
          const reviews = await Review.find({ PackageId: this.PackageId, Status: 'approved' });
          
          let avgRating = 0;
          let count = 0;

          if (reviews.length > 0) {
              const total = reviews.reduce((sum, r) => sum + r.Rating, 0);
              avgRating = (total / reviews.length).toFixed(1);
              count = reviews.length;
          }
          
          await ServicePackage.findByIdAndUpdate(this.PackageId, {
              DanhGia: parseFloat(avgRating),
              SoLuotDanhGia: count
          });
          console.log(`✅ Đã cập nhật rating gói ${this.PackageId}: ${avgRating} sao (${count} lượt)`);
      }
  } catch (err) {
      console.warn("⚠️ Không thể cập nhật rating service package (có thể do chưa import model):", err.message);
  }
});

export default mongoose.model("Review", ReviewSchema);