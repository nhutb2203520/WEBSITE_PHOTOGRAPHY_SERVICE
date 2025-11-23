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
    
    AnhBia: {
      type: String,
      default: null,
    },
    
    Images: [{
      type: String
    }],
    
    // --- ĐÁNH GIÁ & UY TÍN ---
    DanhGia: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    
    SoLuotDanhGia: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ✅ MỚI: Tổng số khiếu nại đã được Admin xác nhận (Confirmed Faults)
    SoLuongKhieuNai: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    
    PhotographerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KhachHang', // Đảm bảo tên model tham chiếu đúng với dự án của bạn
      required: [true, 'Photographer ID là bắt buộc'],
    },
    
    TrangThai: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active',
    },
    
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

    // ==================== GEOJSON LOCATION ====================
    baseLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0]
      },
      address: {
        type: String,
        default: ''
      },
      city: {
        type: String,
        default: ''
      },
      district: {
        type: String,
        default: ''
      },
      mapLink: {
        type: String,
        default: ''
      }
    },

    // ==================== CẤU HÌNH PHÍ DI CHUYỂN ====================
    travelFeeConfig: {
      enabled: {
        type: Boolean,
        default: false
      },
      freeDistanceKm: {
        type: Number,
        default: 10,
        min: 0
      },
      feePerKm: {
        type: Number,
        default: 5000,
        min: 0
      },
      tieredFees: [{
        minKm: { type: Number, required: true },
        maxKm: { type: Number, default: null },
        feePerKm: { type: Number, required: true }
      }],
      maxFee: {
        type: Number,
        default: null
      },
      note: {
        type: String,
        default: ''
      }
    }
  },
  {
    timestamps: true,
    collection: 'servicepackages',
  }
);

// Index
ServicePackageSchema.index({ PhotographerId: 1, TrangThai: 1 });
ServicePackageSchema.index({ LoaiGoi: 1, TrangThai: 1 });
ServicePackageSchema.index({ DanhGia: -1 });
ServicePackageSchema.index({ SoLuongDaDat: -1 });
ServicePackageSchema.index({ 'baseLocation.coordinates': '2dsphere' });

// Virtual: Tổng giá gói
ServicePackageSchema.virtual('TongGia').get(function() {
  if (!this.DichVu || this.DichVu.length === 0) return 0;
  return this.DichVu.reduce((total, service) => total + (service.Gia || 0), 0);
});

// ==================== METHOD TÍNH PHÍ DI CHUYỂN ====================
ServicePackageSchema.statics.calculateDistance = function(lat1, lng1, lat2, lng2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; 
};

ServicePackageSchema.methods.calculateTravelFee = function(distanceKm) {
  const config = this.travelFeeConfig;
  
  if (!config?.enabled) {
    return { fee: 0, breakdown: 'Không tính phí di chuyển', distanceKm };
  }
  
  if (distanceKm <= config.freeDistanceKm) {
    return { 
      fee: 0, 
      breakdown: `Trong khoảng cách miễn phí (${config.freeDistanceKm}km)`,
      distanceKm,
      freeDistanceKm: config.freeDistanceKm
    };
  }
  
  const extraKm = distanceKm - config.freeDistanceKm;
  let fee = 0;
  let breakdown = '';
  
  if (config.tieredFees && config.tieredFees.length > 0) {
    let remainingKm = extraKm;
    const details = [];
    
    for (const tier of config.tieredFees.sort((a, b) => a.minKm - b.minKm)) {
      if (remainingKm <= 0) break;
      
      const tierStart = Math.max(0, tier.minKm - config.freeDistanceKm);
      const tierEnd = tier.maxKm ? tier.maxKm - config.freeDistanceKm : Infinity;
      const tierKm = Math.min(remainingKm, tierEnd - tierStart);
      
      if (tierKm > 0) {
        const tierFee = tierKm * tier.feePerKm;
        fee += tierFee;
        details.push(`${tierKm.toFixed(1)}km x ${tier.feePerKm.toLocaleString()}đ = ${tierFee.toLocaleString()}đ`);
        remainingKm -= tierKm;
      }
    }
    
    breakdown = details.join(' + ');
  } else {
    fee = extraKm * config.feePerKm;
    breakdown = `${extraKm.toFixed(1)}km x ${config.feePerKm.toLocaleString()}đ/km`;
  }
  
  if (config.maxFee && fee > config.maxFee) {
    fee = config.maxFee;
    breakdown += ` (Giới hạn tối đa: ${config.maxFee.toLocaleString()}đ)`;
  }
  
  return {
    fee: Math.round(fee),
    breakdown,
    distanceKm,
    extraKm: Math.round(extraKm * 100) / 100,
    freeDistanceKm: config.freeDistanceKm,
    note: config.note || ''
  };
};

// ✅ METHOD CẬP NHẬT RATING (Đổi tên từ addReview để khớp với logic controller)
ServicePackageSchema.methods.updateRating = async function(rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('Đánh giá phải từ 1 đến 5 sao');
  }
  
  // Tính điểm trung bình mới (Weighted Average)
  const currentTotal = this.DanhGia * this.SoLuotDanhGia;
  const newTotal = currentTotal + rating;
  const newCount = this.SoLuotDanhGia + 1;
  
  this.DanhGia = newTotal / newCount;
  this.SoLuotDanhGia = newCount;
  
  return this.save();
};

ServicePackageSchema.methods.incrementBooking = function() {
  this.SoLuongDaDat += 1;
  return this.save();
};

ServicePackageSchema.methods.addImage = function(imageUrl) {
  if (!this.Images) this.Images = [];
  this.Images.push(imageUrl);
  return this.save();
};

ServicePackageSchema.methods.removeImage = function(imageUrl) {
  if (!this.Images) return this.save();
  this.Images = this.Images.filter(img => img !== imageUrl);
  return this.save();
};

ServicePackageSchema.set('toJSON', { virtuals: true });
ServicePackageSchema.set('toObject', { virtuals: true });

const ServicePackage = mongoose.model('ServicePackage', ServicePackageSchema);

export default ServicePackage;