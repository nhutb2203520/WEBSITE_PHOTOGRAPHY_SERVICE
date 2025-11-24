// src/models/index.js
import mongoose from 'mongoose';

// ✅ Import KhachHang TRƯỚC
import KhachHangModel from './khachhang.model.js';

// ✅ Import ServicePackage
import ServicePackageModel from './servicePackage.model.js';

// ✅ Import Review
import ReviewModel from './review.model.js';

// ✅ Import PaymentMethod
import PaymentMethodModel from './paymentmethod.model.js';
//import WorksProfileModel from './worksprofile.model.js'; 
import ScheduleModel from './schedule.model.js';
// Export named exports
// ✅ SỬA: Sử dụng mongoose.models.KhachHang thay vì bangKhachHang
export const KhachHang = mongoose.models.KhachHang || KhachHangModel;
export const ServicePackage = mongoose.models.ServicePackage || ServicePackageModel;
export const Review = mongoose.models.Review || ReviewModel;
export const PaymentMethod = mongoose.models.PaymentMethod || PaymentMethodModel;
export const Schedule = mongoose.models.Schedule || ScheduleModel;
//export const WorksProfileModel = mongoose.models.WorksProfileModel || WorksProfileModel;
console.log('✅ All models registered successfully');
console.log('📦 Available models:', Object.keys(mongoose.models));