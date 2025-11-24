import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    // ✅ Đơn hàng nào được đánh giá
    OrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order', 
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
      ref: 'KhachHang',
      required: true,
    },
    
    // ✅ Khách hàng đánh giá
    CustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KhachHang',
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
    
    // ✅ Trạng thái chỉnh sửa (Cho phép sửa 1 lần)
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
    
    // ✅ Helpful count (số người thấy hữu ích)
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

// ✅ Index
ReviewSchema.index({ PackageId: 1, Status: 1 });
ReviewSchema.index({ PhotographerId: 1, Status: 1 });
ReviewSchema.index({ CustomerId: 1 });
ReviewSchema.index({ OrderId: 1 }, { unique: true }); // Mỗi đơn chỉ đánh giá 1 lần

// ✅ Middleware: Tự động cập nhật rating của package khi tạo/xóa/sửa review
const updatePackageRating = async (packageId, ServicePackage) => {
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
  const avgRating = totalRating / reviews.length;
  
  await ServicePackage.findByIdAndUpdate(packageId, {
    DanhGia: avgRating,
    SoLuotDanhGia: reviews.length
  });
};

ReviewSchema.post('save', async function() {
  const ServicePackage = mongoose.model('ServicePackage');
  await updatePackageRating(this.PackageId, ServicePackage);
});

ReviewSchema.post('remove', async function() {
  const ServicePackage = mongoose.model('ServicePackage');
  await updatePackageRating(this.PackageId, ServicePackage);
});

const Review = mongoose.model('Review', ReviewSchema);

export default Review;