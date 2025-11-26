import mongoose from 'mongoose';

// ============================================================
// 1. IMPORT TẤT CẢ CÁC MODEL
// (Thứ tự không quá quan trọng, nhưng nên để User/Base lên đầu)
// ============================================================

import AdminModel from './admin.model.js';
import KhachHangModel from './khachhang.model.js'; // Model User (bangKhachHang)
import WorksProfileModel from './worksprofile.model.js';

import ServicePackageModel from './servicePackage.model.js';
import PaymentMethodModel from './paymentmethod.model.js';

import OrderModel from './order.model.js';
import ScheduleModel from './schedule.model.js';

import ReviewModel from './review.model.js';
import ComplaintModel from './complaint.model.js';
import AlbumModel from './album.model.js';

// ============================================================
// 2. EXPORT NAMED IMPORTS
// (Giúp sử dụng destructuring: import { Order, Complaint } from './models')
// ============================================================

// Lưu ý: mongoose.models.[Tên_Trong_Schema]
// Ví dụ: mongoose.model('bangKhachHang', Schema) -> key là bangKhachHang

export const Admin = mongoose.models.Admin || AdminModel;
export const KhachHang = mongoose.models.bangKhachHang || mongoose.models.KhachHang || KhachHangModel;
export const WorksProfile = mongoose.models.WorksProfile || WorksProfileModel;

export const ServicePackage = mongoose.models.ServicePackage || ServicePackageModel;
export const PaymentMethod = mongoose.models.PaymentMethod || PaymentMethodModel;

export const Order = mongoose.models.Orders || mongoose.models.Order || OrderModel;
export const Schedule = mongoose.models.Schedule || ScheduleModel;

export const Review = mongoose.models.Review || ReviewModel;
export const Complaint = mongoose.models.Complaint || ComplaintModel;
export const Album = mongoose.models.Album || AlbumModel;

// ============================================================
// 3. LOG KIỂM TRA
// ============================================================
console.log('----------------------------------------------------');
console.log('✅ All models registered successfully via index.js');
console.log('📦 Available Mongoose Models:', Object.keys(mongoose.models));
console.log('----------------------------------------------------');