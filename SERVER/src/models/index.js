// SERVER/src/models/index.js
// ✅ File này đảm bảo tất cả models được load theo đúng thứ tự

import mongoose from 'mongoose';

// ✅ CRITICAL: Import KhachHang TRƯỚC vì các models khác reference đến nó
// Đảm bảo đúng tên file model của bạn
import KhachHangModel from './khachhang.model.js';

// ✅ Import ServicePackage (phụ thuộc vào KhachHang)
import ServicePackageModel from './servicePackage.model.js';

// ✅ Import Review (phụ thuộc vào ServicePackage và KhachHang)
import ReviewModel from './review.model.js';

// ✅ Import các models khác nếu có (theo đúng thứ tự dependency)
// import OrderModel from './order.model.js';
// import BookingModel from './booking.model.js';
// import WorksProfileModel from './worksProfile.model.js';

// ✅ Export named exports để dễ dàng import
// Sử dụng model name CHÍNH XÁC từ schema
export const KhachHang = mongoose.models.bangKhachHang || KhachHangModel;
export const ServicePackage = mongoose.models.ServicePackage || ServicePackageModel;
export const Review = mongoose.models.Review || ReviewModel;

console.log('✅ All models registered successfully');
console.log('📦 Available models:', Object.keys(mongoose.models));