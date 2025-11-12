import mongoose from 'mongoose';

const ServicePackageSchema = new mongoose.Schema(
  {
    TenGoi: {
      type: String,
      required: [true, 'Tên gói dịch vụ là bắt buộc'],
      trim: true,
    },
    
    MoTa: {
      type: String,
      required: [true, 'Mô tả gói dịch vụ là bắt buộc'],
    },
    
    // ✅ FIX: Mỗi dịch vụ có tên + giá riêng
    DichVu: [{
      name: {
        type: String,
        required: true,
        trim: true,
      },
      Gia: {
        type: Number,
        required: true,
        min: 0,
      }
    }],
    
    // ✅ REMOVED: Không cần Gia ở cấp gói nữa
    // Gia: { ... }
    
    AnhBia: {
      type: String,
      default: null,
    },
    
    // ✅ Đánh giá trung bình (tính từ reviews)
    DanhGia: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    
    // ✅ Số lượt đánh giá
    SoLuotDanhGia: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    PhotographerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KhachHang',
      required: [true, 'Photographer ID là bắt buộc'],
    },
    
    TrangThai: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active',
    },
    
    // ✅ Số lượng đã đặt (qua đơn hàng)
    SoLuongDaDat: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    ThoiGianThucHien: {
      type: String,
      default: null,
    },
    
    LoaiGoi: {
      type: String,
      enum: ['Wedding', 'Event', 'Family', 'Portrait', 'Product', 'Fashion', 'Other'],
      default: 'Other',
    },
    
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'servicepackages',
  }
);

// ✅ Index để tìm kiếm nhanh
ServicePackageSchema.index({ PhotographerId: 1, TrangThai: 1 });
ServicePackageSchema.index({ LoaiGoi: 1, TrangThai: 1 });
ServicePackageSchema.index({ DanhGia: -1 });
ServicePackageSchema.index({ SoLuongDaDat: -1 });

// ✅ Virtual: Tổng giá gói (sum of all services)
ServicePackageSchema.virtual('TongGia').get(function() {
  if (!this.DichVu || this.DichVu.length === 0) return 0;
  return this.DichVu.reduce((total, service) => total + (service.Gia || 0), 0);
});

// ✅ Virtual: Đánh giá trung bình
ServicePackageSchema.virtual('avgRating').get(function() {
  return this.SoLuotDanhGia > 0 
    ? (this.DanhGia / this.SoLuotDanhGia).toFixed(1) 
    : 0;
});

// ✅ Middleware: Ẩn các gói đã xóa
ServicePackageSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// ✅ Method: Thêm đánh giá mới
ServicePackageSchema.methods.addReview = function(rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('Đánh giá phải từ 1 đến 5 sao');
  }
  
  const currentTotal = this.DanhGia * this.SoLuotDanhGia;
  const newTotal = currentTotal + rating;
  const newCount = this.SoLuotDanhGia + 1;
  
  this.DanhGia = newTotal / newCount;
  this.SoLuotDanhGia = newCount;
  
  return this.save();
};

// ✅ Method: Tăng số lượt đặt
ServicePackageSchema.methods.incrementBooking = function() {
  this.SoLuongDaDat += 1;
  return this.save();
};

// ✅ Ensure virtuals are included in JSON
ServicePackageSchema.set('toJSON', { virtuals: true });
ServicePackageSchema.set('toObject', { virtuals: true });

const ServicePackage = mongoose.model('ServicePackage', ServicePackageSchema);

export default ServicePackage;